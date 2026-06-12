import { Response, NextFunction, Request } from "express";
import {
  accessChatFunction,
  clearChatForUser,
  deleteChatForUser,
  fetchChatsFunction,
  markChatAsReadFunction,
  markChatAsUnreadFunction,
  muteChatFunction,
  MuteDuration,
  toggleArchiveChatFunction,
  togglePinChatFunction,
  unmuteChatFunction,
} from "../services/chat.service.js";
import {
  Unauthorized,
  BadRequest,
  Forbidden,
} from "../../../utils/errors/httpErrors.js";
import { Chat } from "../models/chat.model.js";
import { emitUnreadUpdate } from "../../../socket/emitters/message.emmitter.js";

interface ChatParams {
  chatId: string;
}

/** Chat controller handlers for authenticated chat actions. */

/** Returns chats visible to the current user. */
export const fetchChats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw Unauthorized();
    }

    const chats = await fetchChatsFunction(userId);

    res.status(200).json(chats);
  } catch (err) {
    next(err);
  }
};

/** Returns an existing direct chat or creates one when allowed. */
export const accessChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userId, message }: { userId?: string; message?: string } = req.body;
    const currentUserId = req.user?.id;

    if (!userId) {
      throw BadRequest("UserId parameter is required");
    }

    if (!currentUserId) {
      throw Unauthorized();
    }

    const chat = await accessChatFunction(userId, currentUserId, message);

    res.status(200).json(chat);
  } catch (err) {
    next(err);
  }
};

/** Toggles the pinned state for a chat owned by the current user. */
export const togglePinChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params as { chatId: string };

    if (!userId) {
      throw Unauthorized();
    }

    const chat = await Chat.findOne({
      _id: chatId,
      members: userId,
    });

    if (!chat) throw Forbidden("Not allowed");

    const result = await togglePinChatFunction(userId, chatId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/** Toggles the archived state for a chat owned by the current user. */
export const toggleArchiveChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params as { chatId: string };

    if (!userId) {
      throw Unauthorized();
    }

    const chat = await Chat.findOne({
      _id: chatId,
      members: userId,
    });

    if (!chat) throw Forbidden("Not allowed");

    const result = await toggleArchiveChatFunction(userId, chatId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/** Marks a chat as unread for the current user. */
export const markChatAsUnread = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params as { chatId: string };

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("ChatId is required");

    const result = await markChatAsUnreadFunction(userId, chatId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/** Marks a chat as read for the current user. */
export const markChatAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { unreadCount } = await markChatAsReadFunction(
      userId,
      req.params.chatId as string,
    );

    emitUnreadUpdate(userId, req.params.chatId as string, unreadCount);

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

/** Clears chat history from the current user's perspective. */
export const clearChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params as { chatId: string };

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("ChatId is required");

    await clearChatForUser(userId, chatId);

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
};

/** Removes a chat from the current user's chat list. */
export const deleteChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params as { chatId: string };

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("ChatId is required");

    await deleteChatForUser(userId, chatId);

    res.status(200).json({ success: true, chatId });
  } catch (err) {
    next(err);
  }
};

const VALID_DURATIONS: MuteDuration[] = ["1h", "8h", "24h", "1w", "forever"];

/** Mutes a chat for a supported duration. */
export const muteChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params as { chatId: string };
    const { duration } = req.body as { duration?: MuteDuration };

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("ChatId is required");

    if (!duration || !VALID_DURATIONS.includes(duration)) {
      throw BadRequest(
        `duration must be one of: ${VALID_DURATIONS.join(", ")}`,
      );
    }

    const result = await muteChatFunction(userId, chatId, duration);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/** Removes any active mute for a chat. */
export const unmuteChat = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { chatId } = req.params as { chatId: string };

    if (!userId) throw Unauthorized();
    if (!chatId) throw BadRequest("ChatId is required");

    const result = await unmuteChatFunction(userId, chatId);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
