import {
  GroupAdminToggleEvent,
  GroupCreatedEvent,
  GroupDeletedEvent,
  GroupMemberLeftEvent,
  GroupMemberRemovedEvent,
  GroupMembersAddedEvent,
  GroupOwnershipTransferredEvent,
  GroupUpdatedEvent,
} from "../events/group.events.js";
import { publishEvent } from "../helpers/publisher.helper.js";



export const publishGroupCreated = async (
  event: GroupCreatedEvent,
): Promise<void> => {
  await publishEvent("group.created", event);

  console.log("✅ RabbitMQ confirmed group.created");
};

export const publishMembersAdded = async (
  event: GroupMembersAddedEvent,
): Promise<void> => {
  await publishEvent("group.members-added", event);

  console.log("✅ RabbitMQ confirmed group.members-added");
};

export const publishMemberRemoved = async (
  event: GroupMemberRemovedEvent,
): Promise<void> => {
  await publishEvent("group.member-removed", event);

  console.log("✅ RabbitMQ confirmed group.member-removed");
};

export const publishGroupUpdated = async (
  event: GroupUpdatedEvent,
): Promise<void> => {
  await publishEvent("group.updated", event);

  console.log("✅ RabbitMQ confirmed group.updated");
};

export const publishGroupDeleted = async (
  event: GroupDeletedEvent,
): Promise<void> => {
  await publishEvent("group.deleted", event);

  console.log("✅ RabbitMQ confirmed group.deleted");
};

export const publishAdminToggle = async (
  event: GroupAdminToggleEvent,
): Promise<void> => {
  await publishEvent("group.admin-toggle", event);

  console.log("✅ RabbitMQ confirmed group.admin-toggle");
};

export const publishMemberLeft = async (
  event: GroupMemberLeftEvent,
): Promise<void> => {
  await publishEvent("group.member-left", event);

  console.log("✅ RabbitMQ confirmed group.member-left");
};

export const publishOwnershipTransferred = async (
  event: GroupOwnershipTransferredEvent,
): Promise<void> => {
  await publishEvent("group.transfer-owner", event);

  console.log("✅ RabbitMQ confirmed group.transfer-owner");
};
