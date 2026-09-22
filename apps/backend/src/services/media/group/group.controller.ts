import { NextFunction, Response, Request } from "express";
import {
  BadRequest,
  NotFound,
  Unauthorized,
} from "../../../utils/errors/httpErrors.js";
import { copyFile, deleteFile, generateUploadUrl } from "../s3.service.js";

// import * as ChatAPI from "../../chat/api/chat.api.js"
import { findChatById, updateGroupAvatar, deleteGroupAvatar as deleteGroupAvatarGrpc } from "../../../grpc/chat/chat.grpc.client.js";
import { ChatDto } from "../../../types/chat.dto.js";

const MAX_GROUP_SIZE = 2 * 1024 * 1024;

const ALLOWED_GROUP_TYPES = new Set(["image/png", "image/jpeg"]);

const GROUP_KEY_REGEX = /^group\/[^/]+\/[a-f0-9-]+\.(png|jpg)$/;

/** Returns whether the user can manage the target group's avatar. */
export const isGroupAdmin = (group: ChatDto, userId: string) => {
  return (
    group.admin.some((id) => id.toString() === userId) ||
    group.createdBy?.toString() === userId
  );
};

/** Returns a signed upload URL for a group avatar or temporary group avatar asset. */

/** Returns a signed upload URL for a group avatar or temporary group avatar asset. */

/** Returns a signed upload URL for a group avatar or temporary group avatar asset. */
export const uploadGroupAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.log(
    "\n\n========== 🚀 UPLOAD GROUP AVATAR START ==========",
  );

  try {
    // --------------------------------------------------
    // 1. AUTH
    // --------------------------------------------------

    console.log("1️⃣ Checking authenticated user...");

    const userId = req.user?.id;

    console.log("   userId:", userId);

    if (!userId) {
      console.log("❌ NO USER ID");
      throw Unauthorized();
    }

    console.log("✅ Authenticated user:", userId);

    // --------------------------------------------------
    // 2. REQUEST BODY
    // --------------------------------------------------

    console.log("2️⃣ Request body:");
    console.log(req.body);

    const { groupId, fileType, fileSize, temp } = req.body;

    console.log("   groupId:", groupId);
    console.log("   fileType:", fileType);
    console.log("   fileSize:", fileSize);
    console.log("   temp:", temp);
    console.log("   temp type:", typeof temp);
    console.log("   fileSize type:", typeof fileSize);

    // --------------------------------------------------
    // 3. GROUP ID VALIDATION
    // --------------------------------------------------

    console.log("3️⃣ Validating groupId...");

    if (!temp && (!groupId || typeof groupId !== "string")) {
      console.log("❌ Invalid/missing groupId");
      throw BadRequest("GroupId is required");
    }

    console.log("✅ groupId validation passed");

    // --------------------------------------------------
    // 4. FILE INPUT VALIDATION
    // --------------------------------------------------

    console.log("4️⃣ Validating file input...");

    if (
      typeof fileType !== "string" ||
      typeof fileSize !== "number" ||
      fileSize <= 0
    ) {
      console.log("❌ Invalid file input");
      console.log({
        fileType,
        fileTypeType: typeof fileType,
        fileSize,
        fileSizeType: typeof fileSize,
      });

      throw BadRequest("Invalid input");
    }

    console.log("✅ File input validation passed");

    // --------------------------------------------------
    // 5. FILE SIZE
    // --------------------------------------------------

    console.log("5️⃣ Checking file size...");

    console.log("   fileSize:", fileSize);
    console.log("   maxSize:", MAX_GROUP_SIZE);

    if (fileSize > MAX_GROUP_SIZE) {
      console.log("❌ File too large");
      throw BadRequest("File too large");
    }

    console.log("✅ File size accepted");

    // --------------------------------------------------
    // 6. FILE TYPE
    // --------------------------------------------------

    console.log("6️⃣ Checking file type...");

    console.log("   received:", fileType);
    console.log("   allowed:", [...ALLOWED_GROUP_TYPES]);

    if (!ALLOWED_GROUP_TYPES.has(fileType)) {
      console.log("❌ Invalid group image type");
      throw BadRequest("Invalid group image type");
    }

    console.log("✅ File type accepted");

    // --------------------------------------------------
    // 7. GROUP LOOKUP / ADMIN CHECK
    // --------------------------------------------------

    if (!temp) {
      console.log("7️⃣ Permanent avatar upload");
      console.log("   Looking up group:", groupId);

      const group = await findChatById(groupId);

      console.log("   Group lookup result:", group);

      if (!group) {
        console.log("❌ GROUP NOT FOUND");
        throw NotFound("Group not found");
      }

      console.log("✅ Group found:", group._id.toString());

      const admin = isGroupAdmin(group, userId);

      console.log("   userId:", userId);
      console.log("   group admins:", group.admin);
      console.log("   group creator:", group.createdBy);
      console.log("   isGroupAdmin:", admin);

      if (!admin) {
        console.log("❌ USER IS NOT GROUP ADMIN");
        throw Unauthorized();
      }

      console.log("✅ User is group admin");
    } else {
      console.log("7️⃣ Temporary avatar upload");
      console.log("   Skipping group lookup/admin check");
    }

    // --------------------------------------------------
    // 8. GENERATE S3 UPLOAD URL
    // --------------------------------------------------

    console.log("8️⃣ Generating S3 upload URL...");

    const uploadTarget = temp
      ? { type: "group-temp" as const, userId }
      : { type: "group" as const, groupId };

    console.log("   upload target:", uploadTarget);
    console.log("   fileType:", fileType);
    console.log("   fileSize:", fileSize);

    const data = await generateUploadUrl(
      uploadTarget,
      fileType,
      fileSize,
    );

    console.log("✅ S3 upload URL generated");
    console.log("   response:", data);

    // --------------------------------------------------
    // 9. RESPONSE
    // --------------------------------------------------

    console.log("9️⃣ Sending response...");

    res.json(data);

    console.log(
      "========== ✅ UPLOAD GROUP AVATAR SUCCESS ==========\n\n",
    );
  } catch (err) {
    console.error(
      "========== ❌ UPLOAD GROUP AVATAR FAILED ==========",
    );

    console.error("Error:", err);

    if (err instanceof Error) {
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
    }

    console.error(
      "====================================================\n\n",
    );

    next(err);
  }
};

