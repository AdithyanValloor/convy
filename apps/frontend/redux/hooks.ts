import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "./store";

/**
 * Typed version of `useDispatch` for the application.
 * Ensures all dispatched actions are type-safe.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed version of `useSelector` for the application.
 * Provides type-safe access to the Redux store state.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const selectUserStatus = (userId: string) =>
  (state: RootState) =>
    state.presence.users[userId] ?? "offline";


export const selectIsBlockedByMe = (targetUserId: string) =>
  (state: RootState) =>
    state.block.blockedUsers.some((u) => u._id === targetUserId);

export const selectIsBlockingMe = (targetUserId: string) =>
  (state: RootState) =>
    state.block.blockedByUsers.includes(targetUserId);

export const selectIsBlocked = (targetUserId: string) =>
  (state: RootState) =>
    state.block.blockedUsers.some((u) => u._id === targetUserId) ||
    state.block.blockedByUsers.includes(targetUserId);