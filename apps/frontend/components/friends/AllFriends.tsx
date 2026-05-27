"use client";

import { EllipsisVertical } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchFriends, removeFriend } from "@/redux/features/friendsSlice";
import { accessChat } from "@/redux/features/chatSlice";
import FriendCard from "../Message/FriendCard";
import IconButton from "../GlobalComponents/IconButtons";

interface AllFriendsProps {
  setActiveTab: (tab: string) => void;
  searchQuery: string;
}

export default function AllFriends({ setActiveTab, searchQuery }: AllFriendsProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { friends, listLoading } = useAppSelector((state) => state.friends);
  const { user } = useAppSelector((state) => state.auth);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    const q = searchQuery.toLowerCase();
    return friends.filter(
      (f) =>
        f.username.toLowerCase().includes(q) ||
        (f.displayName ?? "").toLowerCase().includes(q),
    );
  }, [friends, searchQuery]);

  useEffect(() => {
    if (!activeMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".dropdown") || target.closest("[data-right-slot]")) return;
      setActiveMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  const openChat = async (friendId: string) => {
    if (!user) return;
    const result = await dispatch(accessChat({ userId: friendId })).unwrap();
    router.push(`/chat/${result.data._id}`);
    setActiveTab("Chats");
  };

  if (listLoading) {
    return (
      <div className="flex justify-center p-4">
        <span className="loading loading-spinner loading-xs" />
      </div>
    );
  }

  if (!friends.length) {
    return <p className="p-3 text-center opacity-70">No friends to show</p>;
  }

  if (!filteredFriends.length) {
    return (
      <p className="p-3 text-center opacity-70">
        No friends match &ldquo;{searchQuery}&rdquo;
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {filteredFriends.map((friend) => (
        <FriendCard
          key={friend._id}
          msgId={friend._id}
          user={{
            _id: friend._id,
            name: friend.username,
            displayName: friend.displayName ?? friend.username,
            profilePicture: friend.profilePicture,
          }}
          forceActive={activeMenuId === friend._id}
          onClick={() => openChat(friend._id)}
          rightSlot={
            <div className="flex gap-1">
              <div className="dropdown dropdown-end">
                <IconButton
                  ariaLabel="More options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === friend._id ? null : friend._id);
                  }}
                >
                  <EllipsisVertical size={12} strokeWidth={1.5} />
                </IconButton>
                <ul
                  className="menu dropdown-content mt-1 bg-base-100 rounded-box w-40 p-2 shadow"
                  onClick={(e) => e.stopPropagation()}
                >
                  <li>
                    <button
                      className="text-red-600"
                      onClick={() => {
                        dispatch(removeFriend(friend._id));
                        setActiveMenuId(null);
                      }}
                    >
                      Remove friend
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          }
        />
      ))}
    </div>
  );
}