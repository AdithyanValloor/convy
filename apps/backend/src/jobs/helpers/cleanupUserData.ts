import { BlockModel } from "../../services/social/models/block.model.js";
import { FriendRequestModel } from "../../services/social/models/request.model.js";
import { UserModel } from "../../services/user/models/user.model.js";
import { Types } from "mongoose";


export const cleanupUserData = async (ids: Types.ObjectId[]) => {
  // Run independent cleanup steps together for the deleted users.
  await Promise.all([
    // Keep username and email unique while scrubbing personal profile data.
    ...ids.map((id) =>
      UserModel.findByIdAndUpdate(id, {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
        displayName: "Deleted User",
        username: `deleted_${id}`,
        email: `deleted_${id}@deleted.invalid`,
        password: "",
        bio: null,
        pronouns: null,
        status: null,
        profilePicture: { key: null },
        friendList: [],
        scheduledDeletionAt: null,
      })
    ),

    // Remove relationship records tied to the deleted users.
    BlockModel.deleteMany({
      $or: [{ blocker: { $in: ids } }, { blocked: { $in: ids } }],
    }),

    FriendRequestModel.deleteMany({
      $or: [{ from: { $in: ids } }, { to: { $in: ids } }],
    }),

    // Detach deleted users from active users' friend lists.
    UserModel.updateMany(
      { friendList: { $in: ids } },
      { $pull: { friendList: { $in: ids } } },
    ),
  ]);
};
