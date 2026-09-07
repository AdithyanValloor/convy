import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

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
    MediaService: new (
      address: string,
      credentials: grpc.ChannelCredentials,
    ) => MediaServiceClient;
  };
};

interface GenerateDownloadUrlRequest {
  key: string;
}

interface GenerateDownloadUrlResponse {
  url: string;
}

interface MediaServiceClient {
  generateDownloadUrl(
    request: GenerateDownloadUrlRequest,
    callback: (
      error: grpc.ServiceError | null,
      response?: GenerateDownloadUrlResponse,
    ) => void,
  ): void;
}

const GRPC_ADDRESS = process.env.GRPC_ADDRESS ?? "localhost:50051";

const mediaClient = new mediaProto.media.MediaService(
  GRPC_ADDRESS,
  grpc.credentials.createInsecure(),
);

export const generateDownloadUrl = (key: string): Promise<GenerateDownloadUrlResponse> => {
  return new Promise((resolve, reject) => {
    mediaClient.generateDownloadUrl({ key }, (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      if (!response) {
        reject(new Error("Media service returned no response"));
        return;
      }

      resolve(response);
    });
  });
};
