import path from "node:path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import {
  createProfile,
  findUserByAuthUserId,
  userNameExists,
} from "../api/user.api.js";

const protoPath = path.resolve(process.cwd(), "../../packages/proto/user.proto");

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  user: {
    UserService: {
      service: grpc.ServiceDefinition;
    };
  };
};

interface FindUserByAuthUserIdCall {
  request: {
    authUserId: string;
  };
}

interface UserNameExistsCall {
  request: {
    username: string;
  };
}

interface UserNameExistsCallback {
  (error: grpc.ServiceError | null, response?: { exists: boolean }): void;
}

interface FindUserByAuthUserIdCallback {
  (error: grpc.ServiceError | null, response?: unknown): void;
}

interface CreateProfileCall {
  request: {
    authUserId: string;
    username: string;
    displayName: string;
  };
}

interface CreateProfileCallback {
  (error: grpc.ServiceError | null, response?: unknown): void;
}

const dateToTimestamp = (date: Date | null | undefined) => {
  if (date == null) {
    return undefined;
  }

  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanos: (date.getTime() % 1000) * 1_000_000,
  };
};

const banTypeToProto = (banType: "temporary" | "permanent" | null) => {
  switch (banType) {
    case "temporary":
      return "BAN_TYPE_TEMPORARY";

    case "permanent":
      return "BAN_TYPE_PERMANENT";

    case null:
      return "BAN_TYPE_UNSPECIFIED";

    default:
      return "BAN_TYPE_UNSPECIFIED";
  }
};

const privacyToProto = (privacy: {
  friendRequests: "everyone" | "friends" | "nobody";
  readReceipts: boolean;
  typingIndicators: boolean;
}) => {
  let friendRequests: string;

  switch (privacy.friendRequests) {
    case "everyone":
      friendRequests = "FRIEND_REQUEST_PRIVACY_EVERYONE";
      break;

    case "friends":
      friendRequests = "FRIEND_REQUEST_PRIVACY_FRIENDS";
      break;

    case "nobody":
      friendRequests = "FRIEND_REQUEST_PRIVACY_NOBODY";
      break;
  }

  return {
    friendRequests,
    readReceipts: privacy.readReceipts,
    typingIndicators: privacy.typingIndicators,
  };
};

export const userGrpcService = {
  findUserByAuthUserId: async (
    call: FindUserByAuthUserIdCall,
    callback: FindUserByAuthUserIdCallback,
  ) => {
    try {
      const { authUserId } = call.request;

      const user = await findUserByAuthUserId(authUserId);

      callback(null, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        pronouns: user.pronouns,
        status: user.status,
        bio: user.bio,
        dateOfBirth: dateToTimestamp(user.dateOfBirth),
        profilePicture: user.profilePicture,
        isBanned: user.isBanned,
        isActive: user.isActive,
        banExpiry: dateToTimestamp(user.banExpiry),
        banType: banTypeToProto(user.banType),
        isDeleted: user.isDeleted,
        deletedAt: dateToTimestamp(user.deletedAt),
        scheduledDeletionAt: dateToTimestamp(user.scheduledDeletionAt),
        deletionWarningEmailSentAt: dateToTimestamp(
          user.deletionWarningEmailSentAt,
        ),
        deactivatedAt: dateToTimestamp(user.deactivatedAt),
        privacy: privacyToProto(user.privacy),
        notificationSettings: user.notificationSettings,
        createdAt: dateToTimestamp(user.createdAt),
        updatedAt: dateToTimestamp(user.updatedAt),
      });
    } catch (error) {
      callback(error as grpc.ServiceError);
    }
  },

  userNameExists: async (
    call: UserNameExistsCall,
    callback: UserNameExistsCallback,
  ) => {
    try {
      const { username } = call.request;

      const exists = await userNameExists(username);

      callback(null, { exists });
    } catch (error) {
      callback(error as grpc.ServiceError);
    }
  },

  createProfile: async (
    call: CreateProfileCall,
    callback: CreateProfileCallback,
  ) => {
    try {
      const { authUserId, username, displayName } = call.request;
      const user = await createProfile({ authUserId, username, displayName });

      callback(null, {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        pronouns: user.pronouns,
        status: user.status,
        bio: user.bio,
        dateOfBirth: dateToTimestamp(user.dateOfBirth),
        profilePicture: user.profilePicture,
        isBanned: user.isBanned,
        isActive: user.isActive,
        banExpiry: dateToTimestamp(user.banExpiry),
        banType: banTypeToProto(user.banType),
        isDeleted: user.isDeleted,
        deletedAt: dateToTimestamp(user.deletedAt),
        scheduledDeletionAt: dateToTimestamp(user.scheduledDeletionAt),
        deletionWarningEmailSentAt: dateToTimestamp(
          user.deletionWarningEmailSentAt,
        ),
        deactivatedAt: dateToTimestamp(user.deactivatedAt),
        privacy: privacyToProto(user.privacy),
        notificationSettings: user.notificationSettings,
        createdAt: dateToTimestamp(user.createdAt),
        updatedAt: dateToTimestamp(user.updatedAt),
      });
    } catch (error) {
      callback(error as grpc.ServiceError);
    }
  },
};

export { userProto };
