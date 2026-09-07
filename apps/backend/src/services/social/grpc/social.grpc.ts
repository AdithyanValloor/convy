import path from "node:path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import {
  areFriends,
  blockExists,
  getBlockedRelationshipUserIds,
} from "../api/social.api.js";

const protoPath = path.resolve(
  process.cwd(),
  "../../packages/proto/social.proto",
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const socialProto = grpc.loadPackageDefinition(
  packageDefinition,
) as unknown as {
  social: {
    SocialService: {
      service: grpc.ServiceDefinition;
    };
  };
};

interface SocialRequest {
  request: {
    userId: string;
    currentUserId: string;
  };
}

interface AreFriendsCallback {
  (error: grpc.ServiceError | null, response?: { areFriends: boolean }): void;
}

interface blockExistsCallback {
  (error: grpc.ServiceError | null, response?: unknown): void;
}

interface getBlockedRelationshipUserIdsCall {
  request: {
    userIds: string[];
    currentUserId: string;
  };
}

interface getBlockedRelationshipUserIdsCallback {
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

export const socialGrpcService = {
  areFriends: async (call: SocialRequest, callback: AreFriendsCallback) => {
    try {
      const { userId, currentUserId } = call.request;
      const areFriendsResult = await areFriends(userId, currentUserId);

      callback(null, {
        areFriends: areFriendsResult,
      });
    } catch (error) {
      callback(error as grpc.ServiceError);
    }
  },

  blockExists: async (call: SocialRequest, callback: blockExistsCallback) => {
    try {
      const { userId, currentUserId } = call.request;
      const exists = await blockExists(userId, currentUserId);

      callback(null, {
        block: exists
          ? {
              blocker: exists.blocker.toString(),
              blocked: exists.blocked.toString(),
              createdAt: dateToTimestamp(exists.createdAt),
            }
          : undefined,
      });
    } catch (error) {
      callback(error as grpc.ServiceError);
    }
  },

  getBlockedRelationshipUserIds: async (
    call: getBlockedRelationshipUserIdsCall,
    callback: getBlockedRelationshipUserIdsCallback,
  ) => {
    try {
      const { userIds, currentUserId } = call.request;
      const relations = await getBlockedRelationshipUserIds(
        currentUserId,
        userIds,
      );

      callback(null, {
        userIds: Array.from(relations),
      });
    } catch (error) {
      callback(error as grpc.ServiceError);
    }
  },
};

export { socialProto };
