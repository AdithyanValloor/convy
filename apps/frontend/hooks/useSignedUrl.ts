"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getProfilePictureDownloadUrl } from "@/redux/features/profileSlice";
import { getGroupAvatarDownloadUrl } from "@/redux/features/chatSlice";

export function useSignedUrl(key?: string | null, chatId?: string) {
  const dispatch = useAppDispatch();

  const url = useAppSelector((state) =>
    key ? state.profile.profilePictureUrls[key] : undefined
  );

  useEffect(() => {
    if (!key || url) return;

    if (key.startsWith("group/") && chatId) {
      dispatch(getGroupAvatarDownloadUrl({ chatId, key }));
    } else {
      dispatch(getProfilePictureDownloadUrl(key));
    }
  }, [key, url, chatId, dispatch]);

  return url;
}