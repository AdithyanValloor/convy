import api from "@/utils/axiosInstance";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

// ---------------------------------------------------------------------------
// Types (MATCH BACKEND EXACTLY)
// ---------------------------------------------------------------------------

export interface NotificationSettings {
  allNotifications: boolean;
  newMessages: boolean;
  mentions: boolean;
  friendRequests: boolean;
  friendRequestAccepted: boolean;
  groupAdded: boolean;
}

interface NotificationSettingsState {
  settings: NotificationSettings;
  fetched: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultSettings: NotificationSettings = {
  allNotifications: true,
  newMessages: true,
  mentions: true,
  friendRequests: true,
  friendRequestAccepted: true,
  groupAdded: true,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Server error";
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
};

// ---------------------------------------------------------------------------
// Thunks 
// ---------------------------------------------------------------------------

export const fetchNotificationSettings = createAsyncThunk<
  NotificationSettings,
  void,
  { rejectValue: string }
>("notificationSettings/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/user/notification-settings");
    return res.data.data as NotificationSettings;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateNotificationSettings = createAsyncThunk<
  NotificationSettings,
  Partial<NotificationSettings>,
  { rejectValue: string }
>("notificationSettings/update", async (patch, { rejectWithValue }) => {
  try {
    const res = await api.patch("/user/notification-settings", patch);
    return res.data.data as NotificationSettings;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

const initialState: NotificationSettingsState = {
  settings: defaultSettings,
  fetched: false,
  loading: false,
  saving: false,
  error: null,
};

const notificationSettingsSlice = createSlice({
  name: "notificationSettings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.fetched = true;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load notification settings";
      })

      // UPDATE
      .addCase(updateNotificationSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.settings = action.payload;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to save notification settings";
      });
  },
});

export default notificationSettingsSlice.reducer;