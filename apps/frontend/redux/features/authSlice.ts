import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import axios from "axios";
import { mapAuthUser } from "@/utils/mapAuthUser";
import { updateProfile } from "./profileSlice";

/**
 * Authenticated user model stored in Redux.
 * This represents the client-side view of the user,
 * not the raw API response.
 */
export interface AuthUser {
  _id: string;
  displayName: string;
  username: string;
  
  profilePicture?: {
    key: string | null;
  };

  bio?: string;
  pronouns?: string;
  createdAt?: string;
  isActive?: boolean;
  isBanned?: boolean;
}

/**
 * Authentication slice state.
 * Holds the current user and request status.
 */

interface AuthState {
  user: AuthUser | null;
  sessionLoading: boolean;
  error: string | null;
  // --- account settings ---
  accountLoading: boolean; // covers all account mutations
  scheduledDeletionAt: string | null; // shown in UI during grace period
}

const initialState: AuthState = {
  user: null,
  sessionLoading: true,
  error: null,
  accountLoading: false,
  scheduledDeletionAt: null,
};

/**
 * Successful authentication response shape
 * shared by login refresh flows.
 */
interface AuthSuccessPayload {
  user: AuthUser;
}

// ---------------- THUNKS ----------------

/**
 * Log in a user using email and password.
 * On success, stores the authenticated user.
 */
export const loginUser = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: string }
>("auth/loginUser", async ({ email, password }, { rejectWithValue }) => {
  try {
    await api.post("/auth/login", { email, password });
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Login failed",
      );
    }

    return rejectWithValue("Login failed");
  }
});

/**
 * Fetch the currently authenticated user.
 * Used on app initialization to restore session state.
 */
export const fetchCurrentUser = createAsyncThunk<
  AuthUser,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/user/me");

    return mapAuthUser(res.data.user);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to fetch user",
      );
    }
    return rejectWithValue("Failed to fetch user");
  }
});

/**
 * Log out the current user and clear authentication state.
 */
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.message ?? "Logout failed");
      }
      return rejectWithValue("Logout failed");
    }
  },
);

/**
 * Update the user's @username.
 * Updates the stored user on success.
 */
export const updateUsername = createAsyncThunk<
  AuthUser,
  { username: string },
  { rejectValue: string }
>("auth/updateUsername", async ({ username }, { rejectWithValue }) => {
  try {
    const res = await api.patch("/user/account/username", { username });
    return mapAuthUser(res.data.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update username",
      );
    }
    return rejectWithValue("Failed to update username");
  }
});

/**
 * Update the user's email address.
 * Updates the stored user on success.
 */
export const updateEmail = createAsyncThunk<
  AuthUser,
  { email: string, otp: string },
  { rejectValue: string }
>("auth/updateEmail", async ({ email, otp }, { rejectWithValue }) => {
  try {
    const res = await api.patch("/auth/email", { email, otp });
    return mapAuthUser(res.data.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update email",
      );
    }
    return rejectWithValue("Failed to update email");
  }
});

/**
 * Change the user's password.
 * Returns nothing on success — no user data touched.
 */
export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await api.patch("/auth/password", {
        currentPassword,
        newPassword,
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(
          err.response?.data?.message ?? "Failed to change password",
        );
      }
      return rejectWithValue("Failed to change password");
    }
  },
);

/**
 * Deactivate the account.
 * Clears the user from state — session ends immediately.
 */
export const deactivateAccount = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/deactivateAccount", async (_, { rejectWithValue }) => {
  try {
    await api.patch("/user/account/deactivate");
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to deactivate account",
      );
    }
    return rejectWithValue("Failed to deactivate account");
  }
});

/**
 * Schedule account deletion after grace period.
 * Clears user from state — account is hidden immediately.
 * Returns scheduledDeletionAt so UI can show the expiry date.
 */
export const scheduleAccountDeletion = createAsyncThunk<
  { scheduledDeletionAt: string },
  { password: string },
  { rejectValue: string }
>("auth/scheduleAccountDeletion", async ({ password }, { rejectWithValue }) => {
  try {
    const res = await api.post("/user/account/deletion/schedule", { password });
    return res.data.data; // { scheduledDeletionAt }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to schedule deletion",
      );
    }
    return rejectWithValue("Failed to schedule deletion");
  }
});

