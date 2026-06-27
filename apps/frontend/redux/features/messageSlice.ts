import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import { resetUnread } from "./unreadSlice";
import { RootState } from "../store";
import { clearChat, deleteChat } from "./chatSlice";
import axios from "axios";

/* -------------------- TYPES -------------------- */

/**
 * Normalized message entity stored in Redux.
 * References related entities (chat, sender, reply) by ID or embedded snapshot.
 */
export interface MessageType {
  _id: string;
  chat: string;
  sender: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: { key: string | null };
  };
  content: string;
  createdAt: string;
  updatedAt?: string;
  edited?: boolean;
  deleted?: boolean;
  deliveredTo?: string[];
  seenBy?: string[];
  mentions?: string[];
  replyTo?: {
    _id: string;
    content: string;
    sender: { _id: string; username: string; displayName?: string };
  } | null;
  forwarded?: boolean;
  forwardedFrom?: {
    _id: string;
    content: string;
    sender: {
      _id: string;
      username: string;
      displayName?: string;
      profilePicture?: { key: string | null };
    };
  } | null;
  reactions?: {
    emoji: string;
    user: { _id: string; username: string };
  }[];
  linkPreview?: {
    url?: string;
    title?: string;
    description?: string;
    image?: string;
    siteName?: string;
    isLargeImage?: boolean;
  };
  file?: {
    key: string;
    mimeType: string;
    size: number;
  };
}

/**
 * Pagination metadata tracked per chat.
 */
export interface ChatMeta {
  page: number;
  totalPages: number;
  hasMore: boolean;
  hasMoreNewer?: boolean;
  newestLoadedAt?: string;
}

/**
 * Messages slice state.
 * Uses normalized storage for efficient updates and lookups.
 */
interface MessagesState {
  byId: Record<string, MessageType>;
  messages: Record<string, string[]>;
  meta: Record<string, ChatMeta | undefined>;
  jumpTo: { chatId: string; messageId: string } | null;
  search: {
    results: string[];
    loading: boolean;
    hasMore: boolean;
    page: number;
  };
  mentionedChats: string[];

  listLoading: boolean;
  sendLoading: boolean;
  error: string | null;
  downloadUrls: Record<string, string>;
}

const initialState: MessagesState = {
  byId: {},
  messages: {},
  meta: {},
  jumpTo: null,
  search: {
    results: [],
    loading: false,
    hasMore: false,
    page: 1,
  },
  mentionedChats: [],
  listLoading: false,
  sendLoading: false,
  error: null,
  downloadUrls: {},
};

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
 * Fetch paginated messages for a chat.
 * Accepts either a chatId string or an options object.
 */
type FetchArg = string | { chatId: string; page?: number; limit?: number };

export const fetchMessages = createAsyncThunk<
  {
    chatId: string;
    messages: MessageType[];
    page: number;
    totalPages?: number;
  },
  FetchArg,
  { rejectValue: string }
