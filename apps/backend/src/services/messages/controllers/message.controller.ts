import { Request, Response, NextFunction } from "express";
import {
  EditMessageBody,
  ForwardMessageBody,
  MessageParams,
  SendMessageBody,
} from "../types/message.types.js";

import { BadRequest, Unauthorized } from "../../../utils/errors/httpErrors.js";
import { toMessageSocketPayload } from "../utils/normalizeMessage.js";
import {
  emitDeleteMessage,
  emitEditMessage,
  emitMentionNotification,
  emitMessageReaction,
  emitMessagesSeen,
  emitNewMessage,
  emitUnreadUpdate,
} from "../../../socket/emitters/message.emmitter.js";
import { fetchLinkPreview } from "../utils/linkPreview.js";
import { Message } from "../models/message.model.js";
import * as ChatAPI from "../../chat/api/chat.api.js";
import * as UserAPI from "../../user/api/user.api.js"
import { messageService } from "../composition/container.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Message controller handlers for authenticated message actions. */

export const getAllMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { chatId } = req.params as Record<string, string>;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (!chatId) throw BadRequest("ChatId is required");

    const data = await messageService.getAllMessagesFunction(
      chatId,
      userId,
      page,
      limit,
    );

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};

/** Sends a message, emits socket updates, and backfills link previews asynchronously. */
export const sendMessage = async (
  req: Request<{}, {}, SendMessageBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) throw Unauthorized();

    const { chatId, content, replyTo, mentionIds, file } = req.body;

    if (!chatId) throw BadRequest("ChatId is required");
    if (!content && !file) {
      throw BadRequest("Message must contain content or file");
    }

    const VALID_KEY_REGEX = /^chat\/[^/]+\/[a-f0-9-]+\.(png|jpg|pdf)$/;
    const ALLOWED_TYPES = new Set([
      "image/png",
      "image/jpeg",
      "application/pdf",
    ]);

    if (file) {
      // Validate uploaded file metadata and confirm it belongs to this chat.
      const parts = file.key.split("/");
      const chatIdFromKey = parts[1];

      if (!chatIdFromKey) {
        throw BadRequest("Invalid file key");
      }

      const chat = await ChatAPI.findChatById(chatId);

      if (!chat || !chat.members.some((id) => id.toString() === senderId)) {
        throw Unauthorized("Not allowed to send file in this chat");
      }

      if (file.size > MAX_FILE_SIZE) {
        throw BadRequest("File too large");
      }

      if (!VALID_KEY_REGEX.test(file.key)) {
        throw BadRequest("Invalid file key");
      }

      if (
        typeof file.key !== "string" ||
        typeof file.mimeType !== "string" ||
        typeof file.size !== "number"
      ) {
        throw BadRequest("Invalid file data");
      }

      if (!ALLOWED_TYPES.has(file.mimeType)) {
        throw BadRequest("Invalid file type");
      }
    }

    const {
      populated,
      messageId,
      firstUrl,
      chatMembers,
      unreadCounts,
      mentionedUserIds,
    } = await messageService.sendMessageFunction(
      chatId,
      content ?? "",
      senderId,
      replyTo,
      mentionIds,
      file,
    );

    emitNewMessage(chatId, toMessageSocketPayload(populated));

    console.log("POPULATED : ", populated);
    console.log("NORM : ", toMessageSocketPayload(populated));
    

    mentionedUserIds.forEach((mentionedId) => {
      emitMentionNotification(
        mentionedId,
        chatId,
        toMessageSocketPayload(populated),
      );
    });

    chatMembers.forEach((memberId) => {
      if (memberId !== senderId) {
        emitUnreadUpdate(memberId, chatId, unreadCounts[memberId]);
      }
    });

    res.status(201).json(populated);

    if (firstUrl) {
      // Keep the initial send fast and enrich the message asynchronously.
      fetchLinkPreview(firstUrl)
        .then(async (preview) => {
          if (!preview) return;

          const message = await Message.findById(messageId);
          if (!message) return;

          message.linkPreview = preview;
          await message.save();

          const updated = await message.populate({
            path: "replyTo",
            select: "content sender",
          });

          const sender = await UserAPI.findUserById(updated.sender.toString());

          let populatedReplyTo = null;

          if (updated.replyTo) {
            const replyMessage = updated.replyTo as any;

            const replySender = await UserAPI.findUserById(
              replyMessage.sender.toString(),
            );

            populatedReplyTo = {
              ...replyMessage.toObject(),
              sender: replySender,
            };
          }

          const populatedUpdated = {
            ...updated.toObject(),
            sender,
            replyTo: populatedReplyTo,
          };

          emitEditMessage(chatId, toMessageSocketPayload(populatedUpdated));
        })
        .catch(() => {});
    }
  } catch (err) {
    next(err);
  }
};

