/** Privacy-related socket emitters. */

import { getIO } from "../io.js";

export const emitPrivacyUpdated = (userId: string): void => {
  const io = getIO();

  // Lets socket handlers refresh any cached privacy-dependent state.
  io.to(userId).emit("privacy:updated");
};
