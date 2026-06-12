import { io, Socket } from "socket.io-client";
import { store } from "@/redux/store";

import {
  editMessage,
  deleteMessage,
  updateMessageDelivery,
  markAllMessagesSeen,
  insertMessage,
  addMentionedChat,
} from "@/redux/features/messageSlice";

import {
  updateChatLatestMessage,
  addChat,
  upsertChat,
  removeChat,
  removeChatMember,
  updateChatAdmin,
  updateChatOwner,
  accessChat,
} from "@/redux/features/chatSlice";

import { setUnreadCount } from "@/redux/features/unreadSlice";
import { updatePresence } from "@/redux/features/presenceSlice";

import type {
  NewMessagePayload,
  UnreadUpdatePayload,
  PresenceUpdatePayload,
} from "@/types/socket.types";

import { normalizeSocketMessage, toChatLastMessage } from "./normalizeMessage";
import { typingStarted, typingStopped } from "@/redux/features/typingSlice";
import {
  addFriendFromSocket,
  addIncomingRequest,
  addOutgoingRequest,
  removeFriendFromSocket,
  removeIncomingRequest,
  removeOutgoingRequest,
} from "@/redux/features/friendsSlice";
import { emitToast } from "@/utils/toastEmitter";
import { getActiveChatId } from "./activeChat";
import { addBlockedBy, removeBlockedBy } from "@/redux/features/blockSlice";
import { isChatSilenced } from "./isChatMuted";
import {
  addNotificationFromSocket,
  removeNotificationByFriendRequest,
  setUnreadNotificationCount,
} from "@/redux/features/notificationSlice";
import {
  addIncomingMessageRequest,
  removeIncomingMessageRequest,
} from "@/redux/features/requestSlice";
import { Chat } from "@/types/chat.types";

/* -------------------- SINGLETON STATE -------------------- */

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

const socketURL = process.env.NEXT_PUBLIC_SOCKET_URL;

/* -------------------- HELPERS -------------------- */

/**
 * Always reads userId live from the Redux store so it is never stale,
 * regardless of when the socket singleton was first initialised.
 */
const getCurrentUserId = (): string | undefined =>
  store.getState().auth.user?._id;

/**
 * Joins a Socket.IO room for a chat.
 * Reads userId from the store at call-time — never from a stale closure.
 */
export const joinGroupRoom = (chatId: string) => {
  const userId = getCurrentUserId();
  if (!userId || !socket) return;
  socket.emit("joinGroup", { chatId });
};

/**
 * Emits "leaveGroup" to the server so the socket leaves the Socket.IO
 * room immediately, stopping delivery of any further room-scoped events.
 */
const leaveGroupRoom = (chatId: string) => {
  socket?.emit("leaveGroup", chatId);
};

/* -------------------- SOCKET INITIALIZATION -------------------- */

