"use client";

import { ArrowLeft, ChevronRight, UserRoundPlus, UsersRound } from "lucide-react";
import { useState } from "react";
import IconButton from "../GlobalComponents/IconButtons";
import SearchInput from "../GlobalComponents/SearchInput";
import CreateGroup from "./CreateGroup";
import AddFriendInput from "../GlobalComponents/AddFriendInput";
import { useIsMobile } from "@/utils/screenSize";

interface NewChatPros {
  onClose: () => void;
  groupName: string;
  setGroupName: (v: string) => void;
  friends: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: {
      key: string | null;
    };
  }[];
  selectedUsers: Set<string>;
  toggleUserSelection: (id: string) => void;
  handleCreateGroup: () => void;
  actionLoading: boolean;
  groupAvatar: string | null;
  setGroupAvatar: (v: string | null) => void;
}

type CreateChatView = "menu" | "group" | "friend";

function MenuRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="
    group
    flex cursor-pointer items-center
    rounded-xl
    px-3 py-3
    transition-all duration-200
    hover:bg-base-content/[0.05]
    active:scale-[0.99]
  "
    >
      <div
        className="
      flex h-11 w-11 shrink-0
      items-center justify-center
      rounded-xl
      bg-base-content/[0.07]
      text-base-content/75
      transition-all duration-200
      group-hover:bg-base-content/[0.10]
      group-hover:text-base-content
    "
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1 px-3">
        <h3 className="truncate text-[14px] font-semibold">{title}</h3>

        {subtitle && (
          <p className="mt-0.5 truncate text-xs text-base-content/45">
            {subtitle}
          </p>
        )}
      </div>

      <div
        className="
      text-base-content/25
      transition-transform duration-200
      group-hover:translate-x-0.5
      group-hover:text-base-content/50
    "
      >
        <ChevronRight size={15} />
      </div>
    </div>
  );
}

export default function NewChat({
  onClose,
  groupName,
  setGroupName,
  friends,
  selectedUsers,
  toggleUserSelection,
  handleCreateGroup,
  actionLoading,
  groupAvatar,
  setGroupAvatar,
}: NewChatPros) {
  const [view, setView] = useState<CreateChatView>("menu");

  const isMobile = useIsMobile();

  return (
    <div className="fixed inset-0 flex pb-3 items-center justify-center z-50 overflow-hidden">
      <div
        className={`
          flex h-full w-full flex-col
          gap-4
          overflow-visible
          bg-base-100
          p-4
          border border-base-content/[0.08]
          shadow-[0_20px_60px_rgba(0,0,0,0.12)]
          ${!isMobile && "rounded-2xl"}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <IconButton
            ariaLabel="Back"
            onClick={() => {
              if (view === "menu") onClose();
              else setView("menu");
            }}
          >
            <ArrowLeft />
          </IconButton>
          <h1 className="text-2xl font-semibold p-1">
            {view === "menu"
              ? "New Chat"
              : view === "friend"
                ? "Add friend"
                : "New Group"}
          </h1>
        </div>

        {/* Search only in menu */}
        {view === "menu" && <SearchInput />}

        {/* CONTENT */}
        <div className="flex-1">
          {view === "menu" && (
            <div className="flex flex-col gap-1">
              {/* Add Friend */}
              <MenuRow
                icon={<UserRoundPlus size={20} />}
                title="Add Friend"
                subtitle="Send a friend request"
                onClick={() => setView("friend")}
              />

              {/* New Group */}
              <MenuRow
                icon={<UsersRound size={20} />}
                title="New Group"
                onClick={() => setView("group")}
              />
            </div>
          )}

          {view === "group" && (
            <CreateGroup
              groupName={groupName}
              setGroupName={setGroupName}
              friends={friends}
              selectedUsers={selectedUsers}
              toggleUserSelection={toggleUserSelection}
              handleCreateGroup={handleCreateGroup}
              actionLoading={actionLoading}
              groupAvatar={groupAvatar}
              setGroupAvatar={setGroupAvatar}
            />
          )}

          {view === "friend" && (
            <div>
              <AddFriendInput />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
