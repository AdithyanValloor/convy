import api from "@/utils/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

export type NotificationType =
  | "mention"
  | "reply"
  | "friend_request_received"
  | "friend_request_accepted"
  | "group_added";

export interface NotificationActor {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: {
    key: string | null;
  };
}

export interface NotificationChat {
  _id: string;
  chatName?: string;
  isGroup?: boolean;
}

export interface NotificationGroup {
  _id: string;
  chatName?: string;
  isGroup?: boolean;
}

export interface NotificationMessage {
  _id: string;
  content: string;
  chat?: string;
}

export interface InboxNotification {
  _id: string;
  type: NotificationType;
  actor?: NotificationActor;
  chat?: NotificationChat;
  message?: NotificationMessage;
  group?: NotificationGroup;
  friendRequest?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: InboxNotification[];
  unreadCount: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Server error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
};

export const fetchNotifications = createAsyncThunk<
  { notifications: InboxNotification[]; unreadCount: number },
  number | undefined,
  { rejectValue: string }
>("notifications/fetchNotifications", async (page = 1, { rejectWithValue }) => {
  try {
    const res = await api.get(`/notifications?page=${page}`, {
      withCredentials: true,
    });

    return {
      notifications: res.data.notifications,
      unreadCount: res.data.unreadCount,
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchUnreadCount = createAsyncThunk<
  { unreadCount: number },
  void,
  { rejectValue: string }
>("notifications/unreadCount", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/notifications/unread-count", {
      withCredentials: true,
    });

    return {
      unreadCount: res.data.unreadCount,
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const markNotificationRead = createAsyncThunk<
  InboxNotification,
  string,
  { rejectValue: string }
>("notifications/markRead", async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/notifications/${id}/read`, null, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const markAllNotificationsRead = createAsyncThunk<
  { success: boolean },
  void,
  { rejectValue: string }
>("notifications/markAllRead", async (_, { rejectWithValue }) => {
  try {
    const res = await api.patch("/notifications/read-all", null, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const deleteNotification = createAsyncThunk<
  { notificationId: string },
  string,
  { rejectValue: string }
>("notifications/delete", async (id, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/notifications/${id}`, {
      withCredentials: true,
    });

    return res.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const markMentionsReadForChat = createAsyncThunk<
  { chatId: string },
  string,
  { rejectValue: string }
>(
  "notifications/markMentionsReadForChat",
  async (chatId, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/chat/${chatId}/read-mentions`, null, {
        withCredentials: true,
      });

      return { chatId };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  actionLoading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notifications",
  initialState,

  reducers: {
    /* -------- SOCKET: NEW NOTIFICATION -------- */
    addNotificationFromSocket: (state, action) => {
      const exists = state.notifications.some(
        (n) => n._id === action.payload._id,
      );

      if (!exists) {
        state.notifications.unshift(action.payload);
        state.unreadCount += 1;
      }
    },

    /* -------- SOCKET: REMOVE FRIEND REQUEST NOTIFICATION -------- */
    removeNotificationByFriendRequest: (state, action) => {
      state.notifications = state.notifications.filter(
        (n) => n.friendRequest !== action.payload,
      );
    },

    /* -------- SOCKET: MARK READ -------- */
    markNotificationReadLocal: (state, action) => {
      const notif = state.notifications.find((n) => n._id === action.payload);

      if (notif && !notif.read) {
        notif.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    deleteNotificationLocal: (state, action) => {
      const notif = state.notifications.find((n) => n._id === action.payload);

      state.notifications = state.notifications.filter(
        (n) => n._id !== action.payload,
      );

      if (notif && !notif.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    setActionLoading: (state, action) => {
      state.actionLoading = action.payload;
    },

    setUnreadNotificationCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    clearMentionsForChat: (state, action) => {
      const chatId = action.payload;

      state.notifications.forEach((n) => {
        if (n.type === "mention" && n.chat?._id === chatId && !n.read) {
          n.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });
    },
  },

  extraReducers: (builder) => {
    builder

      /* -------- FETCH NOTIFICATIONS -------- */
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })

      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch notifications";
      })

      /* -------- FETCH UNREAD COUNT -------- */
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount;
      })

      /* -------- MARK ONE READ -------- */
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notif = state.notifications.find(
          (n) => n._id === action.payload._id,
        );

        if (notif) {
          notif.read = true;
        }

        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })

      /* -------- DELETE NOTIFICATION -------- */
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter(
          (n) => n._id !== action.payload.notificationId,
        );
      })

      /* -------- MARK ALL READ -------- */
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => (n.read = true));
        state.unreadCount = 0;
      })

      .addCase(markMentionsReadForChat.fulfilled, (state, action) => {
        const chatId = action.payload.chatId;

        state.notifications.forEach((n) => {
          if (n.type === "mention" && n.chat?._id === chatId && !n.read) {
            n.read = true;
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        });
      });
  },
});

export const {
  addNotificationFromSocket,
  markNotificationReadLocal,
  setActionLoading,
  removeNotificationByFriendRequest,
  deleteNotificationLocal,
  setUnreadNotificationCount,
  clearMentionsForChat,
} = notificationSlice.actions;

export default notificationSlice.reducer;
