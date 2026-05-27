import { Router } from "express";
import {
  getAllMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markChatAsRead,
  getUnreadCounts,
  markMessagesAsSeen,
  toggleReaction,
  searchMessages,
  getMessageContext,
  getNewerMessages,
  forwardMessage,
  globalSearchMessages,
} from "../controllers/message.controller.js";
import { protect } from "../../auth/auth.middleware.js";

const router = Router();

/** Message routes for authenticated users. */

// Message status and search routes.
router.get("/unread", protect, getUnreadCounts);
router.post("/mark-read/:chatId", protect, markChatAsRead);
router.post("/mark-seen/:chatId", protect, markMessagesAsSeen);
router.get("/search/global", protect, globalSearchMessages);
router.get("/search", protect, searchMessages);
router.get("/context/:messageId", protect, getMessageContext);

// Message CRUD and chat actions.
router.get("/:chatId", protect, getAllMessages);
router.post("/", protect, sendMessage);
router.post("/forward", protect, forwardMessage);
router.put("/:messageId", protect, editMessage);
router.post("/react/:messageId", protect, toggleReaction);
router.delete("/:messageId", protect, deleteMessage);

// Incremental message loading for active chats.
router.get("/:chatId/newer", protect, getNewerMessages);

export { router as messageRouter };
