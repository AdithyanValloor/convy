import * as grpc from "@grpc/grpc-js";

import { userGrpcService, userProto } from "./user.grpc.js";

const GRPC_PORT = process.env.USER_GRPC_PORT ?? "50051";

export const startUserGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(
    userProto.user.UserService.service,
    userGrpcService,
  );

  server.bindAsync(
    `0.0.0.0:${GRPC_PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("Failed to start User gRPC server:", error);
        return;
      }

      console.log(
        `User gRPC server listening on port ${port}`,
      );
    },
  );

  return server;
};