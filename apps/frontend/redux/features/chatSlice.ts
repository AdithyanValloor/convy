import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/utils/axiosInstance";
import { sendMessage } from "./messageSlice";
import { acceptMessageRequestThunk } from "./requestSlice";
import { Chat, ChatMessage } from "@/types/chat.types";
import axios from "axios";

/* -------------------- TYPES -------------------- */

interface ChatState {
  chats: Chat[];
  listLoading: boolean;
  accessLoading: boolean;
  error: string | null;
}

interface CreateGroupResponse {
  message: string;
  groupChat: Chat;
}

interface ChatResponse {
  message: string;
  chat: Chat;
}

type AccessChatResponse =
  | { type: "chat"; data: Chat }
  | { type: "pending_chat"; data: Chat };

/* -------------------- CHAT THUNKS -------------------- */

export const fetchChats = createAsyncThunk<
  Chat[],
  void,
  { rejectValue: string }
>("chat/fetchChats", async (_, { rejectWithValue }) => {
  try {
    const res = await api.get("/chat");
    return res.data;
  } catch (err) {
    console.log("FETCH CHATS ERROR:", err);
    return rejectWithValue("Failed to fetch chats");
  }
});

export const accessChat = createAsyncThunk<
  AccessChatResponse,
  { userId: string; message?: string },
  { rejectValue: string }
>("chat/accessChat", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post("/chat/access", data);
    return res.data;
  } catch {
    return rejectWithValue("Failed to access chat");
  }
});

export const togglePin = createAsyncThunk<
  { chatId: string; isPinned: boolean },
  string
>("chat/togglePin", async (chatId) => {
  const res = await api.patch(`/chat/pin/${chatId}`);
  return { chatId, isPinned: res.data.isPinned };
});

export const toggleArchive = createAsyncThunk<
  { chatId: string; isArchived: boolean },
  string
>("chat/toggleArchive", async (chatId) => {
  const res = await api.patch(`/chat/archive/${chatId}`);
  return { chatId, isArchived: res.data.isArchived };
});

export const markAsUnread = createAsyncThunk<
  { chatId: string; count: number },
  string
>("chat/markUnread", async (chatId) => {
  const res = await api.patch(`/chat/unread/${chatId}`);
  return res.data;
});

export const muteChat = createAsyncThunk<
  { chatId: string; mutedUntil: string },
  { chatId: string; duration: "1h" | "8h" | "24h" | "1w" | "forever" }
>("chat/muteChat", async ({ chatId, duration }) => {
  const res = await api.post(`/chat/${chatId}/mute`, { duration });
  return { chatId, mutedUntil: res.data.mutedUntil };
});

export const unmuteChat = createAsyncThunk<{ chatId: string }, string>(
  "chat/unmuteChat",
  async (chatId) => {
    await api.post(`/chat/${chatId}/unmute`);
    return { chatId };
  },
);

export const markAsRead = createAsyncThunk<{ chatId: string }, string>(
  "chat/markRead",
  async (chatId) => {
    const res = await api.patch(`/chat/read/${chatId}`);
    return res.data;
  },
);

export const clearChat = createAsyncThunk<{ chatId: string }, string>(
  "chat/clearChat",
  async (chatId) => {
    await api.delete(`/chat/${chatId}/clear`);
    return { chatId };
  },
);

export const deleteChat = createAsyncThunk<{ chatId: string }, string>(
  "chat/deleteChat",
  async (chatId) => {
    await api.delete(`/chat/${chatId}`);
    return { chatId };
  },
);

/* -------------------- GROUP THUNKS -------------------- */

export const createGroupChat = createAsyncThunk<
  Chat,
  { name: string; userIds: string[]; avatar: string | null },
  { rejectValue: string }
>("group/createGroupChat", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post<CreateGroupResponse>("/group", data);
    return res.data.groupChat;
  } catch {
    return rejectWithValue("Failed to create group");
  }
});

export const addMembers = createAsyncThunk<
  Chat,
  { chatId: string; members: string[] },
  { rejectValue: string }
