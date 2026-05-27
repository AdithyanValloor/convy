import { Router } from "express";
import {
  getNotificationSettingsController,
  updateNotificationSettingsController,
} from "../controllers/user.notificationSettings.controller.js";
import { protect } from "../../auth/auth.middleware.js";

const router = Router();

/** Notification settings routes for authenticated users. */

// Notification preference read and update routes.
router.get("/", protect, getNotificationSettingsController);
router.patch("/", protect, updateNotificationSettingsController);

export { router as notificationSettingsRouter };
