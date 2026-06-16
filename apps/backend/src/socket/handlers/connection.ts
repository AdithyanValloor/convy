import type { Socket } from "socket.io";
import {
  heartbeat,
  userDisconnected,
} from "../presence.js";
import * as ChatAPI from "../../services/chat/api/chat.api.js";

export const registerConnectionHandlers = (socket: Socket): void => {
  // Only join group chats the user currently belongs to.
  socket.on("joinGroup", async ({ chatId }) => {
    const userId = socket.data.userId;
    if (!chatId || !userId) return;

    const chat = await ChatAPI.canJoinChat(chatId, userId)
    if (!chat) return;

    console.log(`User ${userId} joined chat: ${chatId}`);
  

    socket.join(chatId);
  });

  // Leave a previously joined group room.
  socket.on("leaveGroup", (chatId: string) => {
    if (!chatId) return;
    socket.leave(chatId);
  });

  // Refresh the user's last-seen timestamp while the socket stays active.
  socket.on("heartbeat", async () => {
    const userId = socket.data.userId;
    if (!userId) return;
    await heartbeat(userId);
  });

  // Clear presence state when the socket disconnects.
  socket.on("disconnect", async () => {
    const userId = socket.data.userId;
    if (!userId) return;

    await userDisconnected(userId, socket.id);
  });
};
