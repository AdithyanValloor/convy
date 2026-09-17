"use client";

import { Check } from "lucide-react";
import FriendCard from "../Message/FriendCard";
import { useAppSelector } from "@/redux/hooks";
import { FaCheck } from "react-icons/fa";
import GroupAvatarUploader from "./GroupAvatarUploader";

interface CreateGroupProps {
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

export default function CreateGroup({
  groupName,
  setGroupName,
  friends,
  selectedUsers,
  toggleUserSelection,
  handleCreateGroup,
  actionLoading,
  groupAvatar,
  setGroupAvatar,
}: CreateGroupProps) {
  const onlineUsers = useAppSelector((state) => state.presence.users);
  return (
    <div className="h-full w-full flex flex-col gap-3 p-1">
      <div className="flex justify-center">
        <GroupAvatarUploader
          canEdit={true}
          value={groupAvatar}
          onChange={setGroupAvatar}
        />
      </div>
      <div className="px-2">
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter a group name"
          className="
      h-11 w-full
      rounded-xl
      border border-base-content/[0.07]
      bg-base-content/[0.045]
      px-4
      text-sm
      text-base-content
      placeholder:text-base-content/35
      outline-none
      transition-all duration-200
      focus:border-violet-500/40
      focus:bg-base-content/[0.06]
      focus:ring-2
      focus:ring-violet-500/10
    "
        />
      </div>

      {/* Friends list */}
      <div className="px-2 pt-1">
        <p className="text-xs font-medium uppercase tracking-wider text-base-content/40">
          All friends
        </p>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-1">
        {friends.map((friend) => {
          const selected = selectedUsers.has(friend._id);
          const status = onlineUsers[friend._id] || "offline";

          return (
            <FriendCard
              key={friend._id}
              msgId={friend._id}
              chatType="personal"
              hideLastMessage
              onClick={() => toggleUserSelection(friend._id)}
              user={{
                name: friend.username,
                displayName: friend.displayName ?? friend.username,
                profilePicture: friend.profilePicture,
                status,
              }}
              rightSlot={
                selected ? (
                  <Check className="text-violet-500 mx-2" strokeWidth={3} size={18} />
                ) : null
              }
              ClassName={`border ${selected ? "bg-base-content/10 border border-base-content/10" : "border-transparent"} `}
            />
          );
        })}
      </div>

      { selectedUsers.size > 0 && groupName && (<button
        type="button"
        title="Create group"
        aria-label="Create group"
        onClick={handleCreateGroup}
        disabled={actionLoading}
        className="
            fixed right-4 top-4
            flex h-10 w-10
            cursor-pointer
            items-center justify-center
            rounded-xl
            bg-violet-500
            p-2
            text-white
            transition-all duration-200
            hover:scale-105
          "
      >
        <FaCheck size={14} />
      </button>)}
    </div>
  );
}
