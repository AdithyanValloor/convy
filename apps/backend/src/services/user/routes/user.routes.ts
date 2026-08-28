import { Router } from "express";
import { accountRouter } from "./user.account.routes.js";
import { privacyRouter } from "./user.privacy.routes.js";
import { notificationSettingsRouter } from "./user.preferences.routes.js";
import { currentUser } from "../controllers/user.controller.js";
import { protect } from "../../../utils/middleware/protect.js";

const router = Router();

/** User auth and settings routes for public onboarding and authenticated account access. */

// Authenticated user context.
router.get("/me", protect, currentUser);

// User settings sub-routes.
router.use("/account", accountRouter);
router.use("/privacy", privacyRouter);
router.use("/notification-settings", notificationSettingsRouter);

export { router as userRouter };
