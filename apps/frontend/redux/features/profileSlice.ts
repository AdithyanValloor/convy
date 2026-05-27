import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import axios from "axios";
import { updateEmail, updateUsername } from "./authSlice";
import { getGroupAvatarDownloadUrl, updateAvatar } from "./chatSlice";

/* -------------------- TYPES -------------------- */

/**
 * User profile model.
 * Represents editable profile data separate from auth state.
 */
export interface Profile {
  _id: string;
  displayName: string;
  username: string;
  pronouns?: string;
  bio?: string;
  status?: string;
  createdAt?: string;
  profilePicture?: {
    key: string | null;
  };
}

/**
 * Profile slice state.
 * Tracks profile data and request lifecycle.
 */
interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  fetched: boolean;
  error: string | null;
  profilePictureUrls: Record<string, string>;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  fetched: false,
  error: null,
  profilePictureUrls: {},
};

/* -------------------- THUNKS -------------------- */

/**
 * Fetch the current user's profile.
 */
export const fetchProfile = createAsyncThunk<
  Profile,
  void,
  { rejectValue: string }
>("profile/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/profile", { withCredentials: true });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to fetch profile",
      );
    }
    return rejectWithValue("Failed to fetch profile");
  }
});

/**
 * Update the user's profile.
 * Also synchronizes relevant fields with the auth slice.
 */
export const updateProfile = createAsyncThunk<
  Profile,
  Partial<Profile>,
  { rejectValue: string }
>("profile/update", async (data, { rejectWithValue }) => {
  try {
    const res = await api.put("/profile", data, { withCredentials: true });

    const updatedProfile: Profile = res.data;

    return updatedProfile;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update profile",
      );
    }
    return rejectWithValue("Failed to update profile");
  }
});

export const updateProfilePicture = createAsyncThunk<
  { key: string | null },
  string,
  { rejectValue: string }
>("profile/updateProfilePicture", async (key, { rejectWithValue }) => {
  try {
    const res = await api.put(
      "/file/profile-picture",
      { key },
      { withCredentials: true },
    );

    return res.data.profilePicture;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update profile picture",
      );
    }
    return rejectWithValue("Failed to update profile picture");
  }
});

/**
 * Get a pre-signed S3 download URL for profile key.
 */
export const getProfilePictureDownloadUrl = createAsyncThunk<
  { key: string; url: string },
  string,
  { rejectValue: string }
>("profile/getProfilePictureDownloadUrl", async (key, { rejectWithValue }) => {
  try {
    const res = await api.get("/file/profile-picture", {
      params: { key },
      withCredentials: true,
    });

    return { key, url: res.data.url };
  } catch {
    return rejectWithValue("Failed to get download URL");
  }
});

/* -------------------- SLICE -------------------- */

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    /**
     * Clear profile state (e.g., on logout).
     */
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
      state.fetched = false;
    },
  },
  extraReducers: (builder) => {
    builder
      /* -------- FETCH PROFILE -------- */
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.fetched = true;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch profile";
      })

      /* -------- UPDATE PROFILE -------- */
      .addCase(updateProfile.pending, (state, action) => {
        state.loading = true;
        state.error = null;

        if (state.profile) {
          state.profile = {
            ...state.profile,
            ...action.meta.arg,
          };
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update profile";
      })

      .addCase(updateUsername.fulfilled, (state, action) => {
        if (state.profile) {
          state.profile.username = action.payload.username;
        }
      })
      .addCase(updateEmail.fulfilled, (state, action) => {
        // email isn't in Profile type currently, add if needed
        // if (state.profile) state.profile.email = action.payload.email;
      })
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        if (state.profile) {
          const oldKey = state.profile.profilePicture?.key;

          state.profile.profilePicture = action.payload;

          if (oldKey) {
            delete state.profilePictureUrls[oldKey];
          }
        }
      })
      .addCase(getProfilePictureDownloadUrl.fulfilled, (state, action) => {
        state.profilePictureUrls[action.payload.key] = action.payload.url;
      })
      .addCase(getGroupAvatarDownloadUrl.fulfilled, (state, action) => {
        state.profilePictureUrls[action.payload.key] = action.payload.url;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        if (state.profile) {
          const oldKey = state.profile.profilePicture?.key;

          state.profile.profilePicture = action.payload;

          if (oldKey) {
            delete state.profilePictureUrls[oldKey];
          }
        }
      });
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
