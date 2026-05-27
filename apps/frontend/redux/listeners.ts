import { createListenerMiddleware } from "@reduxjs/toolkit";
import { logoutUser } from "@/redux/features/authSlice";
import { disconnectSocket } from "@/utils/socket";

/**
 * Global listener middleware.
 *
 * Used to handle cross-cutting side effects that should
 * not live inside slices or components.
 */
export const listenerMiddleware = createListenerMiddleware();

/**
 * Listen for successful logout and perform global cleanup.
 *
 * Responsibilities:
 * - Disconnect active socket connections
 * - Ensure no real-time resources remain after session ends
 */
listenerMiddleware.startListening({
  actionCreator: logoutUser.fulfilled,
  effect: async () => {
    disconnectSocket();
  },
});
