import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import axios from "axios";

export interface PrivacySettings {
  friendRequests: "everyone" | "friends" | "nobody";
  readReceipts: boolean;
  typingIndicators: boolean;
}

interface PrivacyState {
  settings: PrivacySettings;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetched: boolean;
}

const defaultSettings: PrivacySettings = {
  friendRequests: "everyone",
  readReceipts: true,
  typingIndicators: true,
};

const initialState: PrivacyState = {
  settings: defaultSettings,
  loading: false,
  saving: false,
  error: null,
  fetched: false,
};

/**
 * Fetch the user's privacy settings.
 * Called on settings page mount — not part of bootstrap
 * since most users never open privacy settings.
 */
export const fetchPrivacySettings = createAsyncThunk<
  PrivacySettings,
  void,
  { rejectValue: string }
>("privacy/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/user/privacy");
    return res.data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to fetch privacy settings",
      );
    }
    return rejectWithValue("Failed to fetch privacy settings");
  }
});

/**
 * Save updated privacy settings.
 */
export const updatePrivacySettings = createAsyncThunk<
  PrivacySettings,
  Partial<PrivacySettings>,
  { rejectValue: string }
>("privacy/update", async (updates, { rejectWithValue }) => {
  try {
    const res = await api.patch("/user/privacy", updates);
    return res.data.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update privacy settings",
      );
    }
    return rejectWithValue("Failed to update privacy settings");
  }
});

const privacySlice = createSlice({
  name: "privacy",
  initialState,
  reducers: {
    clearPrivacyError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchPrivacySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrivacySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.fetched = true;
      })
      .addCase(fetchPrivacySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch privacy settings";
      })

      // UPDATE
      .addCase(updatePrivacySettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updatePrivacySettings.fulfilled, (state, action) => {
        state.saving = false;
        state.settings = action.payload;
      })
      .addCase(updatePrivacySettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload ?? "Failed to update privacy settings";
      });
  },
});

export const { clearPrivacyError } = privacySlice.actions;
export default privacySlice.reducer;