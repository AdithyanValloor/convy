import {
  emitGroupCreated,
  emitMembersAdded,
  emitMemberRemoved,
  emitGroupUpdated,
  emitGroupDeleted,
  emitAdminToggled,
  emitMemberLeft,
  emitOwnershipTransferred,
} from "../../socket/emitters/group.emitter.js";

export const handleGroupEvent = async (event: any): Promise<void> => {
  switch (event.eventType) {
    case "group.created":
      emitGroupCreated(event.payload.group, event.payload.memberIds);
      break;

    case "group.members-added":
      emitMembersAdded(
        event.payload.chatId,
        event.payload.group,
        event.payload.newMemberIds,
      );
      break;

    case "group.member-removed":
      emitMemberRemoved(event.payload.chatId, event.payload.removedMemberId);
      break;

    case "group.updated":
      emitGroupUpdated(event.payload.chatId, event.payload.group);
      break;

    case "group.deleted":
      emitGroupDeleted(event.payload.chatId, event.payload.memberIds);
      break;

    case "group.admin-toggle":
      emitAdminToggled(
        event.payload.chatId,
        event.payload.memberId,
        event.payload.isAdmin,
      );
      break;

    case "group.member-left":
      emitMemberLeft(event.payload.chatId, event.payload.userId);
      break;

    case "group.transfer-owner":
      emitOwnershipTransferred(event.payload.chatId, event.payload.userId);
      break;

    default:
      console.warn(`Unknown group event: ${event.eventType}`);
  }
};
