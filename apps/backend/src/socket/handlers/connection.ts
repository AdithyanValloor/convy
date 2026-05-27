import type { Socket } from "socket.io";
import {
  userJoined,
  heartbeat,
  getOnlineUsers,
  userDisconnected,
} from "../presence.js";
import { Chat } from "../../services/chat/models/chat.model.js";

export const registerConnectionHandlers = (socket: Socket): void => {
  // Join the user's personal room for direct events and presence updates.
  socket.on("join", async (userId: string) => {
    if (!userId) return;

    socket.data.userId = userId;

    socket.join(userId);
    userJoined(userId);

    socket.emit("online_users", getOnlineUsers());
  });

  // Only join group chats the user currently belongs to.
  socket.on("joinGroup", async ({ chatId, userId }) => {
    if (!chatId || !userId) return;

    const chat = await Chat.findOne({
      _id: chatId,
      members: userId,
      isDeleted: false,
    }).select("_id");

    if (!chat) return;

    socket.join(chatId);
  });

  // Leave a previously joined group room.
  socket.on("leaveGroup", (chatId: string) => {
    if (!chatId) return;
    socket.leave(chatId);
  });

  // Refresh the user's last-seen timestamp while the socket stays active.
  socket.on("heartbeat", ({ userId }: { userId: string }) => {
    if (!userId) return;
    heartbeat(userId);
  });

  // Clear presence state when the socket disconnects.
  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (!userId) return;

    userDisconnected(userId);
  });
};