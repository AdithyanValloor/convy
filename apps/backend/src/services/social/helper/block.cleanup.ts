import { Types } from "mongoose";
import { BlockModel } from "../models/block.model.js";

export const blockCleanup = async (ids: Types.ObjectId[]) => {
  BlockModel.deleteMany({
    $or: [{ blocker: { $in: ids } }, { blocked: { $in: ids } }],
  });
};
