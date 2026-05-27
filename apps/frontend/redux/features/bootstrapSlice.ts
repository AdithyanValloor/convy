import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchFriends, fetchRequests } from "./friendsSlice";
import { fetchChats } from "./chatSlice";
import { fetchUnreadCounts } from "./unreadSlice";
import { logoutUser } from "./authSlice";
import { fetchMessages } from "./messageSlice";
import type { RootState } from "@/redux/store";
import type { AuthUser } from "./authSlice";

import type { FriendUser, FriendRequest } from "./friendsSlice";
import axios from "axios";
import { fetchBlockedByUsers, fetchBlockedUsers } from "./blockSlice";
import { fetchNotifications, InboxNotification } from "./notificationSlice";
import { Chat } from "@/types/chat.types";
import { fetchMessageRequests, MessageRequest } from "./requestSlice";
import { fetchProfile, Profile } from "./profileSlice";

/**
 * Result returned after successful application bootstrap.
 * Contains all core data required to render the initial UI.
 */
interface BootstrapResult {
  currentUser: AuthUser;
  profile: Profile;
  friends: FriendUser[];
  requests: {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  };
  messageRequests: {
  incoming: MessageRequest[];
};
  chats: Chat[];
  unread: Record<string, number>;
  notifications: InboxNotification[];
}

/**
 * Application bootstrap thunk.
 *
 * Orchestrates fetching of all essential data required
 * after authentication and before rendering the main UI.
 */

export const bootstrapApp = createAsyncThunk<
  BootstrapResult,
  void,
  {
    state: RootState;
    rejectValue: string;
  }
>("app/bootstrap", async (_, { dispatch, getState, rejectWithValue }) => {
  try {
    const state = getState();
    const currentUser = state.auth.user;

    if (!currentUser) {
      console.log("⏭ Skipping bootstrap: no authenticated user");

      return {
        profile: null as unknown as Profile,
        currentUser: null as unknown as AuthUser,
        friends: [],
        requests: { incoming: [], outgoing: [] },
        messageRequests: { incoming: [], outgoing: [] },
        chats: [],
        unread: {},
        notifications: [],
      };
    }

    console.log("🚀 Bootstrapping app for user:", currentUser.username);

    const [
      profile,
      friends,
      requests,
      chats,
      unread,
      blockedUsers,
      blockedByUsers,
      notificationResult,
      messageRequests,
    ] = await Promise.all([
      dispatch(fetchProfile()).unwrap(),
      dispatch(fetchFriends()).unwrap(),
      dispatch(fetchRequests()).unwrap(),
      dispatch(fetchChats()).unwrap(),
      dispatch(fetchUnreadCounts()).unwrap(),
      dispatch(fetchBlockedUsers()).unwrap(),
      dispatch(fetchBlockedByUsers()).unwrap(),
      dispatch(fetchNotifications()).unwrap(),
      dispatch(fetchMessageRequests()).unwrap(),
    ]);

    console.log("✅ Core data fetched, now fetching last messages");

    if (chats.length > 0) {
      const messagePromises = chats.map((chat) =>
        dispatch(
          fetchMessages({
            chatId: chat._id,
            page: 1,
            limit: 1,
          }),
        )
          .unwrap()
          .catch((err) => {
            console.warn(
              `Failed to fetch last message for chat ${chat._id}`,
              err,
            );
            return null;
          }),
      );

      await Promise.allSettled(messagePromises);
    }

    console.log("✅ Bootstrap complete");

    return {
      profile,
      currentUser,
      friends,
      requests,
      chats,
      unread,
      blockedUsers,
      blockedByUsers,
      notifications: notificationResult.notifications,
      messageRequests,
    };
  } catch (error: unknown) {
    console.error("❌ Bootstrap failed:", error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (
        status === 401 ||
        status === 403 ||
        error.response?.data?.message?.toLowerCase().includes("auth")
      ) {
        console.log("🔐 Auth error during bootstrap, logging out");
        dispatch(logoutUser());
      }

      return rejectWithValue(
        error.response?.data?.message ?? "Bootstrap failed",
      );
    }

    return rejectWithValue("Bootstrap failed");
  }
});