import { Router } from "express";
import {
  deactivateAccountController,
  scheduleAccountDeletionController,
  cancelScheduledDeletionController,
} from "../controllers/user.account.controller.js";
import { protect } from "../../auth/middleware/auth.middleware.js";
import { updateUsernameController } from "../controllers/profile.controller.js";

const router = Router();

/** Account management routes for authenticated users. */

// Username and email management routes.
router.patch("/username", protect, updateUsernameController);

// Account state management routes.
router.patch("/deactivate", protect, deactivateAccountController);

// Account deletion scheduling routes.
router.post("/deletion/schedule", protect, scheduleAccountDeletionController);
router.post("/deletion/cancel", protect, cancelScheduledDeletionController);

export { router as accountRouter };