/** Forwards a message to one or more chats the sender can access. */
export const forwardMessage = async (
  req: Request<{}, {}, ForwardMessageBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const senderId = req.user?.id;
    if (!senderId) throw Unauthorized();

    const { messageId, targetChatIds } = req.body;

    if (
      !messageId ||
      !Array.isArray(targetChatIds) ||
      targetChatIds.length === 0
    ) {
      throw BadRequest("messageId and targetChatIds are required");
    }

    const results = await messageService.forwardMessageFunction(
      messageId,
      targetChatIds,
      senderId,
    );

    for (const { chatId, message, chatMembers, unreadCounts } of results) {
      emitNewMessage(chatId.toString(), toMessageSocketPayload(message));

      for (const memberId of chatMembers) {
        if (memberId === senderId) continue;

        emitUnreadUpdate(
          memberId,
          chatId.toString(),
          unreadCounts[memberId] ?? 0,
        );
      }
    }

    return res.status(201).json(results.map((result) => result.message));
  } catch (err) {
    next(err);
  }
};

/** Toggles a reaction on a message and emits the updated payload. */
export const toggleReaction = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { populated, chatId } = await messageService.toggleReactionFunction(
      req.params.messageId as string,
      userId,
      req.body.emoji,
    );

    emitMessageReaction(chatId, toMessageSocketPayload(populated));

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

/** Marks incoming messages as seen and emits receipt updates when allowed. */
export const markMessagesAsSeen = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { success, modifiedCount, emitSeen } =
      await messageService.markMessagesAsSeenFunction(
        userId,
        req.params.chatId as string,
      );

    if (emitSeen) {
      emitMessagesSeen(req.params.chatId as string, userId, modifiedCount);
    }

    emitUnreadUpdate(userId, req.params.chatId as string, 0);

    res.status(200).json({ success });
  } catch (err) {
    next(err);
  }
};

/** Edits a message owned by the current user and broadcasts the change. */
export const editMessage = async (
  req: Request<MessageParams, {}, EditMessageBody>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { messageId } = req.params;
    const { content } = req.body;

    if (!messageId) throw BadRequest("MessageId is required");
    if (!content) throw BadRequest("Content is required");

    const { populated, chatId } = await messageService.editMessageFunction(
      messageId,
      content,
      userId,
    );

    emitEditMessage(chatId, toMessageSocketPayload(populated));

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

/** Soft-deletes a message owned by the current user and emits the update. */
export const deleteMessage = async (
  req: Request<MessageParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { messageId } = req.params;
    if (!messageId) throw BadRequest("MessageId is required");

    const { populated, chatId } = await messageService.deleteMessageFunction(
      messageId,
      userId,
    );

    emitDeleteMessage(chatId, toMessageSocketPayload(populated));

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

/** Searches messages within a chat using optional text and date filters. */
export const searchMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { chatId, query, date } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    if (!chatId) throw BadRequest("ChatId is required");

    const result = await messageService.searchMessagesFunction(
      chatId as string,
      userId,
      query as string,
      date as string,
      page,
      limit,
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/** Returns the target message with surrounding context for jump navigation. */
export const getMessageContext = async (
  req: Request<MessageParams>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { messageId } = req.params;
    if (!messageId) throw BadRequest("MessageId is required");

    const limit = Number(req.query.limit) || 20;

    const result = await messageService.getMessageContextFunction(
      messageId,
      userId,
      limit,
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/** Returns newer messages after a given timestamp for incremental loading. */
export const getNewerMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { chatId } = req.params as Record<string, string>;
    const after = req.query.after as string;
    const limit = Number(req.query.limit) || 20;

    if (!after) throw BadRequest("'after' timestamp is required");

    const result = await messageService.getNewerMessagesFunction(
      chatId,
      after,
      userId,
      limit,
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/** Searches messages across all chats the current user can access. */
export const globalSearchMessages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const { query, limit } = req.query;

    if (!userId) throw Unauthorized();

    const result = await messageService.globalSearchMessagesFunction(
      userId,
      query as string,
      limit ? parseInt(limit as string, 10) : 20,
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