>("messages/fetchMessages", async (arg, { rejectWithValue }) => {
  try {
    const { chatId, page, limit } =
      typeof arg === "string"
        ? { chatId: arg, page: 1, limit: 20 }
        : { chatId: arg.chatId, page: arg.page ?? 1, limit: arg.limit ?? 20 };

    const res = await api.get(`/message/${chatId}?page=${page}&limit=${limit}`);

    const payload = res.data;

    return {
      chatId,
      messages: payload.messages ?? payload,
      page: payload.currentPage ?? page,
      totalPages: payload.totalPages,
    };
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Send a new message.
 */
export const sendMessage = createAsyncThunk<
  MessageType,
  {
    chatId: string;
    content: string;
    replyTo?: string | null;
    mentionIds?: string[];
    file?: {
      key: string;
      mimeType: string;
      size: number;
    };
  },
  { rejectValue: string }
>("messages/send", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/message", data, {
      withCredentials: true,
    });
    return res.data;
  } catch (error){
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Forward a message.
 */
export const forwardMessageApi = createAsyncThunk<
  MessageType[],
  { messageId: string; targetChatIds: string[] },
  { rejectValue: string }
>(
  "messages/forward",
  async ({ messageId, targetChatIds }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        "/message/forward",
        { messageId, targetChatIds },
        { withCredentials: true },
      );

      return res.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Toggle a reaction on a message.
 */
export const toggleReaction = createAsyncThunk<
  MessageType,
  { messageId: string; emoji: string },
  { rejectValue: string }
>(
  "messages/toggleReaction",
  async ({ messageId, emoji }, { rejectWithValue }) => {
    try {
      const res = await api.post(
        `/message/react/${messageId}`,
        { emoji },
        { withCredentials: true },
      );
      return res.data;
    } catch (error){
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Mark messages as seen by the current user.
 */
export const markMessagesAsSeen = createAsyncThunk<
  { chatId: string; userId: string },
  string,
  { state: RootState; rejectValue: string }
>(
  "messages/markMessagesAsSeen",
  async (chatId, { dispatch, getState, rejectWithValue }) => {
    try {
      await api.post(
        `/message/mark-seen/${chatId}`,
        {},
        { withCredentials: true },
      );

      const state = getState();
      const user = state.auth.user;

      if (!user) {
        return rejectWithValue("User not authenticated");
      }

      const userId = user._id;

      dispatch(resetUnread(chatId));

      dispatch(markAllMessagesSeen({ chatId, userId }));

      return { chatId, userId };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Edit an existing message.
 */
export const editMessageApi = createAsyncThunk<
  MessageType,
  { chatId: string; messageId: string; content: string },
  { rejectValue: string }
>(
  "messages/editMessage",
  async ({ messageId, content }, { rejectWithValue }) => {
    try {
      const res = await api.put(
        `/message/${messageId}`,
        { content },
        { withCredentials: true },
      );
      return res.data;
    } catch (error){
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Soft-delete a message.
 */
export const deleteMessageApi = createAsyncThunk<
  MessageType,
  { chatId: string; messageId: string },
  { rejectValue: string }
>("messages/deleteMessage", async ({ messageId }, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/message/${messageId}`, {
      withCredentials: true,
    });
    return res.data;
  } catch (error){
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Message Search query in a chat.
 */

export const searchMessagesApi = createAsyncThunk<
  {
    messages: MessageType[];
    page: number;
    hasMore: boolean;
  },
  {
    chatId: string;
    query?: string;
    date?: string;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>("messages/search", async (params, { rejectWithValue }) => {
  try {
    const { chatId, query, date, page = 1, limit = 20 } = params;

    const res = await api.get("/message/search", {
      params: {
        chatId,
        query,
        date,
        page,
        limit,
      },
    });

    return {
      messages: res.data.messages,
      page: res.data.currentPage,
      hasMore: res.data.hasMore,
    };
  } catch (error){
    return rejectWithValue(getErrorMessage(error));
  }
});

/**
 * Fetch Message contex
 */

export const fetchMessageContext = createAsyncThunk<
  {
    chatId: string;
    target: MessageType;
    before: MessageType[];
    after: MessageType[];
  },
  { messageId: string; chatId: string },
  { rejectValue: string }
>(
  "messages/fetchContext",
  async ({ messageId, chatId }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/message/context/${messageId}`);
      return {
        chatId,
        target: res.data.target,
        before: res.data.before,
        after: res.data.after,
      };
    } catch (error){
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Fetch newer messages for a chat (used for jump-to-bottom when new messages arrive).
 */
export const fetchNewerMessages = createAsyncThunk<
  { chatId: string; messages: MessageType[]; hasMore: boolean },
  { chatId: string; after: string; limit?: number },
  { rejectValue: string }
>(
  "messages/fetchNewer",
  async ({ chatId, after, limit = 20 }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/message/${chatId}/newer?after=${encodeURIComponent(after)}&limit=${limit}`,
      );
      return {
        chatId,
        messages: res.data.messages ?? res.data,
        hasMore: res.data.hasMore ?? false,
      };
    } catch (error){
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Get a pre-signed S3 download URL for an attachment key.
 */
export const getDownloadUrl = createAsyncThunk<
  { key: string; url: string },
  string,
  { rejectValue: string }
>("messages/getDownloadUrl", async (key, { rejectWithValue }) => {
  try {
    const res = await api.get("/file/chat/download", {
      params: { key },
      withCredentials: true,
    });

    return { key, url: res.data.url };
  } catch (error){
    return rejectWithValue(getErrorMessage(error));
  }
});

/* -------------------- HELPERS -------------------- */

export function insertMessageSorted(
  state: MessagesState,
  chatId: string,
  message: MessageType,
) {
  state.byId[message._id] = message;

  const prevIds = state.messages[chatId] ?? [];

  if (prevIds.includes(message._id)) return;

  const index = prevIds.findIndex(
    (id) =>
      new Date(state.byId[id].createdAt).getTime() >
      new Date(message.createdAt).getTime(),
  );

  let nextIds: string[];

  if (index === -1) {
    nextIds = [...prevIds, message._id];
  } else {
    nextIds = [
      ...prevIds.slice(0, index),
      message._id,
      ...prevIds.slice(index),
    ];
  }

  state.messages[chatId] = nextIds;
}

/* -------------------- SLICE -------------------- */

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    /**
     * Insert a message locally (used by socket events).
     */
    insertMessage: (
      state,
      action: PayloadAction<{ chatId: string; message: MessageType }>,
    ) => {
      insertMessageSorted(state, action.payload.chatId, action.payload.message);
    },

    /**
     * Update message content/state from socket edits.
     */
    editMessage: (state, action: PayloadAction<{ message: MessageType }>) => {
      const incoming = action.payload.message;
      const existing = state.byId[incoming._id];

      if (!existing) {
        state.byId[incoming._id] = incoming;
        return;
      }

      state.byId[incoming._id] = {
        ...existing,
        ...incoming,
      };
    },

    /**
     * Apply soft-delete updates from socket events.
     */
    deleteMessage: (state, action: PayloadAction<{ message: MessageType }>) => {
      state.byId[action.payload.message._id] = action.payload.message;
    },

    /**
     * Track delivery status per user.
     */
    updateMessageDelivery: (
      state,
      action: PayloadAction<{
        chatId: string;
        messageId: string;
        userId: string;
      }>,
    ) => {
      const msg = state.byId[action.payload.messageId];
      if (!msg) return;

      msg.deliveredTo ??= [];
      if (!msg.deliveredTo.includes(action.payload.userId)) {
        msg.deliveredTo.push(action.payload.userId);
      }
    },

    /**
     * Track seen status and remove from delivery list.
     */
    updateMessageSeen: (
      state,
      action: PayloadAction<{ messageId: string; userId: string }>,
    ) => {
      const msg = state.byId[action.payload.messageId];
      if (!msg) return;

      msg.seenBy ??= [];
      if (!msg.seenBy.includes(action.payload.userId)) {
        msg.seenBy.push(action.payload.userId);
      }

      msg.deliveredTo = msg.deliveredTo?.filter(
        (id) => id !== action.payload.userId,
      );
    },

    /**
     * Mark all messages in a chat as seen by a user.
     */
    markAllMessagesSeen: (
      state,
      action: PayloadAction<{ chatId: string; userId: string }>,
    ) => {
      const { chatId, userId } = action.payload;
      const messageIds = state.messages[chatId] || [];

      messageIds.forEach((msgId) => {
        const msg = state.byId[msgId];
        if (!msg) return;

        if (msg.sender._id === userId) return;

        msg.seenBy ??= [];
        if (!msg.seenBy.includes(userId)) {
          msg.seenBy.push(userId);
        }

        msg.deliveredTo = msg.deliveredTo?.filter((id) => id !== userId);
      });
    },
    /**
     * Jumps to Message
     */
    clearJumpTo: (state) => {
      state.jumpTo = null;
    },
    /**
     * Jump to Message State
     */
    setJumpTo: (
      state,
      action: PayloadAction<{ chatId: string; messageId: string }>,
    ) => {
      state.jumpTo = {
        chatId: action.payload.chatId,
        messageId: action.payload.messageId,
      };
    },
    clearChatMessages: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      delete state.messages[chatId];
      delete state.meta[chatId];
    },
    addMentionedChat: (state, action: PayloadAction<string>) => {
      if (!state.mentionedChats.includes(action.payload)) {
        state.mentionedChats.push(action.payload);
      }
    },
    clearMentionedChat: (state, action: PayloadAction<string>) => {
      state.mentionedChats = state.mentionedChats.filter(
        (id) => id !== action.payload,
      );
    },
  },

  extraReducers: (builder) => {
    builder
      /* -------- FETCH MESSAGES -------- */
      .addCase(fetchMessages.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.listLoading = false;

        const { chatId, messages, page, totalPages } = action.payload;
        state.messages[chatId] ??= [];

        messages.forEach((msg) => {
          insertMessageSorted(state, chatId, msg);
        });

        state.meta[chatId] = {
          page,
          totalPages: totalPages ?? page,
          hasMore: totalPages ? page < totalPages : false,
        };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload ?? "Failed to fetch messages";
      })

      /* -------- SEND MESSAGE -------- */
      .addCase(sendMessage.pending, (state) => {
        state.sendLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendLoading = false;

        const msg = action.payload;
        insertMessageSorted(state, msg.chat, msg);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendLoading = false;
        state.error = action.payload ?? "Failed to send message";
      })

      /* -------- FORWARD MESSAGE -------- */
      .addCase(forwardMessageApi.fulfilled, (state, action) => {
        const forwardedMessages = action.payload;

        forwardedMessages.forEach((msg) => {
          insertMessageSorted(state, msg.chat, msg);
        });
      })

      /* -------- EDIT / DELETE / REACT -------- */
      .addCase(editMessageApi.fulfilled, (state, action) => {
        state.byId[action.payload._id] = action.payload;
      })
      .addCase(deleteMessageApi.fulfilled, (state, action) => {
        state.byId[action.payload._id] = action.payload;
      })
      .addCase(toggleReaction.fulfilled, (state, action) => {
        state.byId[action.payload._id] = action.payload;
      })

      /* -------- SEARCH -------- */
      .addCase(searchMessagesApi.pending, (state) => {
        state.search.loading = true;
      })
      .addCase(searchMessagesApi.fulfilled, (state, action) => {
        state.search.loading = false;

        const { messages, page, hasMore } = action.payload;

        // Insert messages into byId store
        messages.forEach((msg) => {
          state.byId[msg._id] = msg;
        });

        state.search.results =
          page === 1
            ? messages.map((m) => m._id)
            : [...state.search.results, ...messages.map((m) => m._id)];

        state.search.page = page;
        state.search.hasMore = hasMore;
      })
      .addCase(searchMessagesApi.rejected, (state) => {
        state.search.loading = false;
      })

      .addCase(fetchMessageContext.fulfilled, (state, action) => {
        const { chatId, before, target, after } = action.payload;

        const allMessages = [...before, target, ...after];
        allMessages.forEach((msg) => {
          insertMessageSorted(state, chatId, msg);
        });

        state.jumpTo = { chatId, messageId: target._id };

        if (!state.meta[chatId]) {
          state.meta[chatId] = {
            page: 1,
            totalPages: 1,
            hasMore: true,
            hasMoreNewer: after.length >= 20,
          };
        } else {
          state.meta[chatId].hasMoreNewer = after.length >= 20;
          state.meta[chatId].hasMore = true;
        }
      })

      .addCase(fetchNewerMessages.fulfilled, (state, action) => {
        const { chatId, messages, hasMore } = action.payload;
        messages.forEach((msg) => insertMessageSorted(state, chatId, msg));
        if (state.meta[chatId]) {
          state.meta[chatId]!.hasMoreNewer = hasMore;
        }
      })
      .addCase(clearChat.pending, (state, action) => {
        const chatId = action.meta.arg;

        const messageIds = state.messages[chatId] ?? [];
        messageIds.forEach((id) => {
          delete state.byId[id];
        });

        delete state.messages[chatId];
        delete state.meta[chatId];

        if (state.jumpTo?.chatId === chatId) {
          state.jumpTo = null;
        }
      })
      .addCase(deleteChat.pending, (state, action) => {
        const chatId = action.meta.arg;

        const messageIds = state.messages[chatId] ?? [];
        messageIds.forEach((id) => {
          delete state.byId[id];
        });

        delete state.messages[chatId];
        delete state.meta[chatId];

        if (state.jumpTo?.chatId === chatId) {
          state.jumpTo = null;
        }
      })

      // Cache download URLs for attachments
      .addCase(getDownloadUrl.fulfilled, (state, action) => {
        state.downloadUrls[action.payload.key] = action.payload.url;
      });
  },
});

export const {
  editMessage,
  deleteMessage,
  updateMessageDelivery,
  updateMessageSeen,
  markAllMessagesSeen,
  insertMessage,
  clearJumpTo,
  setJumpTo,
  clearChatMessages,
  addMentionedChat,
  clearMentionedChat,
} = messagesSlice.actions;

export default messagesSlice.reducer;
