import { ChatDto, ChatSocketResponseDTO } from "../../types/chat.dto.js";
import { getIO } from "../io.js";

export const emitChatCreated = (
  fromUserId: string,
  toUserId: string,
  chat: ChatSocketResponseDTO,
): void => {
  getIO().to(fromUserId).emit("chat_created", chat);
  getIO().to(toUserId).emit("chat_created", chat);
};