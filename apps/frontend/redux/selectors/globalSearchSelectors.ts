import { RootState } from "../store";
import { Chat } from "@/types/chat.types";

export type ChatWithResolvedName = Chat & { resolvedName: string };

const getResolvedChatName = (chat: Chat, currentUserId: string): string => {
  if (chat.isGroup) return chat.chatName ?? "Unnamed Group";
  const other = chat.members.find((m) => m._id !== currentUserId);
  return other?.displayName ?? other?.username ?? "Unknown";
};

export const selectFilteredFriends = (state: RootState, query: string) => {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];
  return state.friends.friends.filter(
    (f) =>
      f.displayName?.toLowerCase().includes(q) ||
      f.username.toLowerCase().includes(q),
  );
};

export const selectFilteredChats = (
  state: RootState,
  query: string,
): ChatWithResolvedName[] => {
  const q = query.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  const currentUserId = state.auth.user?._id ?? "";

  return state.chat.chats
    .map((c) => ({
      ...c,
      resolvedName: getResolvedChatName(c, currentUserId),
    }))
    .filter((c) => c.resolvedName.toLowerCase().includes(q));
};