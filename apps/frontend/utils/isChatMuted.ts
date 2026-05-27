import { store } from "@/redux/store";

export const isChatMuted = (chatId: string ): boolean => {
  const chat = store.getState().chat.chats.find((c) => c._id === chatId);
  if (!chat?.mutedUntil) return false;
  return new Date(chat.mutedUntil) > new Date();
};

export const isChatSilenced = (chatId: string): boolean => {
  const chat = store.getState().chat.chats.find((c) => c._id === chatId);
  if (!chat) return false;

  const muted = chat.mutedUntil ? new Date(chat.mutedUntil) > new Date() : false;
  const archived = chat.isArchived ?? false;

  return muted || archived;
};