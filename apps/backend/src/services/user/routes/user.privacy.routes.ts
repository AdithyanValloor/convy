import { Router } from "express";
import {
  getPrivacyController,
  updatePrivacyController,
} from "../controllers/user.privacy.controller.js";
import { protect } from "../../auth/middleware/auth.middleware.js";

const router = Router();

/** Privacy routes for authenticated users. */

// Privacy preference read and update routes.
router.get("/", protect, getPrivacyController);
router.patch("/", protect, updatePrivacyController);

export { router as privacyRouter };
