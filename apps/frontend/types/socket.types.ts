import { ChatMessage } from "./message.types.js";

/**
 * new_message socket event
 */
export type NewMessagePayload = ChatMessage;

/**
 * unread_update socket event
 */
export interface UnreadUpdatePayload {
  chatId: string;
  count: number;
}

/**
 * presence_update socket event
 */
export interface PresenceUpdatePayload {
  userId: string;
  status: "online" | "offline";
}
