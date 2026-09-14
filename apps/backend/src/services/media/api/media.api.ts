import { deleteFile, generateDownloadUrl } from "../s3.service.js";

/** Returns a signed download URL for an existing object key. */
export const generateDownloadUrlApi = async (key: string) => {
  const url = await generateDownloadUrl(key);
  return url;
};

export const deleteFileApi = async (key: string) => {
  await deleteFile(key);
};
