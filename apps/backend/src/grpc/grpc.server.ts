import * as grpc from "@grpc/grpc-js";

import { userGrpcService, userProto } from "../services/user/grpc/user.grpc.js";
import {
  socialGrpcService,
  socialProto,
} from "../services/social/grpc/social.grpc.js";
import {
  mediaGrpcService,
  mediaProto,
} from "../services/media/rpc/media.rpc.js";

const GRPC_PORT = process.env.USER_GRPC_PORT ?? "50051";

export const startUserGrpcServer = () => {
  const server = new grpc.Server();

  server.addService(userProto.user.UserService.service, userGrpcService);

  server.addService(mediaProto.media.MediaService.service, mediaGrpcService);

  server.addService(
    socialProto.social.SocialService.service,
    socialGrpcService,
  );

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
