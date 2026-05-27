import { NextFunction, Response } from "express";
import { AuthRequest } from "../../user/types/authRequest.js";
import { BadRequest, Unauthorized } from "../../../utils/errors/httpErrors.js";
import {
  deleteFile,
  generateDownloadUrl,
  generateUploadUrl,
} from "../s3.service.js";
import { Chat } from "../../chat/models/chat.model.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "application/pdf"]);

const VALID_KEY_REGEX = /^chat\/[^/]+\/[a-f0-9-]+\.(png|jpg|pdf)$/;

/** Returns a signed upload URL for chat attachments after membership checks. */
export const getChatUploadUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { fileType, fileSize, chatId } = req.body;

    if (!chatId) throw BadRequest("ChatId required");

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.members.some((id) => id.toString() === userId)) {
      throw Unauthorized("Not part of this chat");
    }

    if (
      typeof fileType !== "string" ||
      typeof fileSize !== "number" ||
      fileSize <= 0
    ) {
      throw BadRequest("Invalid input");
    }

    if (fileSize > MAX_FILE_SIZE) {
      throw BadRequest("File too large");
    }

    if (!ALLOWED_TYPES.has(fileType)) {
      throw BadRequest("Unsupported file type");
    }

    const data = await generateUploadUrl(
      { type: "chat", chatId },
      fileType,
      fileSize,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/** Returns a signed download URL for a chat attachment visible to the user. */
export const getChatDownloadUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { key } = req.query;

    if (!key || typeof key !== "string") {
      throw BadRequest("Invalid key");
    }

    if (!VALID_KEY_REGEX.test(key)) {
      throw BadRequest("Invalid key format");
    }

    const parts = key.split("/");
    const chatId = parts[1];

    if (!chatId) throw BadRequest("Invalid key structure");

    const chat = await Chat.findById(chatId);

    if (!chat || !chat.members.some((id) => id.toString() === userId)) {
      throw Unauthorized("Not allowed to access this file");
    }

    const url = await generateDownloadUrl(key);

    res.json({ url });
  } catch (err) {
    next(err);
  }
};

/** Deletes a chat attachment key after validating ownership of the upload path. */
export const deleteChatFile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { key } = req.query;

    if (!key || typeof key !== "string") {
      throw BadRequest("Invalid key");
    }

    if (!VALID_KEY_REGEX.test(key) || !key.startsWith(`chat/${userId}/`)) {
      throw Unauthorized();
    }

    try {
      await deleteFile(key);
    } catch (err) {
      return next(err);
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
