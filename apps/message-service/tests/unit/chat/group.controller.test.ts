import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  createGroupChat,
  getGroupById,
  addMembers,
  removeMembers,
  toggleAdmin,
  leaveGroup,
  deleteGroup,
  transferOwnership,
  updateGroupAvatar,
  getAvatarDownloadUrl,
  editName,
} from "../../../src/modules/chat/controllers/group.controller.js";

import { groupService } from "../../../src/modules/chat/composition/container.js";

import {
  publishOwnershipTransferred,
  publishAdminToggle,
  publishGroupCreated,
  publishGroupDeleted,
  publishGroupUpdated,
  publishMemberLeft,
  publishMemberRemoved,
  publishMembersAdded,
} from "../../../src/rabbitmq/publisher/group.publisher.js";
import { GROUP_KEY_REGEX } from "../../../src/utils/constants/regex.js";

// ==================================================
// Mocks
// ==================================================

vi.mock("../../../src/modules/chat/composition/container.js", () => ({
  groupService: {
    createGroupChatFunction: vi.fn(),
    getGroupByIdFunction: vi.fn(),
    addMembersFunction: vi.fn(),
    removeMembersFunction: vi.fn(),
    toggleAdminFunction: vi.fn(),
    leaveGroupFunction: vi.fn(),
    deleteGroupFunction: vi.fn(),
    transferOwnershipFunction: vi.fn(),
    updateGroupAvatarById: vi.fn(),
    getGroupAvatarUrlService: vi.fn(),
    editGroupNameService: vi.fn(),
  },
}));

vi.mock("../../../src/rabbitmq/publisher/group.publisher.js", () => ({
  publishOwnershipTransferred: vi.fn(),
  publishAdminToggle: vi.fn(),
  publishGroupCreated: vi.fn(),
  publishGroupDeleted: vi.fn(),
  publishGroupUpdated: vi.fn(),
  publishMemberLeft: vi.fn(),
  publishMemberRemoved: vi.fn(),
  publishMembersAdded: vi.fn(),
}));

vi.mock("../../src/rabbitmq/helpers/event.helper.js", () => ({
  createEvent: vi.fn((type, payload) => ({
    type,
    payload,
  })),
}));

vi.mock("../../src/modules/messages/utils/normalizeGroup.js", () => ({
  normalizeGroup: vi.fn((group) => group),
}));

// ==================================================
// Test Helpers
// ==================================================

const userId = "user-1";
const otherUserId = "user-2";
const chatId = "chat-1";

const group = {
  _id: {
    toString: () => chatId,
  },
  name: "Test Group",
  members: [userId, otherUserId],
  admin: [userId],
  isGroup: true,
} as any;

const createRequest = (
  options: {
    body?: any;
    params?: any;
    user?: any;
  } = {},
) =>
  ({
    body: options.body ?? {},
    params: options.params ?? {},
    user: Object.prototype.hasOwnProperty.call(options, "user")
      ? options.user
      : { id: userId },
  }) as any;

const createMockResponse = () => {
  const res: any = {};

  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);

  return res;
};

const createMockNext = () => vi.fn();

// ==================================================
// Setup
// ==================================================

beforeEach(() => {
  vi.clearAllMocks();

  vi.mocked(publishGroupCreated).mockResolvedValue(undefined);
  vi.mocked(publishGroupDeleted).mockResolvedValue(undefined);
  vi.mocked(publishGroupUpdated).mockResolvedValue(undefined);
  vi.mocked(publishMemberLeft).mockResolvedValue(undefined);
  vi.mocked(publishMemberRemoved).mockResolvedValue(undefined);
  vi.mocked(publishMembersAdded).mockResolvedValue(undefined);
  vi.mocked(publishAdminToggle).mockResolvedValue(undefined);
  vi.mocked(publishOwnershipTransferred).mockResolvedValue(undefined);
});

// ==================================================
// createGroupChat()
// ==================================================

