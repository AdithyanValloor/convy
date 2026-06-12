import { Types } from "mongoose"
import { UserModel } from "../models/user.model.js"

export const userCleanUp = async (id: Types.ObjectId) => {
    await UserModel.findByIdAndUpdate(id, {
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
}