/**
 * Cancel a scheduled deletion during the grace period.
 * Restores the user session.
 */
export const cancelScheduledDeletion = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/cancelScheduledDeletion", async (_, { rejectWithValue }) => {
  try {
    await api.post("/user/account/deletion/cancel");
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to cancel deletion",
      );
    }
    return rejectWithValue("Failed to cancel deletion");
  }
});

/**
 * Verify password before a sensitive action.
 * Does not modify any state — purely a gate check.
 */
export const checkPassword = createAsyncThunk<
  void,
  { password: string },
  { rejectValue: string }
>("auth/checkPassword", async ({ password }, { rejectWithValue }) => {
  try {
    const res = await api.post("/auth/check-password", { password });

    if (!res.data.isMatch) {
      return rejectWithValue("Incorrect password");
    }
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Incorrect password",
      );
    }
    return rejectWithValue("Incorrect password");
  }
});
// ---------------- SLICE ----------------

/**
 * Authentication slice.
 * Manages user session and auth-related loading/error state.
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Sets the authenticated user.
     */
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.sessionLoading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload ?? "Login failed";
      })

      // SESSION RESTORE
      .addCase(fetchCurrentUser.pending, (state) => {
        state.sessionLoading = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.sessionLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.sessionLoading = false;
        state.user = null;
      })

      //LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
        state.sessionLoading = false;
      })

      // UPDATE USERNAME
      .addCase(updateUsername.pending, (state) => {
        state.accountLoading = true;
        state.error = null;
      })
      .addCase(updateUsername.fulfilled, (state, action) => {
        state.accountLoading = false;
        state.user = action.payload; // username reflected immediately
      })
      .addCase(updateUsername.rejected, (state, action) => {
        state.accountLoading = false;
        state.error = action.payload ?? "Failed to update username";
      })

      // UPDATE EMAIL
      .addCase(updateEmail.pending, (state) => {
        state.accountLoading = true;
        state.error = null;
      })
      .addCase(updateEmail.fulfilled, (state, action) => {
        state.accountLoading = false;
        state.user = action.payload;
      })
      .addCase(updateEmail.rejected, (state, action) => {
        state.accountLoading = false;
        state.error = action.payload ?? "Failed to update email";
      })

      // CHANGE PASSWORD
      .addCase(changePassword.pending, (state) => {
        state.accountLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.accountLoading = false;
        // no user update needed — password never lives in state
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.accountLoading = false;
        state.error = action.payload ?? "Failed to change password";
      })

      // DEACTIVATE
      .addCase(deactivateAccount.pending, (state) => {
        state.accountLoading = true;
        state.error = null;
      })
      .addCase(deactivateAccount.fulfilled, (state) => {
        state.accountLoading = false;
        state.user = null; // session ends — router should redirect to /login
      })
      .addCase(deactivateAccount.rejected, (state, action) => {
        state.accountLoading = false;
        state.error = action.payload ?? "Failed to deactivate account";
      })

      // SCHEDULE DELETION
      .addCase(scheduleAccountDeletion.pending, (state) => {
        state.accountLoading = true;
        state.error = null;
      })
      .addCase(scheduleAccountDeletion.fulfilled, (state, action) => {
        state.accountLoading = false;
        state.user = null; // account hidden — session ends
        state.scheduledDeletionAt = action.payload.scheduledDeletionAt;
      })
      .addCase(scheduleAccountDeletion.rejected, (state, action) => {
        state.accountLoading = false;
        state.error = action.payload ?? "Failed to schedule deletion";
      })

      // CANCEL DELETION
      .addCase(cancelScheduledDeletion.pending, (state) => {
        state.accountLoading = true;
        state.error = null;
      })
      .addCase(cancelScheduledDeletion.fulfilled, (state) => {
        state.accountLoading = false;
        state.scheduledDeletionAt = null;
      })
      .addCase(cancelScheduledDeletion.rejected, (state, action) => {
        state.accountLoading = false;
        state.error = action.payload ?? "Failed to cancel deletion";
      })

      .addCase(updateProfile.fulfilled, (state, action) => {
        if (state.user) {
          state.user.displayName = action.payload.displayName;
          state.user.username = action.payload.username;
          if (action.payload.profilePicture) {
            state.user.profilePicture = {
              key: action.payload.profilePicture.key,
            };
          }
        }
      });
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
