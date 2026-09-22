import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { ChatDto } from "../../types/chat.dto.js";
import { networkChatToDto } from "./chat.grpc.mapper.js";

const protoPath = path.resolve(
  process.cwd(),
  "../../packages/proto/chat.proto",
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const ChatProto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  chat: {
    ChatService: new (
      address: string,
      credentials: grpc.ChannelCredentials,
    ) => ChatServiceClient;
  };
};

interface CanJoinRequest {
  chatId: string;
  userId: string;
}

interface CanJoinResponse {
  canJoin: boolean;
}

interface EnsureChatExistsRequest {
  user1: string;
  user2: string;
}

export interface Timestamp {
  seconds: string | number;
  nanos: number;
}

interface NetworkChatAvatar {
  key?: string;
}

export interface NetworkChat {
  _id: string;
  members: string[];
  isGroup: boolean;
  chatName?: string;
  avatar?: NetworkChatAvatar;
  lastMessage?: string;
  admin: string[];
  createdBy?: string;

  isDeleted: boolean;
  deletedAt?: Timestamp;
  deletedBy?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  requestPending: boolean;
  requestInitiator?: string;
}

interface EnsureChatExistsResponse {
  chat?: NetworkChat;
}

interface FindChatByIdResponse {
  chat?: NetworkChat;
}

interface FindChatByIdRequest {
  chatId: string;
}

interface UpdateGroupAvatarRequest {
  chatId: string;
  key: string;
}

interface UpdateGroupAvatarResponse {
  success: boolean;
}

interface DeleteGroupAvatarRequest {
  chatId: string;
}

interface DeleteGroupAvatarResponse {
  success: boolean;
}


interface ChatServiceClient {
  canJoinChat(
    request: CanJoinRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: CanJoinResponse,
    ) => void,
  ): void;

  ensureChatExists(
    request: EnsureChatExistsRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: EnsureChatExistsResponse,
    ) => void,
  ): void;

  findChatById(
    request: FindChatByIdRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: FindChatByIdResponse,
    ) => void,
  ): void;

  updateGroupAvatar(
    request: UpdateGroupAvatarRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: UpdateGroupAvatarResponse,
    ) => void,
  ): void;

  deleteGroupAvatar(
    request: DeleteGroupAvatarRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: DeleteGroupAvatarResponse,
    ) => void,
  ): void;
}

const GRPC_ADDRESS = process.env.GRPC_ADDRESS ?? "localhost:50051";

const chatClient = new ChatProto.chat.ChatService(
  GRPC_ADDRESS,
  grpc.credentials.createInsecure(),
);

export const canJoinChat = (
  chatId: string,
  userId: string,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    chatClient.canJoinChat({ chatId, userId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("Chat service returned no response"));
        return;
      }

      resolve(response.canJoin);
    });
  });
};

export const ensureChatExists = (
  user1: string,
  user2: string,
): Promise<ChatDto> => {
  return new Promise((resolve, reject) => {
    chatClient.ensureChatExists({ user1, user2 }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response?.chat) {
        reject(new Error("Chat service returned no chat"));
        return;
      }

      resolve(networkChatToDto(response.chat));
    });
  });
};

export const findChatById = (
  chatId: string,
): Promise<ChatDto> => {
  return new Promise((resolve, reject) => {
    chatClient.findChatById(
      { chatId },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response?.chat) {
          reject(new Error("Chat service returned no chat"));
          return;
        }

        resolve(networkChatToDto(response.chat));
      },
    );
  });
};

export const updateGroupAvatar = (
  chatId: string,
  key: string,
): Promise<UpdateGroupAvatarResponse> => {
  return new Promise((resolve, reject) => {
    chatClient.updateGroupAvatar(
      { chatId, key },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error("Chat service returned no response"));
          return;
        }

        resolve(response);
      },
    );
  });
};

export const deleteGroupAvatar = (
  chatId: string,
): Promise<DeleteGroupAvatarResponse> => {
  return new Promise((resolve, reject) => {
    chatClient.deleteGroupAvatar(
      { chatId },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        if (!response) {
          reject(new Error("Chat service returned no response"));
          return;
        }

        resolve(response);
      },
    );
  });
};