export const getSocket = (userId?: string, allChats: string[] = []): Socket => {
  if (socket && socket.connected) return socket;

  if (!socket) {
    socket = io(socketURL , {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    /* -------------------- CONNECT -------------------- */

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);

      if (userId) {
        store.dispatch(updatePresence({ userId, status: "online" }));
      }

      allChats.forEach((chatId) => joinGroupRoom(chatId));

      if (heartbeatInterval) clearInterval(heartbeatInterval);

      heartbeatInterval = setInterval(() => {
        if (socket?.connected && userId) {
          socket.emit("heartbeat");
        }
      }, 10_000);
    });

    /* -------------------- NEW MESSAGE -------------------- */

    socket.on("new_message", (msg: NewMessagePayload) => {
      const state = store.getState();
      const currentUserId = state.auth.user?._id;

      if (msg.sender._id === currentUserId) return;

      const normalized = normalizeSocketMessage(msg);

      store.dispatch(
        insertMessage({ chatId: normalized.chat, message: normalized }),
      );
      store.dispatch(
        updateChatLatestMessage({
          chatId: normalized.chat,
          message: toChatLastMessage(msg),
        }),
      );

      const activeChatId = getActiveChatId();

      if (isChatSilenced(msg.chat)) return;

      if (msg.chat !== activeChatId) {
        const chatMeta = state.chat.chats.find((c) => c._id === msg.chat);
        const senderName = msg.sender.displayName || msg.sender.username;
        const title = chatMeta?.isGroup
          ? `${senderName} • ${chatMeta.chatName}`
          : senderName;

        emitToast({
          type: "message",
          title,
          description: msg.content,
          profilePicture:{ key: msg.sender.profilePicture?.key ?? null},
          chatId: msg.chat,
        });
      }
    });

    /* -------------------- EDIT MESSAGE -------------------- */

    socket.on("edit_message", (msg) => {
      console.log("EDIT SOCKET:", msg);
      store.dispatch(editMessage({ message: normalizeSocketMessage(msg) }));
    });

    /* -------------------- DELETE MESSAGE -------------------- */

    socket.on("delete_message", (msg) => {
      store.dispatch(deleteMessage({ message: normalizeSocketMessage(msg) }));
    });

    /* -------------------- MESSAGE REACTION -------------------- */

    socket.on("message_reaction", (msg) => {
      store.dispatch(editMessage({ message: normalizeSocketMessage(msg) }));
    });

    /* -------------------- MESSAGE DELIVERED -------------------- */

    socket.on("message_delivered", ({ chatId, messageId, userId }) => {
      store.dispatch(updateMessageDelivery({ chatId, messageId, userId }));
    });

    /* -------------------- MESSAGES SEEN -------------------- */

    socket.on("messages_seen", ({ chatId, userId }) => {
      store.dispatch(markAllMessagesSeen({ chatId, userId }));
    });

    /* -------------------- UNREAD COUNTS -------------------- */

    socket.on("unread_update", ({ chatId, count }: UnreadUpdatePayload) => {
      store.dispatch(setUnreadCount({ chatId, count }));
    });

    socket.on("mention_notification", ({ chatId }: { chatId: string }) => {
      const activeChatId = getActiveChatId();
      if (chatId !== activeChatId) {
        store.dispatch(addMentionedChat(chatId));
      }
    });

    /* -------------------- TYPING -------------------- */

    socket.on("typing", ({ userId, roomId, username, displayName }) => {
      store.dispatch(
        typingStarted({
          chatId: roomId,
          userId,
          name: displayName || username,
        }),
      );
    });

    socket.on("stopTyping", ({ userId, roomId }) => {
      store.dispatch(typingStopped({ chatId: roomId, userId }));
    });

    /* -------------------- FRIENDS -------------------- */

    socket.on("friend_request_received", (req) => {
      store.dispatch(addIncomingRequest(req));
    });

    socket.on("friend_request_sent", (req) => {
      store.dispatch(addOutgoingRequest(req));
    });

    socket.on("friend_request_accepted", (req) => {
      const me = store.getState().auth.user?._id;
      if (!me) return;
      const friend = req.from._id === me ? req.to : req.from;
      store.dispatch(addFriendFromSocket({ requestId: req._id, friend }));
      store.dispatch(accessChat({ userId: friend._id }));
    });

    socket.on("friend_request_rejected", (requestId) => {
      store.dispatch(removeOutgoingRequest(requestId));
    });

    socket.on("friend_request_cancelled", (requestId) => {
      store.dispatch(removeIncomingRequest(requestId));
    });

    socket.on("friend_removed", ({ friendId }) => {
      store.dispatch(removeFriendFromSocket(friendId));
    });

    /* -------------------- INBOX NOTIFICATION -------------------- */

    socket.on("message_request_received", (request) => {
      store.dispatch(addIncomingMessageRequest(request));
    });

    socket.on("message_request_sent", () => {
      // no-op: chat added to list via accessChat.fulfilled
    });

    socket.on("message_request_accepted", ({ requestId, chat }) => {
      store.dispatch(removeIncomingMessageRequest(requestId));
      store.dispatch(upsertChat(chat));
    });

    socket.on("message_request_rejected", ({ chatId }) => {
      store.dispatch(removeChat(chatId));
    });

    /* -------------------- INBOX NOTIFICATION -------------------- */

    socket.on("inbox_notification", (payload) => {
      const notification = payload.notification;

      store.dispatch(addNotificationFromSocket(notification));

      const actorName =
        notification.actor?.displayName ||
        notification.actor?.username ||
        "Someone";

      let title = "Notification";
      let description = "";

      switch (notification.type) {
        case "friend_request_received":
          title = "Friend Request";
          description = `${actorName} sent you a friend request`;
          break;

        case "friend_request_accepted":
          title = "Friend Request Accepted";
          description = `${actorName} accepted your friend request`;
          break;

        case "mention":
          title = "Mention";
          description = `${actorName} mentioned you`;
          break;

        case "reply":
          title = "Reply";
          description = `${actorName} replied to your message`;
          break;

        case "group_added":
          title = "Added to Group";
          description = `${actorName} added you to ${notification.chat?.chatName}`;
          break;
      }

      emitToast({
        type:
          notification.type === "friend_request_received"
            ? "friend_request"
            : notification.type === "friend_request_accepted"
              ? "friend_accept"
              : "notification",
        title,
        description,
        profilePicture: notification.actor?.profilePicture,
      });
    });

    socket.on("notification_removed", ({ friendRequestId }) => {
      store.dispatch(removeNotificationByFriendRequest(friendRequestId));
    });

    socket.on("notification_unread_count", ({ count }) => {
      store.dispatch(setUnreadNotificationCount(count));
    });

    /* -------------------- GROUP: CREATED -------------------- */

    socket.on("group_created", (group: Chat) => {
      const exists = store
        .getState()
        .chat.chats.some((c) => c._id === group._id);
      if (!exists) {
        store.dispatch(addChat(group));
      }

      // Join the room so the creator (and all members notified individually)
      // start receiving room-scoped events immediately.
      joinGroupRoom(group._id);
    });

    /* -------------------- GROUP: UPDATED -------------------- */

    socket.on("group_updated", (group: Chat) => {
      store.dispatch(upsertChat(group));
    });

    /* -------------------- GROUP: MEMBERS ADDED -------------------- */

    socket.on("members_added", (group: Chat) => {
      store.dispatch(upsertChat(group));
    });

    /**
     * Emitted individually to each newly added user.
     * Adds the group to their chat list AND joins the Socket.IO room
     * so they immediately start receiving room-scoped events (new_message, etc.).
     */
    socket.on("added_to_group", (group: Chat) => {
      const exists = store
        .getState()
        .chat.chats.some((c) => c._id === group._id);
      if (!exists) {
        store.dispatch(addChat(group));
      }

      // Must join the room regardless of whether the chat was already in the list —
      // the socket has never subscribed to this room before.
      joinGroupRoom(group._id);
    });

    /* -------------------- GROUP: MEMBER REMOVED -------------------- */

    /**
     * Emitted to the group room when a member is kicked.
     * If the current user is the one being removed:
     * - Leave the Socket.IO room immediately (stop receiving further room events)
     * - Remove the group from the Redux chat list
     * For other members, group_updated handles the data refresh.
     */
    socket.on(
      "member_removed",
      ({
        chatId,
        removedUserId,
      }: {
        chatId: string;
        removedUserId: string;
      }) => {
        const currentUserId = store.getState().auth.user?._id;
        if (removedUserId === currentUserId) {
          leaveGroupRoom(chatId);
          store.dispatch(removeChat(chatId));
        }
      },
    );

    /**
     * Emitted directly to the removed user as a redundant targeted signal.
     * Leave the room and strip the group from the chat list.
     */
    socket.on("removed_from_group", ({ chatId }: { chatId: string }) => {
      leaveGroupRoom(chatId);
      store.dispatch(removeChat(chatId));
    });

    /* -------------------- GROUP: ADMIN TOGGLED -------------------- */

    socket.on(
      "admin_toggled",
      ({
        chatId,
        memberId,
        isAdmin,
      }: {
        chatId: string;
        memberId: string;
        isAdmin: boolean;
      }) => {
        store.dispatch(updateChatAdmin({ chatId, memberId, isAdmin }));
      },
    );

    /* -------------------- GROUP: OWNERSHIP TRANSFERRED -------------------- */

    socket.on(
      "ownership_transferred",
      ({ chatId, newOwnerId }: { chatId: string; newOwnerId: string }) => {
        store.dispatch(updateChatOwner({ chatId, newOwnerId }));
      },
    );

    /* -------------------- GROUP: MEMBER LEFT -------------------- */

    /**
     * Emitted to the group room when someone leaves voluntarily.
     * Only updates the member list for remaining members — the leaver
     * handles their own departure via "left_group" below.
     */
    socket.on(
      "member_left",
      ({ chatId, userId }: { chatId: string; userId: string }) => {
        store.dispatch(removeChatMember({ chatId, userId }));
      },
    );

    /**
     * Emitted directly to the user who left voluntarily.
     * Leave the Socket.IO room immediately and remove the group from the chat list.
     */
    socket.on("left_group", ({ chatId }: { chatId: string }) => {
      leaveGroupRoom(chatId);
      store.dispatch(removeChat(chatId));
    });

    /* -------------------- GROUP: DELETED -------------------- */

    /**
     * Emitted to each member individually when the group is soft-deleted.
     * Leave the Socket.IO room immediately and remove the group from the chat list.
     */
    socket.on("group_deleted", ({ chatId }: { chatId: string }) => {
      leaveGroupRoom(chatId);
      store.dispatch(removeChat(chatId));
    });

    /* -------------------- PRESENCE -------------------- */

    socket.on("online_users", (userIds: string[]) => {
      userIds.forEach((id) => {
        store.dispatch(updatePresence({ userId: id, status: "online" }));
      });
    });

    socket.on(
      "presence_update",
      ({ userId, status }: PresenceUpdatePayload) => {
        store.dispatch(updatePresence({ userId, status }));
      },
    );

    /* -------------------- BLOCK -------------------- */

    /**
     * Someone blocked me.
     * - Track who blocked me (gates UI interactions)
     * - Remove them from my friend list
     * - Remove the DM from my chat list and clear its messages
     */
    socket.on("user_blocked", ({ by }: { by: string }) => {
      store.dispatch(addBlockedBy(by));
      store.dispatch(removeFriendFromSocket(by));
    });

    /**
     * Someone unblocked me.
     * - Remove them from blockedByUsers so interactions are re-enabled
     */
    socket.on("user_unblocked", ({ by }: { by: string }) => {
      store.dispatch(removeBlockedBy(by));
    });

    /**
     * My own block/unblock action succeeded.
     * - Remove blocked user's DM from my chat list
     * - Remove from friend list (already done optimistically in thunk,
     *   this handles the confirmed cleanup)
     */
    socket.on("block_success", ({ targetUserId }: { targetUserId: string }) => {
      // Clean up friend state on confirmed block
      store.dispatch(removeFriendFromSocket(targetUserId));
    });

    /* -------------------- CONNECTION EVENTS -------------------- */

    socket.on("disconnect", (reason) => {
      console.warn("❌ Socket disconnected:", reason);
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
    });

    socket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error);
    });

    socket.on("reconnect", () => {
      allChats.forEach((chatId) => joinGroupRoom(chatId));
    });
  } else if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

/* -------------------- CLEANUP -------------------- */

export const disconnectSocket = () => {
  if (!socket) return;

  console.log("🧹 Disconnecting socket");

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};
