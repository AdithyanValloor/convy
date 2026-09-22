import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { findMessageById } from "../../modules/messages/api/messages.api.js";


const protoPath = path.resolve(
  process.cwd(),
  "../../packages/proto/message.proto",
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const messageProto = grpc.loadPackageDefinition(
  packageDefinition,
) as unknown as {
  message: {
    MessageService: {
      service: grpc.ServiceDefinition;
    };
  };
};

interface FindMessageByIdCall {
  request: {
    messageId: string;
  };
}

interface FindMessageByIdCallback {
  (
    error: grpc.ServiceError | null,
    response?: unknown,
  ): void;
}

const dateToTimestamp = (
  date: Date | string | null | undefined,
) => {
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

export const messageGrpcService = {
  findMessageById: async (
    call: FindMessageByIdCall,
    callback: FindMessageByIdCallback,
  ) => {
    const { messageId } = call.request;

    const message = await findMessageById(messageId);

    callback(null, {
      message: {
        _id: message._id,

        chat: message.chat,
        sender: message.sender,

        content: message.content,

        edited: message.edited,
        deleted: message.deleted,

        deliveredTo: message.deliveredTo,
        seenBy: message.seenBy,
        mentions: message.mentions,

        replyTo: message.replyTo ?? undefined,

        forwarded: message.forwarded,
        forwardedFrom: message.forwardedFrom ?? undefined,

        reactions: message.reactions.map((reaction) => ({
          emoji: reaction.emoji,
          user: reaction.user,
        })),

        linkPreview: message.linkPreview
          ? {
              url: message.linkPreview.url,
              title: message.linkPreview.title,
              description: message.linkPreview.description,
              image: message.linkPreview.image,
              siteName: message.linkPreview.siteName,
              isLargeImage: message.linkPreview.isLargeImage,
            }
          : undefined,

        file: message.file
          ? {
              key: message.file.key,
              mimeType: message.file.mimeType,
              size: message.file.size,
            }
          : undefined,

        createdAt: dateToTimestamp(message.createdAt),
        updatedAt: dateToTimestamp(message.updatedAt),
      },
    });
  },
};

export { messageProto };