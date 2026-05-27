import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import axios from "axios";

/* -------------------- TYPES -------------------- */

/**
 * Lightweight user representation used in friends context.
 */
export interface FriendUser {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: {
    key: string | null;
  };
  isActive?: boolean;
  isBanned?: boolean;
}

/**
 * Friend request model representing incoming and outgoing requests.
 */
export interface FriendRequest {
  _id: string;
  from: FriendUser;
  to: FriendUser;
  createdAt?: string;
}

/**
 * Friends slice state.
 * Manages friend list, requests, and related loading states.
 */
interface FriendsState {
  friends: FriendUser[];
  requests: {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  };
  listLoading: boolean;
  requestLoading: boolean;
  actionLoading: boolean;
  error: string | null;
}

/* -------------------- ERROR HELPER -------------------- */

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || "Server error";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
};

/* -------------------- THUNKS -------------------- */

/**
 * Fetch the current user's friend list.
 */
export const fetchFriends = createAsyncThunk<
  FriendUser[],
  void,
  { rejectValue: string }
>("friends/fetchFriends", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/friends", { withCredentials: true });
    return res.data.friendList;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Fetch incoming and outgoing friend requests.
 */
export const fetchRequests = createAsyncThunk<
  { incoming: FriendRequest[]; outgoing: FriendRequest[] },
  void,
  { rejectValue: string }
>("friends/fetchRequests", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/friends/requests", { withCredentials: true });
    return res.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Send a friend request to another user.
 */
export const addFriend = createAsyncThunk<
  FriendRequest,
  string,
  { rejectValue: string }
>("friends/addFriend", async (username, { rejectWithValue }) => {
  try {
    const res = await api.post(
      "/friends",
      { username },
      { withCredentials: true },
    );
    return res.data.request;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Accept an incoming friend request.
 */
export const acceptFriend = createAsyncThunk<
  FriendRequest,
  string,
  { rejectValue: string }
>("friends/acceptFriend", async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(
      "/friends/accept",
      { id },
      { withCredentials: true },
    );
    return res.data.request;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Reject an incoming friend request.
 */
export const rejectFriend = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("friends/rejectFriend", async (id, { rejectWithValue }) => {
  try {
    await api.post("/friends/reject", { id }, { withCredentials: true });
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Cancel an outgoing friend request.
 */
export const cancelFriend = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("friends/cancelFriend", async (id, { rejectWithValue }) => {
  try {
    await api.post("/friends/cancel", { id }, { withCredentials: true });
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Remove an existing friend.
 */
export const removeFriend = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("friends/removeFriend", async (id, { rejectWithValue }) => {
  try {
    await api.post("/friends/remove", { id }, { withCredentials: true });
    return id;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/* -------------------- SLICE -------------------- */

const initialState: FriendsState = {
  friends: [],
  requests: { incoming: [], outgoing: [] },
  listLoading: false,
  requestLoading: false,
  actionLoading: false,
  error: null,
};

const friendSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    // ---------- SOCKET: REQUESTS ----------
    addIncomingRequest: (state, action) => {
      const exists = state.requests.incoming.some(
        (r) => r._id === action.payload._id,
      );
      if (!exists) {
        state.requests.incoming.push(action.payload);
      }
    },

    addOutgoingRequest: (state, action) => {
      const exists = state.requests.outgoing.some(
        (r) => r._id === action.payload._id,
      );
      if (!exists) {
        state.requests.outgoing.push(action.payload);
      }
    },

    removeIncomingRequest: (state, action) => {
      state.requests.incoming = state.requests.incoming.filter(
        (r) => r._id !== action.payload,
      );
    },

    removeOutgoingRequest: (state, action) => {
      state.requests.outgoing = state.requests.outgoing.filter(
        (r) => r._id !== action.payload,
      );
    },

    // ---------- SOCKET: FRIENDS ----------
    addFriendFromSocket: (state, action) => {
      const { requestId, friend } = action.payload;

      state.requests.incoming = state.requests.incoming.filter(
        (r) => r._id !== requestId,
      );

      state.requests.outgoing = state.requests.outgoing.filter(
        (r) => r._id !== requestId,
      );

      if (!state.friends.some((f) => f._id === friend._id)) {
        state.friends.push(friend);
      }
    },
    removeFriendFromSocket: (state, action) => {
      const removedUserId = action.payload;

      state.friends = state.friends.filter((f) => f._id !== removedUserId);

      state.requests.incoming = state.requests.incoming.filter(
        (r) => r.from._id !== removedUserId && r.to._id !== removedUserId,
      );

      state.requests.outgoing = state.requests.outgoing.filter(
        (r) => r.from._id !== removedUserId && r.to._id !== removedUserId,
      );
    },
    setActionLoading: (state, action) => {
      state.actionLoading = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder

      /* -------- FETCH FRIENDS -------- */
      .addCase(fetchFriends.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.listLoading = false;

        // Always normalize by id to prevent accidental duplicates
        const unique = new Map<string, FriendUser>();
        action.payload.forEach((friend) => {
          unique.set(friend._id, friend);
        });

        state.friends = Array.from(unique.values());
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload ?? "Failed to fetch friends";
      })

      /* -------- FETCH REQUESTS -------- */
      .addCase(fetchRequests.pending, (state) => {
        state.requestLoading = true;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.requestLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.requestLoading = false;
        state.error = action.payload ?? "Failed to fetch requests";
      })

      /* -------- ADD FRIEND (SEND REQUEST) -------- */
      .addCase(addFriend.fulfilled, (state, action) => {
        const request = action.payload;

        // Prevent duplicate outgoing requests
        if (!state.requests.outgoing.some((r) => r._id === request._id)) {
          state.requests.outgoing.push(request);
        }
      })

      /* -------- ACCEPT FRIEND -------- */
      .addCase(acceptFriend.fulfilled, (state, action) => {
        const request = action.payload;

        // Remove request from BOTH arrays
        state.requests.incoming = state.requests.incoming.filter(
          (r) => r._id !== request._id,
        );

        state.requests.outgoing = state.requests.outgoing.filter(
          (r) => r._id !== request._id,
        );

        // Determine correct friend user
        // If you accepted incoming, friend is request.from
        const friendUser = request.from;

        // Ensure no duplicate friend entries
        const exists = state.friends.some((f) => f._id === friendUser._id);

        if (!exists) {
          state.friends.push(friendUser);
        }
      })

      /* -------- REJECT -------- */
      .addCase(rejectFriend.fulfilled, (state, action) => {
        const requestId = action.payload;

        state.requests.incoming = state.requests.incoming.filter(
          (r) => r._id !== requestId,
        );
      })

      /* -------- CANCEL -------- */
      .addCase(cancelFriend.fulfilled, (state, action) => {
        const requestId = action.payload;

        state.requests.outgoing = state.requests.outgoing.filter(
          (r) => r._id !== requestId,
        );
      })

      /* -------- REMOVE FRIEND -------- */
      .addCase(removeFriend.fulfilled, (state, action) => {
        const removedUserId = action.payload;

        state.friends = state.friends.filter((f) => f._id !== removedUserId);

        // Clean up stray requests referencing this user
        state.requests.incoming = state.requests.incoming.filter(
          (r) => r.from._id !== removedUserId && r.to._id !== removedUserId,
        );

        state.requests.outgoing = state.requests.outgoing.filter(
          (r) => r.from._id !== removedUserId && r.to._id !== removedUserId,
        );
      });
  },
});

export const {
  addIncomingRequest,
  addOutgoingRequest,
  removeIncomingRequest,
  removeOutgoingRequest,
  addFriendFromSocket,
  removeFriendFromSocket,
} = friendSlice.actions;

export default friendSlice.reducer;
