import path from "node:path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { MessageDto } from "../../types/message.dto.js";
import { networkMessageToDto } from "./message.mapper.js";

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

const MessageProto = grpc.loadPackageDefinition(
  packageDefinition,
) as unknown as {
  message: {
    MessageService: new (
      address: string,
      credentials: grpc.ChannelCredentials,
    ) => MessageServiceClient;
  };
};

interface FindMessageByIdRequest {
  messageId: string;
}

export interface Timestamp {
  seconds: string | number;
  nanos: number;
}

interface NetworkMessageReaction {
  emoji: string;
  user: string;
}

interface NetworkMessageLinkPreview {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  isLargeImage?: boolean;
}

interface NetworkMessageFile {
  key: string;
  mimeType: string;
  size: number;
}

export interface NetworkMessage {
  _id: string;

  chat: string;
  sender: string;

  content?: string;

  edited: boolean;
  deleted: boolean;

  deliveredTo: string[];
  seenBy: string[];
  mentions: string[];

  replyTo?: string;

  forwarded: boolean;
  forwardedFrom?: string;

  reactions: NetworkMessageReaction[];

  linkPreview?: NetworkMessageLinkPreview;
  file?: NetworkMessageFile;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface FindMessageByIdResponse {
  message?: NetworkMessage;
}

interface MessageServiceClient {
  findMessageById(
    request: FindMessageByIdRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: FindMessageByIdResponse,
    ) => void,
  ): void;
}

const GRPC_ADDRESS = process.env.GRPC_ADDRESS ?? "localhost:50052";

const messageClient = new MessageProto.message.MessageService(
  GRPC_ADDRESS,
  grpc.credentials.createInsecure(),
);

export const findMessageById = (messageId: string): Promise<MessageDto> => {
  return new Promise((resolve, reject) => {
    messageClient.findMessageById({ messageId }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response?.message) {
        reject(new Error("Message service returned no message"));
        return;
      }

      resolve(networkMessageToDto(response.message));
    });
  });
};
