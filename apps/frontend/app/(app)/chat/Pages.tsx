"use client";

import { Phone, UsersRound, Inbox, Archive, Settings, User } from "lucide-react";

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
    <div className="h-full flex flex-col items-center justify-center gap-4 select-none px-6">
      <div className="bg-base-100 p-3 rounded-xl text-base-content/50">
        {icon}
      </div>
      <div className="text-center space-y-1">
        <p className="text-xl font-semibold text-base-content/70 tracking-tight">{label}</p>
        <p className="text-sm text-base-content/35 max-w-[220px] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function CallHistoryPage() {
  return (
    <EmptyPage
      icon={<Phone size={32} strokeWidth={1.25} />}
      label="Call History"
      description="Your past voice and video calls will appear here."
    />
  );
}

export function FriendsPage() {
  return (
    <EmptyPage
      icon={<UsersRound size={32} strokeWidth={1.25} />}
      label="Friends"
      description="Add people to your friends list to chat and call."
    />
  );
}

export function InboxPage() {
  return (
    <EmptyPage
      icon={<Inbox size={32} strokeWidth={1.25} />}
      label="Inbox"
      description="Mentions, reactions, and activity will show up here."
    />
  );
}

export function ArchivedChatsPage() {
  return (
    <EmptyPage
      icon={<Archive size={32} strokeWidth={1.25} />}
      label="Archived Chats"
      description="Chats you archive won't show in your main list."
    />
  );
}

export function SettingsPage() {
  return (
    <EmptyPage
      icon={<Settings size={32} strokeWidth={1.25} />}
      label="Settings"
      description="Manage your account, privacy, and preferences."
    />
  );
}

export function UserProfilePage() {
  return (
    <EmptyPage
      icon={<User size={32} strokeWidth={1.25} />}
      label="Profile"
      description="Your profile, status, and account details live here."
    />
  );
}