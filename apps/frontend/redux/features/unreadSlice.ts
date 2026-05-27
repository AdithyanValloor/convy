import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import axios from "axios";
import { markAsUnread } from "./chatSlice";

/* -------------------- TYPES -------------------- */

/**
 * Unread message state.
 * Tracks unread counts per chat and the aggregated total.
 */
interface UnreadState {
  total: number;
  perChat: Record<string, number>;
  loading: boolean;
  error: string | null;
}

const initialState: UnreadState = {
  total: 0,
  perChat: {},
  loading: false,
  error: null,
};

/* -------------------- THUNKS -------------------- */

/**
 * Fetch unread message counts from the backend.
 * Used during application bootstrap or refresh.
 */
export const fetchUnreadCounts = createAsyncThunk<
  Record<string, number>,
  void,
  { rejectValue: string }
>("unread/fetchUnreadCounts", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get<{ unread: Record<string, number> }>(
      "/message/unread",
      { withCredentials: true }
    );
    return res.data.unread;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to fetch unread counts"
      );
    }
    return rejectWithValue("Failed to fetch unread counts");
  }
});

/* -------------------- SLICE -------------------- */

const unreadSlice = createSlice({
  name: "unread",
  initialState,
  reducers: {
    /**
     * Set the unread count for a specific chat.
     * Typically used when syncing counts from the backend.
     */
    setUnreadCount(
      state,
      action: PayloadAction<{ chatId: string; count: number }>
    ) {
      const { chatId, count } = action.payload;
      const prev = state.perChat[chatId] || 0;

      state.perChat[chatId] = count;
      state.total += count - prev;
    },

    /**
     * Increment unread count for a chat.
     * Used for real-time updates (e.g., incoming socket messages).
     */
    incrementUnread(
      state,
      action: PayloadAction<{ chatId: string; count?: number }>
    ) {
      const { chatId, count = 1 } = action.payload;

      state.perChat[chatId] = (state.perChat[chatId] || 0) + count;
      state.total += count;
    },

    /**
     * Reset unread count for a specific chat.
     * Called when the chat is opened or marked as read.
     */
    resetUnread(state, action: PayloadAction<string>) {
      const chatId = action.payload;
      const count = state.perChat[chatId] || 0;

      state.total -= count;
      state.perChat[chatId] = 0;
    },

    /**
     * Reset all unread counts.
     * Used on logout or full session reset.
     */
    resetAllUnread(state) {
      state.perChat = {};
      state.total = 0;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchUnreadCounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUnreadCounts.fulfilled, (state, action) => {
        state.loading = false;
        state.perChat = action.payload;

        // Recalculate total unread count
        state.total = Object.values(action.payload).reduce(
          (sum, count) => sum + count,
          0
        );
      })
      .addCase(fetchUnreadCounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch unread counts";
      })
      .addCase(markAsUnread.fulfilled, (state, action) => {
        const { chatId, count } = action.payload;

        const prev = state.perChat[chatId] || 0;
        state.perChat[chatId] = count;
        state.total += count - prev;
      })
  },
});

export const {
  setUnreadCount,
  incrementUnread,
  resetUnread,
  resetAllUnread,
} = unreadSlice.actions;

export default unreadSlice.reducer;
