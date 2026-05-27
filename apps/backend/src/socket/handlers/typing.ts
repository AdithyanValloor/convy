/** Typing indicator socket handlers. */

import type { Socket } from "socket.io";
import { UserModel } from "../../services/user/models/user.model.js";

export const registerTypingHandlers = (socket: Socket): void => {
  let typingEnabled: boolean | null = null;

  const getTypingEnabled = async (): Promise<boolean> => {
    if (typingEnabled !== null) return typingEnabled;

    const userId = socket.data.userId;
    const user = await UserModel.findById(userId).select("privacy");
    typingEnabled = user?.privacy?.typingIndicators ?? true;
    return typingEnabled;
  };

  socket.on("typing", async (payload) => {
    if (!(await getTypingEnabled())) return;
    socket.to(payload.roomId).emit("typing", payload);
  });

  socket.on("stopTyping", async (payload) => {
    if (!(await getTypingEnabled())) return;
    socket.to(payload.roomId).emit("stopTyping", payload);
  });

  socket.on("privacy:updated", () => {
    typingEnabled = null;
  });
};
