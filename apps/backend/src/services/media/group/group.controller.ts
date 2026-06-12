import { NextFunction, Response, Request } from "express";
import {
  BadRequest,
  NotFound,
  Unauthorized,
} from "../../../utils/errors/httpErrors.js";
import { copyFile, deleteFile, generateUploadUrl } from "../s3.service.js";
import { Chat, IChat } from "../../chat/models/chat.model.js";
import * as ChatAPI from "../../chat/api/chat.api.js"

const MAX_GROUP_SIZE = 2 * 1024 * 1024;

const ALLOWED_GROUP_TYPES = new Set(["image/png", "image/jpeg"]);

const GROUP_KEY_REGEX = /^group\/[^/]+\/[a-f0-9-]+\.(png|jpg)$/;

/** Returns whether the user can manage the target group's avatar. */
export const isGroupAdmin = (group: IChat, userId: string) => {
  return (
    group.admin.some((id) => id.toString() === userId) ||
    group.createdBy?.toString() === userId
  );
};

/** Returns a signed upload URL for a group avatar or temporary group avatar asset. */
export const uploadGroupAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { groupId, fileType, fileSize, temp } = req.body;

    if (!temp && (!groupId || typeof groupId !== "string")) {
      throw BadRequest("GroupId is required");
    }

    if (
      typeof fileType !== "string" ||
      typeof fileSize !== "number" ||
      fileSize <= 0
    ) {
      throw BadRequest("Invalid input");
    }

    if (fileSize > MAX_GROUP_SIZE) {
      throw BadRequest("File too large");
    }

    if (!ALLOWED_GROUP_TYPES.has(fileType)) {
      throw BadRequest("Invalid group image type");
    }

    if (!temp) {
      const group = await ChatAPI.findChatById(groupId);
      if (!group) throw NotFound("Group not found");

      if (!isGroupAdmin(group, userId)) throw Unauthorized();
    }

    const data = await generateUploadUrl(
      temp ? { type: "group-temp", userId } : { type: "group", groupId },
      fileType,
      fileSize,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
};

/** Deletes a stored group avatar after ownership and key validation checks. */
export const deleteGroupAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { groupId, key } = req.query;

    if (!groupId || typeof groupId !== "string") {
      throw BadRequest("GroupId is required");
    }

    if (!key || typeof key !== "string") {
      throw BadRequest("Invalid key");
    }

    if (!GROUP_KEY_REGEX.test(key) || !key.startsWith(`group/${groupId}/`)) {
      throw Unauthorized();
    }

    const group = await ChatAPI.findChatById(groupId);
    if (!group) throw NotFound("Group not found");

    if (!isGroupAdmin(group, userId)) throw Unauthorized();

    try {
      await deleteFile(key);
    } catch (err) {
      return next(err);
    }

    if (group.avatar?.key === key) {
      group.avatar = { key: null };
      await group.save();
    }

    res.json({
      message: "Group avatar deleted",
      success: true,
    });
  } catch (err) {
    next(err);
  }
};

/** Promotes a temporary uploaded avatar into the group's permanent storage path. */
export const attachGroupAvatarFromTemp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { groupId, tempKey } = req.body;

    if (!groupId || !tempKey) {
      throw BadRequest("groupId and tempKey required");
    }

    if (!tempKey.startsWith(`group-temp/${userId}/`)) {
      throw Unauthorized();
    }

    const group = await ChatAPI.findChatById(groupId);

    if (!group) throw NotFound("Group not found");

    if (!isGroupAdmin(group, userId)) throw Unauthorized();

    const ext = tempKey.split(".").pop();
    const newKey = `group/${groupId}/${crypto.randomUUID()}.${ext}`;

    await copyFile(tempKey, newKey);
    await deleteFile(tempKey);

    group.avatar = { key: newKey };
    await group.save();

    res.json({ avatar: group.avatar });
  } catch (err) {
    next(err);
  }
};
