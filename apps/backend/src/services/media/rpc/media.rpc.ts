import path from "node:path";

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { generateDownloadUrlApi } from "../api/media.api.js";

const protoPath = path.resolve(
  process.cwd(),
  "../../packages/proto/media.proto",
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const mediaProto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
  media: {
    MediaService: {
      service: grpc.ServiceDefinition;
    };
  };
};

interface GenerateDownloadUrlApiCall {
  request: {
    key: string;
  };
}

interface GenerateDownloadUrlApiCallback {
  (error: grpc.ServiceError | null, response?: { url: string }): void;
}

export const mediaGrpcService = {
  generateDownloadUrlApi: async (
    call: GenerateDownloadUrlApiCall,
    callback: GenerateDownloadUrlApiCallback,
  ) => {
    try {
      const { key } = call.request;

      const url = await generateDownloadUrlApi(key);

      callback(null, {
        url,
      });
    } catch (error) {
      callback(error as grpc.ServiceError);
    }
  },
};

export { mediaProto };
