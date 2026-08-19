import { FlattenMaps } from "mongoose";
import { IBlock } from "../models/block.model.js";

export interface IBlockRepository {
  findBlockRelationship(
    userA: string,
    userB: string,
  ): Promise<FlattenMaps<IBlock> | null>;

  findBlockedRelationships(
    currentUserId: string,
    userIds: string[],
  ): Promise<FlattenMaps<IBlock>[]>;

  findBlockedByUser(userId: string): Promise<FlattenMaps<IBlock>[]>;

  findBlockedUser(userId: string): Promise<FlattenMaps<IBlock>[]>;

  findBlock(
    userId: string,
    targetUserId: string,
  ): Promise<FlattenMaps<IBlock> | null>;

  createBlock(
    userId: string,
    targetUserId: string,
  ): Promise<FlattenMaps<IBlock>>;

  deleteBlock(
    userId: string,
    targetUserId: string,
  ): Promise<FlattenMaps<IBlock> | null>;

  existsEitherWay(userA: string, userB: string): Promise<boolean>;
}
