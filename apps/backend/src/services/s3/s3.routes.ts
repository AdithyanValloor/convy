import { Router } from "express";
import { protect } from "../auth/auth.middleware.js";
import {
  deleteChatFile,
  getChatDownloadUrl,
  getChatUploadUrl,
} from "./message/message.controller.js";
import {
  deleteProfilePicture,
  uploadProfilePicture,
} from "./user/user.controller.js";
import {
  attachGroupAvatarFromTemp,
  deleteGroupAvatar,
  uploadGroupAvatar,
} from "./group/group.controller.js";
import {
  getProfilePictureDownloadUrl,
  updateProfilePicture,
} from "../user/controllers/profile.controller.js";
import {
  getAvatarDownloadUrl,
  updateGroupAvatar,
} from "../chat/controllers/group.controller.js";

const router = Router();

/** S3 asset routes for authenticated users. */

// Chat attachment upload and download routes.
router.post("/chat/upload", protect, getChatUploadUrl);
router.get("/chat/download", protect, getChatDownloadUrl);
router.delete("/chat", protect, deleteChatFile);

// Profile picture upload and management routes.
router.get("/profile-picture", protect, getProfilePictureDownloadUrl);
router.post("/profile-picture", protect, uploadProfilePicture);
router.put("/profile-picture", protect, updateProfilePicture);
router.delete("/profile-picture", protect, deleteProfilePicture);

// Group avatar upload, attach, download, and deletion routes.
router.get("/avatar/:chatId", protect, getAvatarDownloadUrl);
router.post("/avatar", protect, uploadGroupAvatar);
router.put("/avatar", protect, updateGroupAvatar);
router.delete("/avatar", protect, deleteGroupAvatar);
router.post("/temp-avatar", protect, attachGroupAvatarFromTemp);

export { router as s3Router };
