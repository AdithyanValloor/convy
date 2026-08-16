import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  BadRequest,
  Unauthorized,
  NotFound,
  Conflict,
} from "../../../utils/errors/httpErrors.js";
import { markVerified, isVerified, clearEmail } from "../otp/otpStore.js";
import { validateEmail } from "../utils/email.js";
import { sendOtpToEmail, verifyEmailOtp } from "./otp.service.js";
import * as UserAPI from "../../user/api/user.api.js";

import { CreateAccountData, IAuthRepository } from "../repositories/index.js";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/user.types.js";
import { IAuthUser } from "../models/auth.model.js";
import { randomUUID } from "crypto";
import { UserDTO } from "../../user/types/user.dto.js";
//TODO fix register accessing UserModel when implementing message queue.

/** Authentication service helpers for OTP, registration, login, and refresh flows. */

interface AuthSession {
  user: JwtPayload;
  newAccessToken?: string;
}

export class AuthService {
  constructor(private readonly authRepository: IAuthRepository) {}

  private HASH_SALT = 10;

  private async createAccount(data: CreateAccountData): Promise<{
    authUser: IAuthUser;
    profileUser: UserDTO;
  }> {
    const authUserId = randomUUID();

    const authUser = await this.authRepository.create({
      id: authUserId,
      email: data.email,
      hashedPassword: data.hashedPassword,
    });

    try {
      const profileUser = await UserAPI.createProfile({
        authUserId,
        username: data.username,
        displayName: data.displayName,
      });

      return {
        authUser,
        profileUser,
      };
    } catch (error) {
      try {
        await this.authRepository.deleteById(authUserId);
      } catch (compensationError) {
        console.error(
          "Failed to compensate auth user creation:",
          compensationError,
        );
      }

      throw error;
    }
  }

  async authenticateSession(
    accessToken?: string,
    refreshToken?: string,
  ): Promise<AuthSession> {
    if (!accessToken && !refreshToken) {
      throw Unauthorized("Unauthenticated");
    }

    if (accessToken) {
      try {
        const user = verifyAccessToken(accessToken);
        return {
          user,
          newAccessToken: undefined,
        };
      } catch (err) {
        if (!(err instanceof jwt.TokenExpiredError)) {
          throw Unauthorized("Invalid access token");
        }
      }
    }

    if (!refreshToken) {
      throw Unauthorized("Session expired");
    }

    const decoded = verifyRefreshToken(refreshToken);

    const user = await this.authRepository.findById(decoded.id);
    if (!user) {
      throw Unauthorized("Session invalid");
    }

    const newAccessToken = generateAccessToken({
      id: decoded.id,
      email: decoded.email,
    });

    return {
      user: decoded,
      newAccessToken,
    };
  }

  private async validateNewEmail(userId: string, email: string) {
    const normalized = validateEmail(email);

    const currentUser = await this.authRepository.findById(userId);

    if (!currentUser) throw NotFound("User not found");

    if (currentUser.email === normalized) {
      throw BadRequest("New email must differ from your current email");
    }

    if (
      await this.authRepository.isEmailTakenByAnotherUser(userId, normalized)
    ) {
      throw Conflict("Email is already registered to another account");
    }

    return normalized;
  }

  private buildJwtPayload(user: { id: any; email: string }) {
    return {
      id: user.id,
      email: user.email,
    };
  }

  async sendRegistrationOtp(email: string): Promise<void> {
    if (!email) throw BadRequest("Email is required");

    if (await this.authRepository.emailExists(email)) {
      throw BadRequest("Email already registered");
    }

    await sendOtpToEmail(email);
  }

  async verifyRegistrationOtp(email: string, otp: string): Promise<void> {
    if (!email || !otp) throw BadRequest("Email and OTP are required");

    verifyEmailOtp(email, otp);
    // Verified emails are temporarily marked in the OTP store before registration completes.
    markVerified(email);
  }

