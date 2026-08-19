import { FlattenMaps } from "mongoose";
import { BlockModel, IBlock } from "../models/block.model.js";
import { IBlockRepository } from "./block.repository.js";

export class BlockRepository implements IBlockRepository {
  async findBlockRelationship(
    userA: string,
    userB: string,
  ): Promise<FlattenMaps<IBlock> | null> {
    return BlockModel.findOne({
      $or: [
        { blocker: userA, blocked: userB },
        { blocker: userB, blocked: userA },
      ],
    }).lean();
  }

  async findBlockedRelationships(
    currentUserId: string,
    userIds: string[],
  ): Promise<FlattenMaps<IBlock>[]> {
    return BlockModel.find({
      $or: [
        {
          blocker: currentUserId,
          blocked: { $in: userIds },
        },
        {
          blocked: currentUserId,
          blocker: { $in: userIds },
        },
      ],
    })
      .select("blocker blocked")
      .lean();
  }

  async findBlockedByUser(userId: string): Promise<FlattenMaps<IBlock>[]> {
    return BlockModel.find({
      blocker: userId,
    })
      .select("blocked")
      .lean();
  }

  async findBlockedUser(userId: string): Promise<FlattenMaps<IBlock>[]> {
    return BlockModel.find({
      blocked: userId,
    })
      .select("blocker")
      .lean();
  }

  async findBlock(
    userId: string,
    targetUserId: string,
  ): Promise<FlattenMaps<IBlock> | null> {
    return BlockModel.findOne({
      blocker: userId,
      blocked: targetUserId,
    }).lean();
  }

  async createBlock(
    userId: string,
    targetUserId: string,
  ): Promise<FlattenMaps<IBlock>> {
    const block = await BlockModel.create({
      blocker: userId,
      blocked: targetUserId,
    });

    return block.toObject();
  }

  async deleteBlock(
    userId: string,
    targetUserId: string,
  ): Promise<FlattenMaps<IBlock> | null> {
    return BlockModel.findOneAndDelete({
      blocker: userId,
      blocked: targetUserId,
    }).lean();
  }

  async existsEitherWay(userA: string, userB: string): Promise<boolean> {
    const block = await BlockModel.exists({
      $or: [
        { blocker: userA, blocked: userB },
        { blocker: userB, blocked: userA },
      ],
    });

    return !!block;
  }
}
