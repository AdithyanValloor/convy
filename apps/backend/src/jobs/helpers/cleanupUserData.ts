import { blockCleanup } from "../../services/social/helper/block.cleanup.js";
import {
  friendCleanup,
  requestCleanup,
} from "../../services/social/helper/friend.cleanup.js";
import { userCleanUp } from "../../services/user/helper/user.cleanup.js";
import { Types } from "mongoose";

export const cleanupUserData = async (ids: Types.ObjectId[]) => {
  // Run independent cleanup steps together for the deleted users.
  try {
    await Promise.all([
      // Keep username and email unique while scrubbing personal profile data.
      ...ids.map((id) => userCleanUp(id)),
      blockCleanup(ids),
      requestCleanup(ids),
      friendCleanup(ids),
    ]);
  } catch (error) {
    console.log(error);
  }
};
