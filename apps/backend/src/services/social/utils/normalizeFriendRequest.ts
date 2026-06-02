import { Types } from "mongoose";
import { FriendRequestSocketPayload } from "./friend.socket.js";

/** Friend request utility helpers for socket payload normalization. */

/** Converts a populated friend request document into a socket-safe payload. */

type FriendReqUser = {
  _id: Types.ObjectId;
  username: string;
  displayName: string;
  profilePicture?: { url?: string | null };
};

export type PopulatedFriendRequest = {
  _id: Types.ObjectId;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;

  from: FriendReqUser;

  to: FriendReqUser;
};

export const toFriendRequestSocketPayload = (
  doc: PopulatedFriendRequest,
): FriendRequestSocketPayload => {
  return {
    _id: doc._id.toString(),
    status: doc.status,
    createdAt: doc.createdAt?.toISOString(),

    from: {
      _id: doc.from._id.toString(),
      username: doc.from.username,
      displayName: doc.from.displayName,
      profilePicture: doc.from.profilePicture,
    },

    to: {
      _id: doc.to._id.toString(),
      username: doc.to.username,
      displayName: doc.to.displayName,
      profilePicture: doc.to.profilePicture,
    },
  };
};
