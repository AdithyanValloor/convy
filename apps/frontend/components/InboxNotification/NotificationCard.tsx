"use client";

import Image from "next/image";
import defaultPFP from "@/public/default-pfp.png";
import {
  AtSign,
  Reply,
  X,
  UserRoundPlus,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { useAppDispatch } from "@/redux/hooks";
import { acceptFriend, rejectFriend } from "@/redux/features/friendsSlice";

import {
  deleteNotification,
  deleteNotificationLocal,
  InboxNotification,
  NotificationType,
} from "@/redux/features/notificationSlice";

import AppButton from "@/components/GlobalComponents/AppButton";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface NotificationCardProps {
  notification: InboxNotification;
  onClick?: (notification: InboxNotification) => void;
}

/* ───────────────── helpers ───────────────── */

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ───────────────── icon config ───────────────── */

const iconConfig: Record<NotificationType, { Icon: React.ElementType }> = {
  friend_request_received: {
    Icon: UserRoundPlus,
  },
  friend_request_accepted: {
    Icon: UserRoundCheck,
  },
  mention: {
    Icon: AtSign,
  },
  group_added: {
    Icon: UsersRound,
  },
  reply: {
    Icon: Reply,
  },
};

/* ───────────────── message builder ───────────────── */

function buildMessage(notification: InboxNotification) {
  const actor = notification.actor;
  const name = actor?.displayName || actor?.username || "Someone";

  switch (notification.type) {
    case "friend_request_accepted":
      return { title: `${name} accepted your friend request` };
    case "friend_request_received":
      return { title: `${name} sent you a friend request` };
    case "mention":
      return {
        title: `${name} mentioned you`,
        subtitle: notification.message?.content,
      };
    case "group_added":
      return {
        title: `${name} added you to ${notification.group?.chatName}`,
        subtitle: "Tap to open the group",
      };
    case "reply":
      return {
        title: `${name} replied to your message`,
        subtitle: notification.message?.content,
      };
    default:
      return { title: "Notification" };
  }
}

/* ───────────────── component ───────────────── */

export default function NotificationCard({
  notification,
  onClick,
}: NotificationCardProps) {
  const dispatch = useAppDispatch();

  const { Icon } = iconConfig[notification.type];

  // const { Icon, bg, color } = iconConfig[notification.type];

  const { title, subtitle } = buildMessage(notification);
  const url =
    useSignedUrl(notification.actor?.profilePicture?.key) || defaultPFP;
  const isFriendRequest = notification.type === "friend_request_received";

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.friendRequest) {
      dispatch(acceptFriend(notification.friendRequest));
      dispatch(deleteNotificationLocal(notification._id));
      dispatch(deleteNotification(notification._id));
    }
  };

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.friendRequest) {
      dispatch(rejectFriend(notification.friendRequest));
      dispatch(deleteNotificationLocal(notification._id));
      dispatch(deleteNotification(notification._id));
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(deleteNotificationLocal(notification._id));
    dispatch(deleteNotification(notification._id));
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(notification)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick?.(notification);
      }}
      className={`
      group relative mb-1.5 flex w-full cursor-pointer items-start
      gap-3 rounded-xl px-3 py-3.5 text-left
      transition-all duration-200 overflow-hidden

      ${
        notification.read
          ? "hover:bg-base-content/5"
          : `
          bg-base-content/5
          hover:bg-base-content/10
          `
      }
    `}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <span
          className="
          absolute left-0 top-0 bottom-3
          w-[2px]
          h-full
          rounded-r-full
          bg-gradient-to-b
          from-[#17A6E8]
          via-[#7029F7]
          to-[#F73EC9]
        "
        />
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <Image
          src={url}
          alt="avatar"
          unoptimized
          width={40}
          height={40}
          className="
          h-10 w-10 rounded-full
          border border-base-content/10
          object-cover
        "
        />

        {/* Notification type badge */}
        <span
          className="
          absolute -right-1.5 -top-1.5
          flex h-[22px] w-[22px]
          items-center justify-center
          rounded-full
          border-2 border-base-100
          bg-base-200
          shadow-sm
        "
        >
          <Icon
            size={11}
            strokeWidth={2.5}
            className={
              notification.read ? "text-base-content/50" : "text-[#7029F7]"
            }
          />
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pr-5">
        <p
          className={`
          text-sm leading-snug
          ${
            notification.read
              ? "text-base-content/65"
              : "font-medium text-base-content"
          }
        `}
        >
          {title}
        </p>

        {subtitle && (
          <p className="mt-1 truncate text-xs text-base-content/40">
            {subtitle}
          </p>
        )}

        <p className="mt-1.5 text-[11px] tabular-nums text-base-content/30">
          {timeAgo(notification.createdAt)}
        </p>

        {/* Friend request actions */}
        {isFriendRequest && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="
              flex-1 cursor-pointer rounded-lg
              bg-violet-600
              py-1.5
              text-xs font-medium text-white
              transition-all duration-200
              hover:brightness-110
            "
            >
              Accept
            </button>

            <button
              type="button"
              onClick={handleReject}
              className="
              flex-1 cursor-pointer rounded-lg
              bg-base-content/[0.06]
              py-1.5
              text-xs font-medium
              text-base-content/55
              transition-all duration-200
              hover:bg-red-500/10
              hover:text-red-400
            "
            >
              Decline
            </button>
          </div>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={handleDelete}
        className="
        absolute right-1.5 top-1.5
        rounded-full p-1
        text-base-content/35
        opacity-0
        transition-all duration-150
        hover:bg-base-content/[0.07]
        hover:text-base-content/60
        group-hover:opacity-100
        cursor-pointer
      "
      >
        <X size={15} />
      </button>
    </div>
  );
}
