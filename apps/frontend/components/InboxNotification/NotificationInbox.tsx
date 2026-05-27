"use client";

import { useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import NotificationCard from "./NotificationCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  InboxNotification,
} from "@/redux/features/notificationSlice";
import { setJumpTo } from "@/redux/features/messageSlice";

/* ───────────────── skeleton card ───────────────── */

function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 px-3 py-3 rounded-xl">
      {/* Avatar */}
      <div className="skeleton w-10 h-10 rounded-full shrink-0" />
      {/* Content lines */}
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-2.5 w-12 rounded" />
      </div>
    </div>
  );
}

/* ───────────────── main component ───────────────── */

export default function NotificationInbox({setActiveTab}:{setActiveTab: (tab: string) => void}) {
  const dispatch = useAppDispatch();
  const { notifications, unreadCount, loading } = useAppSelector(
    (state) => state.notifications,
  );
  const router = useRouter();

  /* ---------------- fetch ---------------- */

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  /* ---------------- actions ---------------- */

  const handleMarkAllRead = () => {
    if (unreadCount > 0) dispatch(markAllNotificationsRead());
  };

  const handleNotificationClick = (notification: InboxNotification) => {
    if (!notification.read) dispatch(markNotificationRead(notification._id));

    setActiveTab("Chats")

    if (notification.group?._id) {
      router.push(`/chat/${notification.group._id}`);
      return;
    }

    if (notification.chat?._id) {
      if (notification.message?._id) {
        dispatch(
          setJumpTo({
            chatId: notification.chat._id,
            messageId: notification.message._id,
          }),
        );
      }
      router.push(`/chat/${notification.chat._id}`);
    }
  };

  /* ---------------- derived ---------------- */

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  /* ---------------- render ---------------- */

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 px-4 border-b border-base-content/10">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-base-content p-1">
            Inbox
          </h1>
          <Bell size={20} className="text-base-content/60" />
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-xs text-base-content/40
              hover:text-base-content/70 transition-colors cursor-pointer"
          >
            <CheckCheck size={13} />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-2 flex flex-col gap-0.5">
            {/* "New" section skeleton */}
            <div>
              <div className="skeleton h-3 w-8 rounded mx-2 mt-2 mb-3" />
              {Array.from({ length: 3 }).map((_, i) => (
                <NotificationCardSkeleton key={i} />
              ))}
            </div>
            {/* "Earlier" section skeleton */}
            <div>
              <div className="skeleton h-3 w-14 rounded mx-2 mt-3 mb-3" />
              {Array.from({ length: 2 }).map((_, i) => (
                <NotificationCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div
            className="h-full flex flex-col items-center justify-center gap-2
            text-base-content/30 select-none"
          >
            <Bell size={30} strokeWidth={1.5} />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="p-2 flex flex-col gap-0.5">
            {/* Unread */}
            {unread.length > 0 && (
              <div>
                <p
                  className="px-2 pt-2 pb-1 text-xs font-semibold
                  text-base-content/40 uppercase tracking-widest"
                >
                  New
                </p>
                {unread.map((n) => (
                  <NotificationCard
                    key={n._id}
                    notification={n}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}

            {/* Read */}
            {read.length > 0 && (
              <div>
                <p
                  className="px-2 pt-3 pb-1 text-xs font-semibold
                  text-base-content/40 uppercase tracking-widest"
                >
                  Earlier
                </p>
                {read.map((n) => (
                  <NotificationCard
                    key={n._id}
                    notification={n}
                    onClick={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}