// export const uploadGroupAvatar = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {

//   console.log("UPLOAD AVATAR TRIGGERED ------------------------------------------------------------------- ");
  

//   try {
//     const userId = req.user?.id;
//     if (!userId) throw Unauthorized();

//     const { groupId, fileType, fileSize, temp } = req.body;

//     if (!temp && (!groupId || typeof groupId !== "string")) {
//       throw BadRequest("GroupId is required");
//     }

//     if (
//       typeof fileType !== "string" ||
//       typeof fileSize !== "number" ||
//       fileSize <= 0
//     ) {
//       throw BadRequest("Invalid input");
//     }

//     if (fileSize > MAX_GROUP_SIZE) {
//       throw BadRequest("File too large");
//     }

//     if (!ALLOWED_GROUP_TYPES.has(fileType)) {
//       throw BadRequest("Invalid group image type");
//     }

//     if (!temp) {
//       const group = await findChatById(groupId);
//       if (!group) throw NotFound("Group not found");

//       if (!isGroupAdmin(group, userId)) throw Unauthorized();
//     }

//     const data = await generateUploadUrl(
//       temp ? { type: "group-temp", userId } : { type: "group", groupId },
//       fileType,
//       fileSize,
//     );

//     res.json(data);
//   } catch (err) {
//     next(err);
//   }
// };

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

    const group = await findChatById(groupId);
    if (!group) throw NotFound("Group not found");

    if (!isGroupAdmin(group, userId)) throw Unauthorized();

    try {
      await deleteFile(key);
    } catch (err) {
      return next(err);
    }

    if (group.avatar?.key === key) {
      await deleteGroupAvatarGrpc(group._id.toString())
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

    const group = await findChatById(groupId);

    if (!group) throw NotFound("Group not found");

    if (!isGroupAdmin(group, userId)) throw Unauthorized();

    const ext = tempKey.split(".").pop();
    const newKey = `group/${groupId}/${crypto.randomUUID()}.${ext}`;

    await copyFile(tempKey, newKey);
    await deleteFile(tempKey);

    await updateGroupAvatar(group._id.toString(), newKey)

    res.json({ avatar: group.avatar });
  } catch (err) {
    next(err);
  }
};