describe("createGroupChat()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: {
        name: "Test Group",
        userIds: [otherUserId],
      },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await createGroupChat(req, res, next);

    expect(groupService.createGroupChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when group name is missing", async () => {
    const req = createRequest({
      body: {
        userIds: [otherUserId],
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await createGroupChat(req, res, next);

    expect(groupService.createGroupChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when userIds is not an array", async () => {
    const req = createRequest({
      body: {
        name: "Test Group",
        userIds: "user-2",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await createGroupChat(req, res, next);

    expect(groupService.createGroupChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when userIds is empty", async () => {
    const req = createRequest({
      body: {
        name: "Test Group",
        userIds: [],
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await createGroupChat(req, res, next);

    expect(groupService.createGroupChatFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should create group successfully", async () => {
    const memberIds = [userId, otherUserId];

    vi.mocked(groupService.createGroupChatFunction).mockResolvedValue({
      group,
      memberIds,
    });

    const req = createRequest({
      body: {
        name: "Test Group",
        userIds: [otherUserId],
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await createGroupChat(req, res, next);

    expect(groupService.createGroupChatFunction).toHaveBeenCalledWith(
      "Test Group",
      [otherUserId],
      userId,
    );

    expect(publishGroupCreated).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Group chat created",
      groupChat: group,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// getGroupById()
// ==================================================

describe("getGroupById()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      params: { chatId },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getGroupById(req, res, next);

    expect(groupService.getGroupByIdFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getGroupById(req, res, next);

    expect(groupService.getGroupByIdFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should return group successfully", async () => {
    vi.mocked(groupService.getGroupByIdFunction).mockResolvedValue(group);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getGroupById(req, res, next);

    expect(groupService.getGroupByIdFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      group,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// addMembers()
// ==================================================

describe("addMembers()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: {
        chatId,
        members: [otherUserId],
      },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await addMembers(req, res, next);

    expect(groupService.addMembersFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {
        members: [otherUserId],
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await addMembers(req, res, next);

    expect(groupService.addMembersFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when members is not an array", async () => {
    const req = createRequest({
      body: {
        chatId,
        members: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await addMembers(req, res, next);

    expect(groupService.addMembersFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when members array is empty", async () => {
    const req = createRequest({
      body: {
        chatId,
        members: [],
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await addMembers(req, res, next);

    expect(groupService.addMembersFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should add members successfully", async () => {
    const newMemberIds = ["user-3"];

    vi.mocked(groupService.addMembersFunction).mockResolvedValue({
      group,
      newMemberIds,
    });

    const req = createRequest({
      body: {
        chatId,
        members: newMemberIds,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await addMembers(req, res, next);

    expect(groupService.addMembersFunction).toHaveBeenCalledWith(
      chatId,
      newMemberIds,
      userId,
    );

    expect(publishMembersAdded).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Members added successfully",
      chat: group,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// removeMembers()
// ==================================================

describe("removeMembers()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: {
        chatId,
        member: otherUserId,
      },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await removeMembers(req, res, next);

    expect(groupService.removeMembersFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {
        member: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await removeMembers(req, res, next);

    expect(groupService.removeMembersFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when member is missing", async () => {
    const req = createRequest({
      body: {
        chatId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await removeMembers(req, res, next);

    expect(groupService.removeMembersFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should remove member successfully", async () => {
    vi.mocked(groupService.removeMembersFunction).mockResolvedValue({
      group,
      removedMemberId: otherUserId,
    });

    const req = createRequest({
      body: {
        chatId,
        member: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await removeMembers(req, res, next);

    expect(groupService.removeMembersFunction).toHaveBeenCalledWith(
      userId,
      chatId,
      otherUserId,
    );

    expect(publishMemberRemoved).toHaveBeenCalled();
    expect(publishGroupUpdated).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Member removed successfully",
      chat: group,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// toggleAdmin()
// ==================================================

describe("toggleAdmin()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: {
        chatId,
        member: otherUserId,
        makeAdmin: true,
      },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleAdmin(req, res, next);

    expect(groupService.toggleAdminFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {
        member: otherUserId,
        makeAdmin: true,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleAdmin(req, res, next);

    expect(groupService.toggleAdminFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when member is missing", async () => {
    const req = createRequest({
      body: {
        chatId,
        makeAdmin: true,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleAdmin(req, res, next);

    expect(groupService.toggleAdminFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when makeAdmin is not boolean", async () => {
    const req = createRequest({
      body: {
        chatId,
        member: otherUserId,
        makeAdmin: "true",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleAdmin(req, res, next);

    expect(groupService.toggleAdminFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should promote member to admin", async () => {
    vi.mocked(groupService.toggleAdminFunction).mockResolvedValue({
      group,
      memberId: otherUserId,
      isAdmin: true,
    });

    const req = createRequest({
      body: {
        chatId,
        member: otherUserId,
        makeAdmin: true,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleAdmin(req, res, next);

    expect(groupService.toggleAdminFunction).toHaveBeenCalledWith(
      userId,
      chatId,
      otherUserId,
      true,
    );

    expect(publishAdminToggle).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User promoted to admin",
      chat: group,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should demote admin", async () => {
    vi.mocked(groupService.toggleAdminFunction).mockResolvedValue({
      group,
      memberId: otherUserId,
      isAdmin: false,
    });

    const req = createRequest({
      body: {
        chatId,
        member: otherUserId,
        makeAdmin: false,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await toggleAdmin(req, res, next);

    expect(groupService.toggleAdminFunction).toHaveBeenCalledWith(
      userId,
      chatId,
      otherUserId,
      false,
    );

    expect(publishAdminToggle).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "User demoted",
      chat: group,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// leaveGroup()
// ==================================================

describe("leaveGroup()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: { chatId },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await leaveGroup(req, res, next);

    expect(groupService.leaveGroupFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await leaveGroup(req, res, next);

    expect(groupService.leaveGroupFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should leave group successfully when group remains", async () => {
    vi.mocked(groupService.leaveGroupFunction).mockResolvedValue({
      message: "Left group successfully",
      deleted: false,
      chatId,
    });

    const req = createRequest({
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await leaveGroup(req, res, next);

    expect(groupService.leaveGroupFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(publishMemberLeft).toHaveBeenCalled();
    expect(publishGroupDeleted).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Left group successfully",
      deleted: false,
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should publish group deletion when leaving deletes the group", async () => {
    vi.mocked(groupService.leaveGroupFunction).mockResolvedValue({
      message: "Group deleted",
      deleted: true,
      chatId,
      memberIds: [userId, otherUserId],
    });

    const req = createRequest({
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await leaveGroup(req, res, next);

    expect(groupService.leaveGroupFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(publishGroupDeleted).toHaveBeenCalled();
    expect(publishMemberLeft).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Group deleted",
      deleted: true,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// deleteGroup()
// ==================================================

describe("deleteGroup()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: { chatId },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await deleteGroup(req, res, next);

    expect(groupService.deleteGroupFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await deleteGroup(req, res, next);

    expect(groupService.deleteGroupFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should delete group successfully", async () => {
    vi.mocked(groupService.deleteGroupFunction).mockResolvedValue({
      message: "message",
      deleted: false,
      chatId,
      memberIds: [userId, otherUserId],
    });

    const req = createRequest({
      body: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await deleteGroup(req, res, next);

    expect(groupService.deleteGroupFunction).toHaveBeenCalledWith(
      userId,
      chatId,
    );

    expect(publishGroupDeleted).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Group deleted successfully",
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// transferOwnership()
// ==================================================

describe("transferOwnership()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: {
        chatId,
        newOwnerId: otherUserId,
      },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await transferOwnership(req, res, next);

    expect(groupService.transferOwnershipFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {
        newOwnerId: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await transferOwnership(req, res, next);

    expect(groupService.transferOwnershipFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when newOwnerId is missing", async () => {
    const req = createRequest({
      body: {
        chatId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await transferOwnership(req, res, next);

    expect(groupService.transferOwnershipFunction).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should transfer ownership successfully", async () => {
    vi.mocked(groupService.transferOwnershipFunction).mockResolvedValue({
      group,
      newOwnerId: otherUserId,
    });

    const req = createRequest({
      body: {
        chatId,
        newOwnerId: otherUserId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await transferOwnership(req, res, next);

    expect(groupService.transferOwnershipFunction).toHaveBeenCalledWith(
      userId,
      chatId,
      otherUserId,
    );

    expect(publishOwnershipTransferred).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ownership transferred successfully",
      chat: group,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// updateGroupAvatar()
// ==================================================

describe("updateGroupAvatar()", () => {
  const validKey = `group/${chatId}/image.webp`;

  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: {
        chatId,
        key: validKey,
      },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await updateGroupAvatar(req, res, next);

    expect(groupService.updateGroupAvatarById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      body: {
        key: validKey,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await updateGroupAvatar(req, res, next);

    expect(groupService.updateGroupAvatarById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when key is missing", async () => {
    const req = createRequest({
      body: {
        chatId,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await updateGroupAvatar(req, res, next);

    expect(groupService.updateGroupAvatarById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when avatar key does not match the group path", async () => {
    const req = createRequest({
      body: {
        chatId,
        key: "wrong/path/avatar.webp",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await updateGroupAvatar(req, res, next);

    expect(groupService.updateGroupAvatarById).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should update group avatar successfully", async () => {
    const result = {
      avatar: {
        key: validKey,
      },
    };

    vi.mocked(groupService.updateGroupAvatarById).mockResolvedValue(result);

    const req = createRequest({
      body: {
        chatId,
        key: validKey,
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await updateGroupAvatar(req, res, next);

    expect(groupService.updateGroupAvatarById).toHaveBeenCalledWith(
      userId,
      chatId,
      validKey,
    );

    expect(res.json).toHaveBeenCalledWith(result);

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// getAvatarDownloadUrl()
// ==================================================

describe("getAvatarDownloadUrl()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      params: { chatId },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getAvatarDownloadUrl(req, res, next);

    expect(groupService.getGroupAvatarUrlService).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should reject when chatId is missing", async () => {
    const req = createRequest({
      params: {},
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getAvatarDownloadUrl(req, res, next);

    expect(groupService.getGroupAvatarUrlService).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should return avatar download URL successfully", async () => {
    const url = "https://example.com/avatar.webp";

    vi.mocked(groupService.getGroupAvatarUrlService).mockResolvedValue(url);

    const req = createRequest({
      params: { chatId },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await getAvatarDownloadUrl(req, res, next);

    expect(groupService.getGroupAvatarUrlService).toHaveBeenCalledWith(
      chatId,
      userId,
    );

    expect(res.json).toHaveBeenCalledWith({
      url,
    });

    expect(next).not.toHaveBeenCalled();
  });
});

// ==================================================
// editName()
// ==================================================

describe("editName()", () => {
  it("should reject when user is not authenticated", async () => {
    const req = createRequest({
      body: {
        chatId,
        newName: "New Group Name",
      },
      user: undefined,
    });

    const res = createMockResponse();
    const next = createMockNext();

    await editName(req, res, next);

    expect(groupService.editGroupNameService).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("should edit group name successfully", async () => {
    const updatedChat = {
      ...group,
      name: "New Group Name",
    };

    vi.mocked(groupService.editGroupNameService).mockResolvedValue(updatedChat);

    const req = createRequest({
      body: {
        chatId,
        newName: "New Group Name",
      },
    });

    const res = createMockResponse();
    const next = createMockNext();

    await editName(req, res, next);

    expect(groupService.editGroupNameService).toHaveBeenCalledWith(
      userId,
      chatId,
      "New Group Name",
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      chat: updatedChat,
    });

    expect(next).not.toHaveBeenCalled();
  });
});
