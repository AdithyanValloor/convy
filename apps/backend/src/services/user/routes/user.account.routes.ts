import { Router } from "express";
import {
  updateUsernameController,
  updateEmailController,
  changePasswordController,
  deactivateAccountController,
  scheduleAccountDeletionController,
  cancelScheduledDeletionController,
  sendEmailChangeOtpController,
} from "../controllers/user.account.controller.js";
import { protect } from "../../auth/auth.middleware.js";
import { checkPasswordController } from "../controllers/user.controller.js";

const router = Router();

/** Account management routes for authenticated users. */

// Username and email management routes.
router.patch("/username", protect, updateUsernameController);
router.post("/email/send-otp", protect, sendEmailChangeOtpController);
router.patch("/email", protect, updateEmailController);

// Password and account state management.
router.patch("/password", protect, changePasswordController);
router.patch("/deactivate", protect, deactivateAccountController);

// Account deletion scheduling routes.
router.post("/deletion/schedule", protect, scheduleAccountDeletionController);
router.post("/deletion/cancel", protect, cancelScheduledDeletionController);

// Sensitive-action password verification route.
router.post("/check-password", protect, checkPasswordController);

export { router as accountRouter };
