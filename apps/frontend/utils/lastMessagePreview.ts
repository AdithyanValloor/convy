import { MessageType } from "@/redux/features/messageSlice";
import { ChatMessage } from "@/types/chat.types";

export function getLastMessagePreview(msg?: ChatMessage | MessageType): string {
  if (!msg) return "";

  if (msg.deleted) return "Message deleted";

  if (msg.file) {
    const type = msg.file.mimeType;

    if (type.startsWith("image/")) {
      return "Sent an image";
    }

    return "Sent a file";
  }

  return msg.content || "";
}