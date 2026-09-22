import {
  emitDeleteMessage,
  emitEditMessage,
  emitMentionNotification,
  emitMessageReaction,
  emitMessagesSeen,
  emitNewMessage,
  emitUnreadUpdate,
} from "../../socket/emitters/message.emmitter.js";
import {
  emitMessageRequestAccepted,
  emitMessageRequestRejected,
  emitMessageRequestSent,
} from "../../socket/emitters/messageRequest.emitters.js";

export const handleMessageEvent = async (event: any) => {
  switch (event.eventType) {
    case "message.created":
      emitNewMessage(event.payload.chatId, event.payload.message);
      break;

    case "message.mentioned":
      emitMentionNotification(
        event.payload.userId,
        event.payload.chatId,
        event.payload.message,
      );
      break;

    case "message.unread-update":
      emitUnreadUpdate(
        event.payload.memberId,
        event.payload.chatId,
        event.payload.unreadCounts,
      );
      break;

    case "message.edited":
      emitEditMessage(event.payload.chatId, event.payload.message);
      break;

    case "message.reaction":
      emitMessageReaction(event.payload.chatId, event.payload.message);
      break;

    case "message.delete":
      emitDeleteMessage(event.payload.chatId, event.payload.message);
      break;

    case "message.seen":
      emitMessagesSeen(
        event.payload.chatId,
        event.payload.memberId,
        event.payload.unreadCounts,
      );
      break;

    case "message-request.created":
      emitMessageRequestSent(
        event.payload.senderId,
        event.payload.toUserId,
        event.payload.request
      );
      break;

    case "message-request.rejected":
      emitMessageRequestRejected(
        event.payload.fromUserId,
        event.payload.requestId,
        event.payload.chatId
      );
      break;

    case "message-request.accepted":
      emitMessageRequestAccepted(
        event.payload.userA,
        event.payload.userB,
        event.payload.requestPayload
      );
      break;

    default:
      console.warn(`Unknown message event: ${event.eventType}`);
  }
};
