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
import { UnreadCountBadge } from "../Notification/UnreadCountBadge";

function NotificationCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl px-3 py-3">
      <div className="skeleton h-10 w-10 shrink-0 rounded-full" />

      <div className="flex flex-1 flex-col gap-2 pt-1">
        <div className="skeleton h-3.5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-2.5 w-12 rounded" />
      </div>
    </div>
  );
}

export default function NotificationInbox({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) {
  const dispatch = useAppDispatch();

  const { notifications, unreadCount, loading } = useAppSelector(
    (state) => state.notifications,
  );

  const router = useRouter();

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      dispatch(markAllNotificationsRead());
    }
  };

  const handleNotificationClick = (notification: InboxNotification) => {
    if (!notification.read) {
      dispatch(markNotificationRead(notification._id));
    }

    setActiveTab("Chats");

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

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 relative py-1">
          <h1 className="text-2xl font-semibold tracking-tight text-base-content">
            Inbox
          </h1>

          {unreadCount > 0 && (
            <UnreadCountBadge
              position="top-0 -right-4"
              count={unreadCount}
            />
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="
              group
              flex cursor-pointer
              items-center gap-1.5
              rounded-lg
              px-2.5 py-1.5
              text-xs
              text-base-content/50
              transition-all duration-200
              hover:bg-base-content/[0.05]
              hover:text-base-content/80
            "
          >
            <CheckCheck
              size={14}
              className="transition-transform duration-200 group-hover:scale-105"
            />

            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Header accent */}
      <div
        className="
          h-px
          bg-base-content/10
        "
      />

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-1 p-3">
            <div className="px-3 pb-1 pt-2">
              <div className="skeleton h-3 w-8 rounded" />
            </div>

            {Array.from({ length: 3 }).map((_, i) => (
              <NotificationCardSkeleton key={i} />
            ))}

            <div className="px-3 pb-1 pt-4">
              <div className="skeleton h-3 w-14 rounded" />
            </div>

            {Array.from({ length: 2 }).map((_, i) => (
              <NotificationCardSkeleton key={`earlier-${i}`} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-base-content/30">
            <div
              className="
                flex h-14 w-14 items-center justify-center
                rounded-2xl
                bg-base-content/[0.04]
              "
            >
              <Bell size={25} strokeWidth={1.5} />
            </div>

            <div className="text-center">
              <p className="text-sm font-medium text-base-content/50">
                Nothing here yet
              </p>

              <p className="mt-1 text-xs text-base-content/30">
                Your notifications will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-3">
            {/* New */}
            {unread.length > 0 && (
              <section>
                <p
                  className="
                    px-3 pb-2 pt-2
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    text-base-content/35
                  "
                >
                  New
                </p>

                <div className="flex flex-col gap-0.5">
                  {unread.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Earlier */}
            {read.length > 0 && (
              <section className="mt-3">
                <p
                  className="
                    px-3 pb-2 pt-2
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    text-base-content/35
                  "
                >
                  Earlier
                </p>

                <div className="flex flex-col gap-0.5">
                  {read.map((notification) => (
                    <NotificationCard
                      key={notification._id}
                      notification={notification}
                      onClick={handleNotificationClick}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
