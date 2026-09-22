import { Router } from "express";
import {
  createGroupChat,
  addMembers,
  removeMembers,
  toggleAdmin,
  leaveGroup,
  getGroupById,
  deleteGroup,
  transferOwnership,
  editName,
  updateGroupAvatar,
  getAvatarDownloadUrl,
} from "../controllers/group.controller.js";
import { protect } from "../../../middlewares/protect.js";


const router = Router();

/** Group chat routes for authenticated users. */

router.post("/", protect, createGroupChat);
router.get("/:id", protect, getGroupById);

// Group metadata updates.
router.patch("/edit-name", protect, editName);

// Membership and role management.
router.post("/members", protect, addMembers);
router.delete("/members", protect, removeMembers);
router.patch("/admin", protect, toggleAdmin);

// Group lifecycle actions.
router.post("/leave", protect, leaveGroup);
router.delete("/delete", protect, deleteGroup);
router.patch("/transfer-ownership", protect, transferOwnership);

router.put("/avatar", protect, updateGroupAvatar);
router.get("/avatar/:chatId", protect, getAvatarDownloadUrl);

export { router as groupChatRouter };
