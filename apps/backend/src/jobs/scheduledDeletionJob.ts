import cron from "node-cron";
import { UserModel } from "../services/user/models/user.model.js";
import { cleanupUserData } from "./helpers/cleanupUserData.js";

/**
 * Runs once a day to finalize accounts whose scheduled deletion time has passed.
 * The job marks those accounts as deleted and removes related user links.
 *
 * TODO: before deleting, emit a "user.deleted" event or call a
 *       cascade service to clean up posts, messages, sessions, etc.
 */

export const startScheduledDeletionJob = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log(
      "[DeletionJob] Checking for accounts scheduled for deletion...",
    );

    const now = new Date();

    // Only fetch ids because the helper performs the actual cleanup work.
    const expiredAccounts = await UserModel.find({
      scheduledDeletionAt: { $lte: now },
    }).select("_id");

    if (expiredAccounts.length === 0) {
      console.log("[DeletionJob] No accounts to delete.");
      return;
    }

    const ids = expiredAccounts.map((u) => u._id);

    await cleanupUserData(ids);

    console.log(`[DeletionJob] Soft-deleted ${ids.length} account(s).`);
  });
};
