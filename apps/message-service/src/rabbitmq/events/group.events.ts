import { GroupDTO } from "../../types/group.dto.js";

export interface GroupCreatedEvent {
  eventId: string;
  eventType: "group.created";
  occurredAt: string;

  payload: {
    group: GroupDTO;
    memberIds: string[];
  };
}

export interface GroupMembersAddedEvent {
  eventId: string;
  eventType: "group.members-added";
  occurredAt: string;

  payload: {
    chatId: string;
    group: GroupDTO;
    newMemberIds: string[];
  };
}

export interface GroupMemberRemovedEvent {
  eventId: string;
  eventType: "group.member-removed";
  occurredAt: string;

  payload: {
    chatId: string;
    removedMemberId: string;
  };
}

export interface GroupUpdatedEvent {
  eventId: string;
  eventType: "group.updated";
  occurredAt: string;

  payload: {
    chatId: string;
    group: GroupDTO;
  };
}

export interface GroupDeletedEvent {
  eventId: string;
  eventType: "group.deleted";
  occurredAt: string;

  payload: {
    chatId: string;
    memberIds?: string[];
  };
}

export interface GroupAdminToggleEvent {
  eventId: string;
  eventType: "group.admin-toggle";
  occurredAt: string;

  payload: {
    chatId: string;
    memberId: string;
    isAdmin: boolean;
  };
}

export interface GroupMemberLeftEvent {
  eventId: string;
  eventType: "group.member-left";
  occurredAt: string;

  payload: {
    chatId: string;
    userId: string;
  };
}

export interface GroupOwnershipTransferredEvent {
  eventId: string;
  eventType: "group.transfer-owner";
  occurredAt: string;

  payload: {
    chatId: string;
    userId: string;
  };
}