>("group/addMembers", async (data, { rejectWithValue }) => {
  try {
    const res = await api.post<ChatResponse>("/group/members", data);
    return res.data.chat;
  } catch {
    return rejectWithValue("Failed to add members");
  }
});

export const removeMembers = createAsyncThunk<
  Chat,
  { chatId: string; member: string },
  { rejectValue: string }
>("group/removeMembers", async (data, { rejectWithValue }) => {
  try {
    const res = await api.delete<ChatResponse>("/group/members", { data });
    return res.data.chat;
  } catch {
    return rejectWithValue("Failed to remove member");
  }
});

export const toggleAdmin = createAsyncThunk<
  Chat,
  { chatId: string; member: string; makeAdmin: boolean },
  { rejectValue: string }
>("group/toggleAdmin", async (data, { rejectWithValue }) => {
  try {
    const res = await api.patch<ChatResponse>("/group/admin", data);
    return res.data.chat;
  } catch {
    return rejectWithValue("Failed to toggle admin");
  }
});

export const leaveGroup = createAsyncThunk<
  string,
  { chatId: string },
  { rejectValue: string }
>("group/leaveGroup", async (data, { rejectWithValue }) => {
  try {
    await api.post("/group/leave", data);
    return data.chatId;
  } catch {
    return rejectWithValue("Failed to leave group");
  }
});

export const deleteGroup = createAsyncThunk<
  string,
  { chatId: string },
  { rejectValue: string }
>("group/deleteGroup", async (data, { rejectWithValue }) => {
  try {
    await api.delete("/group/delete", { data });
    return data.chatId;
  } catch {
    return rejectWithValue("Failed to delete group");
  }
});

export const transferOwnership = createAsyncThunk<
  Chat,
  { chatId: string; newOwnerId: string },
  { rejectValue: string }
>("group/transferOwnership", async (data, { rejectWithValue }) => {
  try {
    const res = await api.patch("/group/transfer-ownership", data);
    return res.data.chat;
  } catch {
    return rejectWithValue("Failed to transfer ownership");
  }
});

export const editGroupName = createAsyncThunk<
  Chat,
  { chatId: string; newName: string },
  { rejectValue: string }
>("group/editGroupName", async (data, { rejectWithValue }) => {
  try {
    const res = await api.patch<ChatResponse>("/group/edit-name", data);
    return res.data.chat;
  } catch {
    return rejectWithValue("Failed to update group name");
  }
});

export const updateAvatar = createAsyncThunk<
  { key: string | null },
  { chatId: string; key: string },
  { rejectValue: string }
>("profile/updateAvatar", async ({ chatId, key }, { rejectWithValue }) => {
  try {
    const res = await api.put(
      "/file/avatar",
      { chatId, key },
      { withCredentials: true },
    );

    return res.data.profilePicture;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      return rejectWithValue(
        err.response?.data?.message ?? "Failed to update avatar",
      );
    }
    return rejectWithValue("Failed to update avatar");
  }
});

export const getGroupAvatarDownloadUrl = createAsyncThunk<
  { key: string; url: string },
  { chatId: string; key: string }
>("profile/getGroupAvatarDownloadUrl", async ({ chatId, key }) => {
  const res = await api.get(`/file/avatar/${chatId}`);

  return { key, url: res.data.url };
});

/* -------------------- CHAT SORT HELPER -------------------- */

const sortChats = (chats: Chat[]) => {
  if (!Array.isArray(chats)) return [];
  return [...chats].sort((a, b) => {
    if ((a.isPinned ?? false) !== (b.isPinned ?? false)) {
      return a.isPinned ? -1 : 1;
    }
    return (
      new Date(b.lastMessage?.createdAt ?? 0).getTime() -
      new Date(a.lastMessage?.createdAt ?? 0).getTime()
    );
  });
};
/* -------------------- SLICE -------------------- */

