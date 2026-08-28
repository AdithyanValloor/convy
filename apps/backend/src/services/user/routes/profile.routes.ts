import { Router } from "express";
import { editProfile, viewProfile } from "../controllers/profile.controller.js";
import { protect } from "../../../utils/middleware/protect.js";

const router = Router();

/** Profile routes for authenticated profile access and updates. */

// Profile read and update routes for the authenticated user.
router.get("/", protect, viewProfile);
router.put("/", protect, editProfile);

export { router as profileRouter };
