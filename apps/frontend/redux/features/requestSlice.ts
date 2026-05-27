import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import { Chat, ChatUser } from "@/types/chat.types";

export interface MessageRequest {
  _id: string;
  from: ChatUser;
  to: ChatUser;
  firstMessage: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface RequestState {
  incoming: MessageRequest[];
  requestCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: RequestState = {
  incoming: [],
  requestCount: 0,
  loading: false,
  error: null,
};

export const fetchMessageRequests = createAsyncThunk<
  { incoming: MessageRequest[] },
  void,
  { rejectValue: string }
>("requests/fetch", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/message-request");
    return {
      incoming: res.data.incoming,
    };
  } catch {
    return rejectWithValue("Failed to fetch message requests");
  }
});

export const acceptMessageRequestThunk = createAsyncThunk<
  { requestId: string; chat: Chat },
  string,
  { rejectValue: string }
>("requests/accept", async (requestId, { rejectWithValue }) => {
  try {
    const res = await api.post(`/message-request/${requestId}/accept`);
    return { requestId, chat: res.data.chat };
  } catch {
    return rejectWithValue("Failed to accept request");
  }
});

export const rejectMessageRequestThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("requests/reject", async (requestId, { rejectWithValue }) => {
  try {
    await api.post(`/message-request/${requestId}/reject`);
    return requestId;
  } catch {
    return rejectWithValue("Failed to reject request");
  }
});

const requestSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    // addIncomingMessageRequest
    addIncomingMessageRequest: (state, action) => {
      state.incoming.unshift(action.payload);
      state.requestCount = state.incoming.length;
    },

    // removeMessageRequest
    removeIncomingMessageRequest: (state, action) => {
      state.incoming = state.incoming.filter((r) => r._id !== action.payload);
      state.requestCount = state.incoming.length;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch message requests
      .addCase(fetchMessageRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessageRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.incoming = action.payload.incoming;
        state.requestCount = action.payload.incoming.length;
      })
      .addCase(fetchMessageRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed";
      })
      // acceptMessageRequestThunk.fulfilled
      .addCase(acceptMessageRequestThunk.fulfilled, (state, action) => {
        state.incoming = state.incoming.filter(
          (r) => r._id !== action.payload.requestId,
        );
        state.requestCount = state.incoming.length;
      })

      // rejectMessageRequestThunk.fulfilled
      .addCase(rejectMessageRequestThunk.fulfilled, (state, action) => {
        state.incoming = state.incoming.filter((r) => r._id !== action.payload);
        state.requestCount = state.incoming.length;
      });
  },
});

export const { addIncomingMessageRequest, removeIncomingMessageRequest } =
  requestSlice.actions;

export default requestSlice.reducer;
