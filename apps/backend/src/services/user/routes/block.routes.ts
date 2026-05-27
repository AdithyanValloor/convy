import { Router } from "express";
import {
  blockUserController,
  getBlockedByUsersController,
  getBlockedUsersController,
  unblockUserController,
} from "../controllers/block.controller.js";
import { protect } from "../../auth/auth.middleware.js";

const router = Router();

/** Block routes for authenticated block and unblock actions. */

// Block list and reverse-block visibility routes.
router.get("/", protect, getBlockedUsersController);
router.get("/blocked-by", protect, getBlockedByUsersController);

// Block or unblock a specific user by their id.
router.post("/:targetUserId", protect, blockUserController);
router.delete("/:targetUserId", protect, unblockUserController);

export { router as blockRouter };