const initialState: ChatState = {
  chats: [],
  listLoading: false,
  accessLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /**
     * Update the latest message for a chat and re-order chats by recent activity.
     */
    updateChatLatestMessage: (
      state,
      action: PayloadAction<{ chatId: string; message: ChatMessage }>,
    ) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return;

      chat.lastMessage = message;

      state.chats = sortChats(state.chats);
    },

    /**
     * Add a chat/group to the top of the list.
     * Used by: group_created, added_to_group
     */
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.unshift(action.payload);
    },

    /**
     * Insert or replace a chat in the list by ID.
     * Used by: group_updated, members_added
     */
    upsertChat: (state, action: PayloadAction<Chat>) => {
      const idx = state.chats.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) {
        state.chats[idx] = action.payload;
      } else {
        state.chats.unshift(action.payload);
      }
    },

    /**
     * Remove a chat from the list by ID.
     * Used by: removed_from_group, left_group, group_deleted
     */
    removeChat: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter((c) => c._id !== action.payload);
    },

    /**
     * Remove a single member from a group's members and admin arrays.
     * Used by: member_left
     */
    removeChatMember: (
      state,
      action: PayloadAction<{ chatId: string; userId: string }>,
    ) => {
      const { chatId, userId } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return;
      chat.members = chat.members.filter((m) => m._id !== userId);
      chat.admin = chat.admin.filter((a) => a._id !== userId);
    },

    /**
     * Promote or demote a member's admin status.
     * Used by: admin_toggled
     */
    updateChatAdmin: (
      state,
      action: PayloadAction<{
        chatId: string;
        memberId: string;
        isAdmin: boolean;
      }>,
    ) => {
      const { chatId, memberId, isAdmin } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return;

      if (isAdmin) {
        const member = chat.members.find((m) => m._id === memberId);
        if (member && !chat.admin.some((a) => a._id === memberId)) {
          chat.admin.push(member);
        }
      } else {
        chat.admin = chat.admin.filter((a) => a._id !== memberId);
      }
    },

    /**
     * Update createdBy when ownership is transferred.
     * Also ensures the new owner is in the admin list.
     * Used by: ownership_transferred
     */
    updateChatOwner: (
      state,
      action: PayloadAction<{ chatId: string; newOwnerId: string }>,
    ) => {
      const { chatId, newOwnerId } = action.payload;
      const chat = state.chats.find((c) => c._id === chatId);
      if (!chat) return;

      const newOwner = chat.members.find((m) => m._id === newOwnerId);
      if (newOwner) {
        chat.createdBy = newOwner;
        if (!chat.admin.some((a) => a._id === newOwnerId)) {
          chat.admin.push(newOwner);
        }
      }
    },

    togglePinLocal: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c._id === action.payload);
      if (!chat) return;

      chat.isPinned = !chat.isPinned;
      state.chats = sortChats(state.chats);
    },

    toggleArchiveLocal: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c._id === action.payload);
      if (!chat) return;

      chat.isArchived = !chat.isArchived;
    },

    muteChatLocal: (
      state,
      action: PayloadAction<{ chatId: string; mutedUntil: string | null }>,
    ) => {
      const chat = state.chats.find((c) => c._id === action.payload.chatId);
      if (!chat) return;
      chat.mutedUntil = action.payload.mutedUntil;
    },

    markUnreadLocal: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c._id === action.payload);
      if (!chat) return;

      chat.lastReadAt = null;
    },
    clearChatLocal: (state, action: PayloadAction<string>) => {
      const chat = state.chats.find((c) => c._id === action.payload);
      if (!chat) return;

      chat.lastMessage = undefined;
      chat.lastReadAt = new Date().toISOString();
    },
    deleteChatLocal: (state, action: PayloadAction<string>) => {
      state.chats = state.chats.filter((c) => c._id !== action.payload);
    },
    updateGroupAvatarLocal: (
      state,
      action: PayloadAction<{ chatId: string; key: string }>,
    ) => {
      const chat = state.chats.find((c) => c._id === action.payload.chatId);
      if (!chat) return;

      chat.avatar = { key: action.payload.key };
    },
  },

  extraReducers: (builder) => {
    builder
      /* -------- FETCH CHATS -------- */
      .addCase(fetchChats.pending, (state) => {
        state.listLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.listLoading = false;
        state.chats = sortChats(action.payload);
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.listLoading = false;
        state.error = action.payload ?? "Failed to fetch chats";
      })

      /* -------- ACCESS CHAT -------- */
      .addCase(accessChat.pending, (state) => {
        state.accessLoading = true;
        state.error = null;
      })
      .addCase(accessChat.fulfilled, (state, action) => {
        state.accessLoading = false;
        const payload = action.payload;

        if (!state.chats.some((c) => c._id === payload.data._id)) {
          state.chats.unshift(payload.data);
        }
      })
      .addCase(accessChat.rejected, (state, action) => {
        state.accessLoading = false;
        state.error = action.payload ?? "Failed to access chat";
      })

      /* -------- PIN -------- */
      .addCase(togglePin.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c._id === action.payload.chatId);
        if (!chat) return;

        chat.isPinned = action.payload.isPinned;
      })

      /* -------- ARCHIVE -------- */
      .addCase(toggleArchive.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c._id === action.payload.chatId);
        if (!chat) return;

        chat.isArchived = action.payload.isArchived;
      })

      /* -------- MARK UNREAD -------- */
      .addCase(markAsUnread.fulfilled, (state, action) => {
        const { chatId } = action.payload;

        const chat = state.chats.find((c) => c._id === chatId);
        if (chat) {
          chat.lastReadAt = null;
        }
      })

      /* -------- MUTE/UNMUTE -------- */
      .addCase(muteChat.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c._id === action.payload.chatId);
        if (!chat) return;
        chat.mutedUntil = action.payload.mutedUntil;
      })
      .addCase(unmuteChat.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c._id === action.payload.chatId);
        if (!chat) return;
        chat.mutedUntil = null;
      })

      /* -------- MARK READ -------- */
      .addCase(markAsRead.fulfilled, (state, action) => {
        const { chatId } = action.payload;
        const chat = state.chats.find((c) => c._id === chatId);
        if (!chat) return;

        chat.lastReadAt = new Date().toISOString();
      })

      /* -------- CLEAR CHAT -------- */
      .addCase(clearChat.pending, (state, action) => {
        const chat = state.chats.find((c) => c._id === action.meta.arg);
        if (!chat) return;

        chat.lastMessage = undefined;
        chat.lastReadAt = new Date().toISOString();
      })
      .addCase(clearChat.rejected, (state) => {
        state.error = "Failed to clear chat";
      })
      .addCase(clearChat.fulfilled, (state, action) => {
        const chat = state.chats.find((c) => c._id === action.payload.chatId);
        if (!chat) return;
        chat.clearedAt = new Date().toISOString();
      })

      /* -------- DELETE CHAT -------- */
      .addCase(deleteChat.pending, (state, action) => {
        state.chats = state.chats.filter((c) => c._id !== action.meta.arg);
      })
      .addCase(deleteChat.rejected, (state) => {
        state.error = "Failed to delete chat";
      })
      .addCase(deleteChat.fulfilled, () => {
        // no-op: optimistic removal already done in .pending
      })

      /* -------- CREATE GROUP -------- */
      .addCase(createGroupChat.pending, (state) => {
        state.accessLoading = true;
      })
      .addCase(createGroupChat.fulfilled, (state, action) => {
        state.accessLoading = false;
        // Guard against duplicate insertion (socket may fire group_created first)
        if (!state.chats.some((c) => c._id === action.payload._id)) {
          state.chats.unshift(action.payload);
        }
      })
      .addCase(createGroupChat.rejected, (state, action) => {
        state.accessLoading = false;
        state.error = action.payload ?? "Failed to create group";
      })

      /* -------- GROUP MUTATIONS -------- */
      .addCase(addMembers.pending, (state, action) => {
        const { chatId, members } = action.meta.arg;
        const chat = state.chats.find((c) => c._id === chatId);
        if (!chat) return;
        members.forEach((id) => {
          if (!chat.members.some((m) => m._id === id)) {
            chat.members.push({
              _id: id,
              username: "Loading...",
              displayName: "Loading...",
              profilePicture: { key: null },
            });
          }
        });
      })
      .addCase(addMembers.fulfilled, (state, action) => {
        const idx = state.chats.findIndex((g) => g._id === action.payload._id);
        if (idx !== -1) state.chats[idx] = action.payload;
      })

      .addCase(removeMembers.pending, (state, action) => {
        const { chatId, member } = action.meta.arg;
        const chat = state.chats.find((c) => c._id === chatId);
        if (!chat) return;
        chat.members = chat.members.filter((m) => m._id !== member);
        chat.admin = chat.admin.filter((a) => a._id !== member);
      })
      .addCase(removeMembers.fulfilled, (state, action) => {
        const idx = state.chats.findIndex((g) => g._id === action.payload._id);
        if (idx !== -1) state.chats[idx] = action.payload;
      })

      .addCase(toggleAdmin.pending, (state, action) => {
        const { chatId, member, makeAdmin } = action.meta.arg;
        const chat = state.chats.find((c) => c._id === chatId);
        if (!chat) return;
        if (makeAdmin) {
          const memberObj = chat.members.find((m) => m._id === member);
          if (memberObj && !chat.admin.some((a) => a._id === member)) {
            chat.admin.push(memberObj);
          }
        } else {
          chat.admin = chat.admin.filter((a) => a._id !== member);
        }
      })
      .addCase(toggleAdmin.fulfilled, (state, action) => {
        const idx = state.chats.findIndex((g) => g._id === action.payload._id);
        if (idx !== -1) state.chats[idx] = action.payload;
      })

      /* -------- LEAVE GROUP -------- */
      .addCase(leaveGroup.fulfilled, (state, action) => {
        state.chats = state.chats.filter((g) => g._id !== action.payload);
      })

      /* -------- DELETE GROUP -------- */
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.chats = state.chats.filter((g) => g._id !== action.payload);
      })

      /* -------- TRANSFER OWNERSHIP -------- */
      .addCase(transferOwnership.fulfilled, (state, action) => {
        const idx = state.chats.findIndex((g) => g._id === action.payload._id);
        if (idx !== -1) state.chats[idx] = action.payload;
      })

      .addCase(acceptMessageRequestThunk.fulfilled, (state, action) => {
        const { chat } = action.payload;
        if (!state.chats.some((c) => c._id === chat._id)) {
          state.chats.unshift(chat);
        }
      })

      /* -------- EDIT GROUP NAME -------- */
      .addCase(editGroupName.pending, (state, action) => {
        const { chatId, newName } = action.meta.arg;
        const chat = state.chats.find((c) => c._id === chatId);
        if (!chat) return;

        chat.chatName = newName;
      })
      .addCase(editGroupName.fulfilled, (state, action) => {
        const idx = state.chats.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) {
          state.chats[idx] = action.payload;
        }
      })

      /* -------- SEND MESSAGE (update last message preview) -------- */
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        const chat = state.chats.find((c) => c._id === msg.chat);
        if (!chat) return;

        chat.lastMessage = {
          _id: msg._id,
          chat: msg.chat,
          sender: msg.sender._id,
          content: msg.content,
          edited: msg.edited ?? false,
          deleted: msg.deleted ?? false,
          deliveredTo: msg.deliveredTo ?? [],
          seenBy: msg.seenBy ?? [],
          replyTo: msg.replyTo?._id ?? null,
          reactions: [],
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt ?? msg.createdAt,
        };

        state.chats = sortChats(state.chats);
      });
  },
});

export const {
  updateChatLatestMessage,
  addChat,
  upsertChat,
  removeChat,
  removeChatMember,
  updateChatAdmin,
  updateChatOwner,
  togglePinLocal,
  toggleArchiveLocal,
  markUnreadLocal,
  muteChatLocal,
  clearChatLocal,
  deleteChatLocal,
  updateGroupAvatarLocal,
} = chatSlice.actions;

export default chatSlice.reducer;
