import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

const selectChats = (state: RootState) => state.chat.chats;
const selectPerChat = (state: RootState) => state.unread.perChat;

/**
 * Total unread count excluding archived chats.
 * Used by the Sidebar badge on the Inbox tab.
 */
export const selectActiveUnreadTotal = createSelector(
  [selectChats, selectPerChat],
  (chats, perChat) =>
    chats.reduce((sum, chat) => {
      if (chat.isArchived) return sum;
      return sum + (perChat[chat._id] ?? 0);
    }, 0),
);

/**
 * Unread count for personal (non-group, non-archived) chats.
 * Used by the Personal tab badge in InboxSection.
 */
export const selectPersonalUnread = createSelector(
  [selectChats, selectPerChat],
  (chats, perChat) =>
    chats.reduce((sum, chat) => {
      if (chat.isGroup || chat.isArchived) return sum;
      return sum + (perChat[chat._id] ?? 0);
    }, 0),
);

/**
 * Unread count for group (non-archived) chats.
 * Used by the Groups tab badge in InboxSection.
 */
export const selectGroupUnread = createSelector(
  [selectChats, selectPerChat],
  (chats, perChat) =>
    chats.reduce((sum, chat) => {
      if (!chat.isGroup || chat.isArchived) return sum;
      return sum + (perChat[chat._id] ?? 0);
    }, 0),
);