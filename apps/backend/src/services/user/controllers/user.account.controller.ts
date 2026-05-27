import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/authRequest.js";
import { Unauthorized } from "../../../utils/errors/httpErrors.js";
import {
  updateUsername,
  changePassword,
  deactivateAccount,
  scheduleAccountDeletion,
  cancelScheduledDeletion,
  sendEmailChangeOtp,
  verifyAndUpdateEmail,
} from "../services/user.account.service.js";

/** User account controller handlers for authenticated account management actions. */

/** Updates the authenticated user's username. */
export const updateUsernameController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { username } = req.body;
    const updatedUser = await updateUsername(userId, username);

    res.status(200).json({
      success: true,
      message: "Username updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

/** Changes the authenticated user's password. */
export const changePasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { currentPassword, newPassword } = req.body;

    await changePassword(userId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    next(err);
  }
};

/** Deactivates the authenticated user's account until they log in again. */
export const deactivateAccountController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    await deactivateAccount(userId);

    res.status(200).json({
      success: true,
      message: "Account deactivated. You can reactivate by logging in again.",
    });
  } catch (err) {
    next(err);
  }
};

/** Schedules account deletion after confirming the user's password. */
export const scheduleAccountDeletionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { password } = req.body;
    const { scheduledDeletionAt } = await scheduleAccountDeletion(
      userId,
      password,
    );

    res.status(200).json({
      success: true,
      message:
        "Account deletion scheduled. You may cancel before the grace period expires.",
      data: { scheduledDeletionAt },
    });
  } catch (err) {
    next(err);
  }
};

/** Cancels a previously scheduled account deletion. */
export const cancelScheduledDeletionController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    await cancelScheduledDeletion(userId);

    res.status(200).json({
      success: true,
      message: "Account deletion cancelled. Your account has been restored.",
    });
  } catch (err) {
    next(err);
  }
};

/** Sends an OTP to confirm an email change for the authenticated user. */
export const sendEmailChangeOtpController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { email } = req.body;

    await sendEmailChangeOtp(userId, email);

    res.status(200).json({
      success: true,
      message: "OTP sent",
    });
  } catch (err) {
    next(err);
  }
};

/** Verifies an email-change OTP and saves the new email address. */
export const updateEmailController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { email, otp } = req.body;
    const updatedUser = await verifyAndUpdateEmail(userId, email, otp);

    res.status(200).json({
      success: true,
      message: "Email updated successfully.",
      data: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};
