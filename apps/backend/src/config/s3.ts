import { S3Client } from "@aws-sdk/client-s3";

// Fail fast on boot so S3-dependent flows do not break later at runtime.
const requiredEnvVars = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_BUCKET_NAME",
] as const;

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

// Reuse the validated bucket name wherever uploads or reads are performed.
export const BUCKET_NAME = process.env.AWS_BUCKET_NAME!;

// Shared S3 client instance for the application.
export const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
