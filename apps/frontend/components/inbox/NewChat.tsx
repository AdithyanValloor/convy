"use client";

import { ArrowLeft, UserRoundPlus, UsersRound } from "lucide-react";
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
        cursor-pointer
        hover:bg-base-content/5
        p-2
        rounded-lg
        flex items-center
        transition-colors
      "
    >
      <div className="w-[45px] h-[45px] rounded-full bg-base-content/10 flex items-center justify-center">
        {icon}
      </div>

      <div className="px-2 flex-1 min-w-0">
        <h3 className="font-medium truncate">{title}</h3>
        {subtitle && (
          <p className="text-[13px] opacity-60 truncate">{subtitle}</p>
        )}
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
        className={`bg-base-200 p-3 overflow-visible ${!isMobile && "rounded-2xl"}  flex flex-col border border-base-content/10 gap-3 w-full h-full`}
      >
        {/* Header */}
        <div className="flex items-center gap-2">
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
