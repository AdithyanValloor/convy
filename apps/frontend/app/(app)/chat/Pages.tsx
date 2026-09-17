"use client";

import { Settings } from "lucide-react";
import { IoCall } from "react-icons/io5";
import { FaInbox, FaArchive, FaUserFriends, FaUser } from "react-icons/fa";

function EmptyPage({
  icon,
  label,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 select-none px-6">
      <div className="rounded-xl bg-base-100 p-3 text-base-content/50">
        {icon}
      </div>

      <div className="space-y-1 text-center">
        <p className="text-xl font-semibold tracking-tight text-base-content/70">
          {label}
        </p>

        <p className="max-w-[220px] text-sm leading-relaxed text-base-content/35">
          {description}
        </p>
      </div>
    </div>
  );
}

export function CallHistoryPage() {
  return (
    <EmptyPage
      icon={<IoCall size={28} />}
      label="Call History"
      description="Your past voice and video calls will appear here."
    />
  );
}

export function FriendsPage() {
  return (
    <EmptyPage
      icon={<FaUserFriends size={27} />}
      label="Friends"
      description="Add people to your friends list to chat and call."
    />
  );
}

export function InboxPage() {
  return (
    <EmptyPage
      icon={<FaInbox size={27} />}
      label="Inbox"
      description="Mentions, reactions, and activity will show up here."
    />
  );
}

export function ArchivedChatsPage() {
  return (
    <EmptyPage
      icon={<FaArchive size={27} />}
      label="Archived Chats"
      description="Chats you archive won't show in your main list."
    />
  );
}

export function SettingsPage() {
  return (
    <EmptyPage
      icon={<Settings size={28} strokeWidth={1.7} />}
      label="Settings"
      description="Manage your account, privacy, and preferences."
    />
  );
}

export function UserProfilePage() {
  return (
    <EmptyPage
      icon={<FaUser size={28} strokeWidth={1.7} />}
      label="Profile"
      description="Your profile, status, and account details live here."
    />
  );
}