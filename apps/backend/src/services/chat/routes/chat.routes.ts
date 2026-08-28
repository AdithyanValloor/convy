import { Router } from "express";
import {
  fetchChats,
  accessChat,
  togglePinChat,
  toggleArchiveChat,
  markChatAsUnread,
  markChatAsRead,
  clearChat,
  deleteChat,
  unmuteChat,
  muteChat,
  getUnreadCounts,
} from "../controllers/chat.controller.js";
import { protect } from "../../../utils/middleware/protect.js";

const router = Router();

/** Chat routes for authenticated users. */

router.get("/", protect, fetchChats);
router.post("/access", protect, accessChat);

// Per-user chat state controls.
router.patch("/pin/:chatId", protect, togglePinChat);
router.patch("/archive/:chatId", protect, toggleArchiveChat);
router.patch("/unread/:chatId", protect, markChatAsUnread);
router.patch("/read/:chatId", protect, markChatAsRead);

router.get("/get-unread", protect, getUnreadCounts);


// Chat cleanup and mute actions.
router.delete("/:chatId/clear", protect, clearChat);
router.delete("/:chatId", protect, deleteChat);
router.post("/:chatId/mute", protect, muteChat);
router.post("/:chatId/unmute", protect, unmuteChat);

export { router as chatRouter };
