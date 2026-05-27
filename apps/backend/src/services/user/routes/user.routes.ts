import { Router } from "express";
import {
  sendOtp,
  verifyOtp,
  register,
  login,
  logout,
  refreshToken,
  currentUser,
} from "../controllers/user.controller.js";
import { protect } from "../../auth/auth.middleware.js";
import { accountRouter } from "./user.account.routes.js";
import { privacyRouter } from "./user.privacy.routes.js";
import { notificationSettingsRouter } from "./user.notificationSettings.routes.js";

const router = Router();

/** User auth and settings routes for public onboarding and authenticated account access. */

// Registration OTP routes.
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Public authentication routes.
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

// Authenticated user context.
router.get("/me", protect, currentUser);

// User settings sub-routes.
router.use("/account", accountRouter);
router.use("/privacy", privacyRouter);
router.use("/notification-settings", notificationSettingsRouter);

export { router as userRouter };
