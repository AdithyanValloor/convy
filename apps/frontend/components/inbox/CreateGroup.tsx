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
    <div className="h-full w-full flex flex-col gap-3">
      <div className="flex justify-center">
        <GroupAvatarUploader canEdit={true} value={groupAvatar} onChange={setGroupAvatar} />
      </div>
      <div className="px-2">
        <input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter a Group name"
          className="w-full h-10 border-b border-base-content/10 focus:border-base-content focus:outline-0"
        />
      </div>

      {/* Friends list */}
      <p className="text-center">All friends</p>

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
                  <Check className="text-cyan-900" strokeWidth={3} size={18} />
                ) : null
              }
              ClassName={`border ${selected ? "bg-cyan-900/5 border border-cyan-900" : "border-transparent"} `}
            />
          );
        })}
      </div>

      <button
        type="button"
        title="Create group"
        aria-label="Create group"
        onClick={handleCreateGroup}
        disabled={actionLoading}
        className="fixed cursor-pointer disabled:cursor-auto top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-cyan-900 text-white p-2 disabled:opacity-50"
      >
        <FaCheck />
      </button>
    </div>
  );
}
