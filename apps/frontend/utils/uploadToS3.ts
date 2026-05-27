import api from "@/utils/axiosInstance";

export const uploadFileToS3 = async (file: File, chatId: string) => {
  const res = await api.post("/file/chat/upload", {
    fileType: file.type,
    fileSize: file.size,
    chatId
  });

  const { uploadUrl, key } = res.data;

  await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  return {
    key,
    mimeType: file.type,
    size: file.size,
  };
};

export const uploadProfilePictureToS3 = async (file: File) => {
  const res = await api.post("/file/profile-picture", {
    fileType: file.type,
    fileSize: file.size,
  });

  const { uploadUrl, key } = res.data;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Upload failed");
  }

  return key;
};

export const uploadGroupAvatarToS3 = async (
  file: File,
  options: { temp?: boolean; groupId?: string }
) => {
  const res = await api.post("/file/avatar", {
    fileType: file.type,
    fileSize: file.size,
    temp: options.temp ?? false,
    groupId: options.groupId,
  });

  const { uploadUrl, key } = res.data;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error("Upload failed");
  }

  return key;
};