  async registerUser(
    displayName: string,
    username: string,
    email: string,
    password: string,
  ) {
    // Registration is only allowed after the OTP flow marks the email as verified.
    if (!(await isVerified(email))) throw BadRequest("Email not verified");

    if (!displayName || !username || !email || !password) {
      throw BadRequest("Missing required fields");
    }

    if (await this.authRepository.emailExists(email)) {
      throw BadRequest("Email already registered");
    }

    if (await UserAPI.userNameExists(username))
      throw Conflict("Username already exists");

    const hashedPassword = await bcrypt.hash(password, this.HASH_SALT);

    const accountData: CreateAccountData = {
      email,
      username,
      displayName,
      hashedPassword,
    };

    const { authUser, profileUser } = await this.createAccount(accountData);

    // Clear the temporary verification marker after successful account creation.
    clearEmail(email);

    return {
      accessToken: generateAccessToken(this.buildJwtPayload(authUser)),
      refreshToken: generateRefreshToken(this.buildJwtPayload(authUser)),
      safeUser: profileUser,
    };
  }

  async loginUser(email: string, password: string) {
    if (!email || !password) throw BadRequest("Email and password required");

    const authUser = await this.authRepository.findByEmail(email);
    if (!authUser) throw Unauthorized("Invalid email or password");

    const match = await bcrypt.compare(password, authUser.hashedPassword);
    if (!match) throw Unauthorized("Invalid email or password");

    const profileUser = await UserAPI.findUserByAuthUserId(authUser.id);

    return {
      accessToken: generateAccessToken(this.buildJwtPayload(authUser)),
      refreshToken: generateRefreshToken(this.buildJwtPayload(authUser)),
      safeUser: profileUser,
    };
  }

  async refreshTokenFunction(token: string) {
    if (!token) throw Unauthorized("Refresh token missing");

    const decoded = verifyRefreshToken(token);

    const user = await this.authRepository.findById(decoded.id);
    if (!user) throw NotFound("User not found");

    return {
      accessToken: generateAccessToken(this.buildJwtPayload(user)),
      user,
    };
  }

  /** Verifies whether a provided password matches the stored hash. */
  async checkPassword(userId: string, password: string) {
    const user = await this.authRepository.findAuthUserForPasswordCheck(userId);
    if (!user) throw NotFound("User not found");

    const isMatch = await bcrypt.compare(password, user.hashedPassword);

    return { isMatch };
  }

  /** Replaces a user's password after confirming the current password. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!newPassword || newPassword.length < 8) {
      throw BadRequest("New password must be at least 8 characters");
    }

    const user = await this.authRepository.findAuthUserForPasswordCheck(userId);
    if (!user) throw NotFound("User not found");

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);

    if (!isMatch) {
      throw Unauthorized("Current password is incorrect");
    }

    const newHashedPassword = await bcrypt.hash(newPassword, this.HASH_SALT);
    await this.authRepository.updatePassword(userId, newHashedPassword);
  }

  /** Generates and emails an OTP for confirming a new email address. */
  async sendEmailChangeOtp(userId: string, newEmail: string): Promise<void> {
    const normalized = await this.validateNewEmail(userId, newEmail);
    await sendOtpToEmail(normalized);
  }

  /** Verifies an email-change OTP and persists the new email address. */
  async verifyAndUpdateEmail(
    userId: string,
    newEmail: string,
    otp: string,
  ): Promise<ReturnType<typeof this.updateEmail>> {
    const normalized = await this.validateNewEmail(userId, newEmail);

    if (!otp) throw BadRequest("OTP is required");

    verifyEmailOtp(normalized, otp);

    const updatedUser = await this.updateEmail(userId, normalized);

    clearEmail(normalized);

    return updatedUser;
  }

  /** Updates a user's email after format and uniqueness validation. */
  async updateEmail(userId: string, newEmail: string) {
    const user = await this.authRepository.updateEmail(userId, newEmail);

    if (!user) throw NotFound("User not found");

    return user;
  }
}
