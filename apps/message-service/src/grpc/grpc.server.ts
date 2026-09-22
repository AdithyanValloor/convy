import * as grpc from "@grpc/grpc-js";
import { chatGrpcService, chatProto } from "./servers/chat.grpc.js";

const GRPC_PORT = process.env.GRPC_PORT ?? "50051";

export const startChatGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(chatProto.chat.ChatService.service, chatGrpcService);

  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("Failed to start gRPC server:", error);
        return;
      }

      console.log(`gRPC server listening on port ${port}`);
    },
  );

  return server;
};
