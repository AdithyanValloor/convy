import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

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
    SocialService: new (
      address: string,
      credentials: grpc.ChannelCredentials,
    ) => SocialServiceClient;
  };
};

interface SocialRequest {
  userId: string;
  currentUserId: string;
}

interface AreFriendsResponse {
  areFriends: boolean;
}

interface ProtoBlockExistsResponse {
  block?: {
    blocker: string;
    blocked: string;
    createdAt: Timestamp;
  };
}

interface Block {
  blocker: string;
  blocked: string;
  createdAt: Date;
}

interface getBlockedRelationshipUserIdsRequest {
  userIds: string[];
  currentUserId: string;
}

interface getBlockedRelationshipUserIdsResponse {
  userIds: string[];
}

interface SocialServiceClient {
  areFriends(
    request: SocialRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: AreFriendsResponse,
    ) => void,
  ): void;

  blockExists(
    request: SocialRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: ProtoBlockExistsResponse,
    ) => void,
  ): void;

  getBlockedRelationshipUserIds(
    request: getBlockedRelationshipUserIdsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: getBlockedRelationshipUserIdsResponse,
    ) => void,
  ): void;
}

export interface Timestamp {
  seconds: string;
  nanos: number;
}

const timestampToDate = (timestamp: Timestamp): Date => {
  return new Date(
    Number(timestamp.seconds) * 1000 + timestamp.nanos / 1_000_000,
  );
};

const GRPC_ADDRESS = process.env.GRPC_ADDRESS ?? "localhost:50051";

const socialClient = new socialProto.social.SocialService(
  GRPC_ADDRESS,
  grpc.credentials.createInsecure(),
);

export const blockExists = (
  userId: string,
  currentUserId: string,
): Promise<Block | null> => {
  return new Promise((resolve, reject) => {
    socialClient.blockExists({ userId, currentUserId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("Social service returned no response"));
        return;
      }

      if (!response.block) {
        resolve(null);
        return;
      }

      resolve({
        blocker: response.block.blocker,
        blocked: response.block.blocked,
        createdAt: timestampToDate(response.block.createdAt),
      });
    });
  });
};

export const areFriends = (
  userId: string,
  currentUserId: string,
): Promise<AreFriendsResponse> => {
  return new Promise((resolve, reject) => {
    socialClient.areFriends({ userId, currentUserId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("Social service returned no response"));
        return;
      }

      resolve(response);
    });
  });
};

export const getBlockedRelationshipUserIds = (
  userIds: string[],
  currentUserId: string,
): Promise<getBlockedRelationshipUserIdsResponse> => {
  return new Promise((resolve, reject) => {
    socialClient.getBlockedRelationshipUserIds(
      { userIds, currentUserId },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error("Social service returned no response"));
          return;
        }

        resolve(response);
      },
    );
  });
};
