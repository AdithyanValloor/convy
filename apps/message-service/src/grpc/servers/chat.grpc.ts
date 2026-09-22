import path from "node:path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import {
  canJoinChat,
  deleteGroupAvatar,
  ensureChatExists,
  findChatById,
  updateGroupAvatar,
} from "../../modules/chat/api/chat.api.js";

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

const chatProto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  chat: {
    ChatService: {
      service: grpc.ServiceDefinition;
    };
  };
};

interface CanJoinChatCall {
  request: {
    chatId: string;
    userId: string;
  };
}

interface CanJoinChatCallback {
  (error: grpc.ServiceError | null, response?: { canJoin: boolean }): void;
}

interface ensureChatExistsCall {
  request: {
    user1: string;
    user2: string;
  };
}

interface ensureChatExistsCallback {
  (error: grpc.ServiceError | null, response?: unknown): void;
}

interface FindChatByIdCall {
  request: {
    chatId: string;
  };
}

interface FindChatByIdCallback {
  (error: grpc.ServiceError | null, response?: unknown): void;
}

interface UpdateGroupAvatarCall {
  request: {
    chatId: string;
    key: string;
  };
}

interface UpdateGroupAvatarCallback {
  (error: grpc.ServiceError | null, response?: { success: boolean }): void;
}

interface DeleteGroupAvatarCall {
  request: {
    chatId: string;
  };
}

interface DeleteGroupAvatarCallback {
  (error: grpc.ServiceError | null, response?: { success: boolean }): void;
}

const dateToTimestamp = (date: Date | string | null | undefined) => {
  if (date == null) {
    return undefined;
  }

  const value = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(value.getTime())) {
    throw new Error(`Invalid date: ${date}`);
  }

  return {
    seconds: Math.floor(value.getTime() / 1000),
    nanos: (value.getTime() % 1000) * 1_000_000,
  };
};

export const chatGrpcService = {
  canJoinChat: async (call: CanJoinChatCall, callback: CanJoinChatCallback) => {
    const { chatId, userId } = call.request;
    const canJoin = await canJoinChat(chatId, userId);

    callback(null, { canJoin });
  },
  ensureChatExists: async (
    call: ensureChatExistsCall,
    callback: ensureChatExistsCallback,
  ) => {
    const { user1, user2 } = call.request;

    const chat = await ensureChatExists(user1, user2);

    callback(null, {
      chat: {
        _id: chat._id,
        members: chat.members,
        isGroup: chat.isGroup,
        chatName: chat.chatName,
        avatar: chat.avatar,
        lastMessage: chat.lastMessage,
        admin: chat.admin,
        createdBy: chat.createdBy,

        isDeleted: chat.isDeleted,
        deletedAt: chat.deletedAt ? dateToTimestamp(chat.deletedAt) : undefined,
        deletedBy: chat.deletedBy,

        createdAt: dateToTimestamp(chat.createdAt),
        updatedAt: dateToTimestamp(chat.updatedAt),

        requestPending: chat.requestPending,
        requestInitiator: chat.requestInitiator,
      },
    });
  },

  findChatById: async (
    call: FindChatByIdCall,
    callback: FindChatByIdCallback,
  ) => {
    const { chatId } = call.request;

    const chat = await findChatById(chatId);

    callback(null, {
      chat: {
        _id: chat._id,
        members: chat.members,
        isGroup: chat.isGroup,
        chatName: chat.chatName,
        avatar: chat.avatar,
        lastMessage: chat.lastMessage,
        admin: chat.admin,
        createdBy: chat.createdBy,

        isDeleted: chat.isDeleted,
        deletedAt: chat.deletedAt ? dateToTimestamp(chat.deletedAt) : undefined,
        deletedBy: chat.deletedBy,

        createdAt: dateToTimestamp(chat.createdAt),
        updatedAt: dateToTimestamp(chat.updatedAt),

        requestPending: chat.requestPending,
        requestInitiator: chat.requestInitiator,
      },
    });
  },

  updateGroupAvatar: async (
    call: UpdateGroupAvatarCall,
    callback: UpdateGroupAvatarCallback,
  ) => {
    const { chatId, key } = call.request;

    await updateGroupAvatar(chatId, key);

    callback(null, {
      success: true,
    });
  },

  deleteGroupAvatar: async (
    call: DeleteGroupAvatarCall,
    callback: DeleteGroupAvatarCallback,
  ) => {
    const { chatId } = call.request;

    await deleteGroupAvatar(chatId);

    callback(null, {
      success: true,
    });
  },
};

export { chatProto };
