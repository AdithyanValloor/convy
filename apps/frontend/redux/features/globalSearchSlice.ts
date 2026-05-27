import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";

interface GlobalSearchState {
  query: string;
  messages: NormalizedSearchMessage[];
  status: "idle" | "loading" | "error";
}

const initialState: GlobalSearchState = {
  query: "",
  messages: [],
  status: "idle",
};

export interface SearchResultMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: { url: string | null};
  };
  chat: {
    _id: string;
    chatName: string;
    isGroup: boolean;
    members: { _id: string; username: string; displayName?: string }[]; // ← add this
  };
}

export interface NormalizedSearchMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: { key: string | null };
  };
  chat: {
    _id: string;
    chatName: string;
    isGroup: boolean;
    members: { _id: string; username: string; displayName?: string }[];
  };
}

const extractKeyFromUrl = (url?: string | null): string | null => {
  if (!url) return null;

  try {
    const decoded = decodeURIComponent(url);
    const match = decoded.match(/\.amazonaws\.com\/(.+?)\?/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

const normalizeMessage = (msg: SearchResultMessage): NormalizedSearchMessage => ({
  ...msg,
  sender: {
    ...msg.sender,
    profilePicture: {
      key: extractKeyFromUrl(msg.sender.profilePicture?.url),
    },
  },
});

export const globalSearch = createAsyncThunk(
  "globalSearch/search",
  async (query: string) => {
    const res = await api.get("/message/search/global", {
      params: { query },
    });
    return res.data.messages;
  }
);

const globalSearchSlice = createSlice({
  name: "globalSearch",
  initialState,
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    clearSearch(state) {
      state.query = "";
      state.messages = [];
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(globalSearch.pending, (state) => {
        state.status = "loading";
      })
      .addCase(globalSearch.fulfilled, (state, action) => {
        state.status = "idle";
        state.messages = action.payload.map(normalizeMessage);
      })
      .addCase(globalSearch.rejected, (state) => {
        state.status = "error";
      });
  },
});

export const { setQuery, clearSearch } = globalSearchSlice.actions;
export default globalSearchSlice.reducer;