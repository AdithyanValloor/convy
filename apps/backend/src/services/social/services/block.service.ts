import { BadRequest, Unauthorized } from "../../../utils/errors/httpErrors.js";
import { normalizeFriendship } from "../utils/social.utils.js";
import { IBlockRepository } from "../repositories/block.repository.js";
import { IFriendsRepository } from "../repositories/friends.repository.js";
import { IRequestRepository } from "../repositories/request.repository.js";

import * as UserAPI from "../../user/api/user.api.js";

/** Block service helpers for managing user block relationships. */

export class BlockService {
  constructor(
    private readonly blockRepository: IBlockRepository,
    private readonly friendsRepository: IFriendsRepository,
    private readonly requestRepository: IRequestRepository,
  ) {}

  /** Returns the users blocked by the current user. */
  async getBlockedUsers(userId: string) {
    if (!userId) throw Unauthorized();

    const blocks = await this.blockRepository.findBlockedByUser(userId);

    const userIds = blocks.map((block) => block.blocked.toString());

    return UserAPI.fetchUsers(userIds);
  }

  /** Returns the user IDs of people who have blocked the current user. */
  async getBlockedByUsers(userId: string) {
    if (!userId) throw Unauthorized();

    const blocks = await this.blockRepository.findBlockedUser(userId);

    return blocks.map((block) => block.blocker.toString());
  }

  /** Blocks a target user and removes any friendship or pending requests. */
  async blockUser(userId: string, targetUserId: string) {
    if (!userId) throw Unauthorized();

    if (userId === targetUserId) {
      throw BadRequest("Cannot block yourself");
    }

    const targetUser = await UserAPI.findUserById(targetUserId);

    const existingBlock = await this.blockRepository.findBlock(
      userId,
      targetUserId,
    );

    if (existingBlock) {
      return { alreadyBlocked: true };
    }

    await this.blockRepository.createBlock(userId, targetUserId);

    const [user1, user2] = normalizeFriendship(userId, targetUserId);

    await this.friendsRepository.deleteFriendship(user1, user2);

    await this.requestRepository.deletePendingRequestsBetweenUsers(
      userId,
      targetUserId,
    );

    return {
      success: true,
      blockedUser: targetUser,
    };
  }

  /** Removes an existing block created by the current user. */
  async unblockUser(userId: string, targetUserId: string) {
    if (!userId) throw Unauthorized();

    const deleted = await this.blockRepository.deleteBlock(
      userId,
      targetUserId,
    );

    if (!deleted) {
      return { notBlocked: true };
    }

    return { success: true };
  }

  /** Checks whether either user has blocked the other. */
  async isBlockedEitherWay(userA: string, userB: string) {
    return this.blockRepository.existsEitherWay(userA, userB);
  }
}
