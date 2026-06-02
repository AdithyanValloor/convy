import { Router } from "express";
import {
  getNotificationSettingsController,
  updateNotificationSettingsController,
} from "../controllers/user.preferences.controller.js";
import { protect } from "../../auth/middleware/auth.middleware.js";

const router = Router();

/** Notification settings routes for authenticated users. */

// Notification preference read and update routes.
router.get("/", protect, getNotificationSettingsController);
router.patch("/", protect, updateNotificationSettingsController);

export { router as notificationSettingsRouter };
