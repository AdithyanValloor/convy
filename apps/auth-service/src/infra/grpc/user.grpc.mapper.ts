import { UserDTO } from "../../types/user.types.js";
import { Timestamp, UserDTOResponse } from "./user.grpc.client.js";

const timestampToDate = (timestamp?: Timestamp): Date | undefined => {
  if (!timestamp) {
    return undefined;
  }

  return new Date(
    Number(timestamp.seconds) * 1000 + timestamp.nanos / 1_000_000,
  );
};

const protoToBanType = (banType?: string): "temporary" | "permanent" | null => {
  switch (banType) {
    case "BAN_TYPE_TEMPORARY":
      return "temporary";

    case "BAN_TYPE_PERMANENT":
      return "permanent";

    default:
      return null;
  }
};

const protoToPrivacy = (privacy: {
  friendRequests?: string;
  readReceipts: boolean;
  typingIndicators: boolean;
}) => {
  let friendRequests: "everyone" | "friends" | "nobody";

  switch (privacy.friendRequests) {
    case "FRIEND_REQUEST_PRIVACY_EVERYONE":
      friendRequests = "everyone";
      break;

    case "FRIEND_REQUEST_PRIVACY_FRIENDS":
      friendRequests = "friends";
      break;

    case "FRIEND_REQUEST_PRIVACY_NOBODY":
      friendRequests = "nobody";
      break;

    default:
      throw new Error(
        `Unknown friend request privacy enum: ${privacy.friendRequests}`,
      );
  }

  return {
    friendRequests,
    readReceipts: privacy.readReceipts,
    typingIndicators: privacy.typingIndicators,
  };
};

const timestampToDateRequired = (timestamp?: Timestamp): Date => {
  if (!timestamp) {
    throw new Error("Required timestamp is missing");
  }

  return new Date(
    Number(timestamp.seconds) * 1000 + timestamp.nanos / 1_000_000,
  );
};


export const userDTOResponseToUserDTO = (
  response: UserDTOResponse,
): UserDTO => {
  return {
    id: response.id,
    username: response.username,
    displayName: response.displayName,

    pronouns: response.pronouns ?? null,
    status: response.status ?? null,
    bio: response.bio ?? null,

    dateOfBirth: timestampToDate(response.dateOfBirth) ?? null,

    profilePicture: {
      key: response.profilePicture?.key ?? null,
    },

    isBanned: response.isBanned,
    isActive: response.isActive,

    banExpiry: timestampToDate(response.banExpiry) ?? null,
    banType: protoToBanType(response.banType),

    isDeleted: response.isDeleted,
    deletedAt: timestampToDate(response.deletedAt) ?? null,
    scheduledDeletionAt:
      timestampToDate(response.scheduledDeletionAt) ?? null,

    deletionWarningEmailSentAt:
      timestampToDate(response.deletionWarningEmailSentAt) ?? null,

    deactivatedAt:
      timestampToDate(response.deactivatedAt) ?? null,

    privacy: protoToPrivacy(response.privacy),

    notificationSettings: response.notificationSettings,

    createdAt: timestampToDateRequired(response.createdAt),
    updatedAt: timestampToDateRequired(response.updatedAt),
  };
};