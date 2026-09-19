import { Router } from "express";
import {
  changePasswordController,
  checkPasswordController,
  login,
  logout,
  refreshToken,
  register,
  sendEmailChangeOtpController,
  sendOtp,
  updateEmailController,
  verifyOtp,
  forgotPasswordController,
  sendForgotPasswordOtp
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/protect.js";

const router = Router();

// OTP routes.
router.post("/send-otp", sendOtp);

router.post("/forgot-password-send-otp", sendForgotPasswordOtp);

router.post("/verify-otp", verifyOtp);

// Public authentication routes.
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

// Sensitive-action password verification route.
router.post("/check-password", protect, checkPasswordController);


router.post("/email/send-otp", protect, sendEmailChangeOtpController);
router.patch("/email", protect, updateEmailController);

// Password and account state management.
router.patch("/password", protect, changePasswordController);

router.patch("/forgot-password", forgotPasswordController);

export { router as authRouter };
