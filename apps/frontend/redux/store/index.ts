import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../features/authSlice";
import chatReducer from "../features/chatSlice";
import friendsReducer from "../features/friendsSlice";
import messagesReducer from "../features/messageSlice";
import profileReducer from "../features/profileSlice";
import unreadReducer from "../features/unreadSlice";
import themeReducer from "../features/themeSlice";
import presenceReducer from "../features/presenceSlice";
import typingReducer from "../features/typingSlice"
import blockReducer from "../features/blockSlice";
import notificationsReducer from "../features/notificationSlice"
import requestReducer from "../features/requestSlice"
import globalSearchReducer from "../features/globalSearchSlice"
import privacyReducer from "../features/privacySlice";
import notificationSettingsReducer from "../features/Notificationsettingsslice"

import { listenerMiddleware } from "../listeners";

/**
 * Redux Store Configuration
 * -------------------------
 * Centralized Redux store created using Redux Toolkit.
 *
 * This store acts as the single source of truth for all
 * client-side application state.
 *
 * State is organized by domain to ensure:
 * - Clear separation of concerns
 * - Predictable state updates
 * - Easier scalability and maintenance
 */
export const store = configureStore({
  reducer: {
    // Authentication & session state
    auth: authReducer,

    // Chat metadata (selected chat, latest message, chat list)
    chat: chatReducer,

    // UI theme and appearance preferences
    theme: themeReducer,

    // Friends / contacts management
    friends: friendsReducer,

    // Normalized message entities and message indexes
    messages: messagesReducer,

    // User profile data
    profile: profileReducer,

    // Unread message counters per chat
    unread: unreadReducer,

    // Real-time presence (online / offline) state
    presence: presenceReducer,

    // Real-time typing indication
    typing: typingReducer,

    // Blocking users
    block: blockReducer,

    notifications: notificationsReducer,

    requests: requestReducer,

    globalSearch: globalSearchReducer,

    privacy: privacyReducer,

    notificationSettings: notificationSettingsReducer,
  },

   /**
   * Middleware configuration
   *
   * - Uses Redux Toolkit's default middleware (thunk, immutability checks)
   * - Prepends listener middleware to react to actions with side effects
   *   (e.g., cross-slice coordination, analytics, socket sync, cache updates)
   */
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  
});

/**
 * Strongly-typed helpers derived from the store instance.
 * These types are used throughout the application to ensure
 * type-safe access to state and dispatch.
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
