import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import {
  protoToPrivacy,
  userDTOResponseToUserDTO,
} from "./user.grpc.mapper.js";
import { UserDTO } from "../../types/user.dto.js";
import { FetchUsersRequest, ProtoGetUserPrivacyResponse, UserDTOResponse, UserPrivacy, UserTargetRequest } from "../types/user.grpc.types.js";

const protoPath = path.resolve(
  process.cwd(),
  "../../packages/proto/user.proto",
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

interface UserServiceClient {
  fetchUsers(
    request: FetchUsersRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: UserDTOResponse[],
    ) => void,
  ): void;

  findUserById(
    request: UserTargetRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: UserDTOResponse,
    ) => void,
  ): void;

  getUserPrivacy(
    request: UserTargetRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: ProtoGetUserPrivacyResponse,
    ) => void,
  ): void;
}

const GRPC_ADDRESS = process.env.GRPC_ADDRESS ?? "localhost:50051";

const userClient = new userProto.user.UserService(
  GRPC_ADDRESS,
  grpc.credentials.createInsecure(),
);

export const fetchUsers = (userIds: string[]): Promise<UserDTO[]> => {
  return new Promise((resolve, reject) => {
    userClient.fetchUsers({ userIds }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("User service returned no response"));
        return;
      }

      resolve(response.map((user) => userDTOResponseToUserDTO(user)));
    });
  });
};

export const findUserById = (userId: string): Promise<UserDTO> => {
  return new Promise((resolve, reject) => {
    userClient.findUserById({ userId }, (error, response) => {
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

export const getUserPrivacy = (
  userId: string,
): Promise<UserPrivacy> => {
  return new Promise((resolve, reject) => {
    userClient.getUserPrivacy({ userId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response?.privacy) {
        reject(new Error("User service returned no privacy response"));
        return;
      }

      resolve(protoToPrivacy(response.privacy));
    });
  });
};