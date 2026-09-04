import path from "node:path";
import { fileURLToPath } from "node:url";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { userDTOResponseToUserDTO } from "./user.grpc.mapper.js";
import { UserDTO } from "../../types/user.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const protoPath = path.resolve(
  __dirname,
  "../../../../../packages/proto/user.proto",
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  user: {
    UserService: new (
      address: string,
      credentials: grpc.ChannelCredentials,
    ) => UserServiceClient;
  };
};

interface FindUserByAuthUserIdRequest {
  authUserId: string;
}

interface UserNameExistsRequest {
  username: string;
}

interface CreateProfileRequest {
  authUserId: string;
  username: string;
  displayName: string;
}

export interface UserDTOResponse {
  id: string;
  username: string;
  displayName: string;

  pronouns?: string;
  status?: string;
  bio?: string;

  dateOfBirth?: Timestamp;
  profilePicture: {
    key?: string;
  };
  isBanned: boolean;
  isActive: boolean;
  banExpiry?: Timestamp;
  banType?: string;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  scheduledDeletionAt?: Timestamp;
  deletionWarningEmailSentAt?: Timestamp;
  deactivatedAt?: Timestamp;
  privacy: {
    friendRequests: string;
    readReceipts: boolean;
    typingIndicators: boolean;
  };
  notificationSettings: {
    allNotifications: boolean;
    newMessages: boolean;
    mentions: boolean;
    replies: boolean;
    friendRequests: boolean;
    friendRequestAccepted: boolean;
    groupAdded: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserNameExistsResponse {
  exists: boolean;
}

interface UserServiceClient {
  findUserByAuthUserId(
    request: FindUserByAuthUserIdRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: UserDTOResponse,
    ) => void,
  ): void;

  userNameExists(
    request: UserNameExistsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: UserNameExistsResponse,
    ) => void,
  ): void;

  createProfile(
    request: CreateProfileRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: UserDTOResponse,
    ) => void,
  ): void;
}

export interface Timestamp {
  seconds: string;
  nanos: number;
}

const USER_GRPC_ADDRESS = process.env.USER_GRPC_ADDRESS ?? "localhost:50051";

const userClient = new userProto.user.UserService(
  USER_GRPC_ADDRESS,
  grpc.credentials.createInsecure(),
);

export const findUserByAuthUserId = (
  authUserId: string,
): Promise<UserDTO> => {
  return new Promise((resolve, reject) => {
    userClient.findUserByAuthUserId({ authUserId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("User service returned no response"));
        return;
      }

      resolve(userDTOResponseToUserDTO(response));
    });
  });
};

export const userNameExists = (username: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    userClient.userNameExists({ username }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("User service returned no response"));
        return;
      }

      resolve(response.exists);
    });
  });
};

export const createProfile = ({
  authUserId,
  username,
  displayName,
}: CreateProfileRequest): Promise<UserDTO> => {
  return new Promise((resolve, reject) => {
    userClient.createProfile(
      { authUserId, username, displayName },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error("User service returned no response"));
          return;
        }

        resolve(userDTOResponseToUserDTO(response));
      },
    );
  });
};
