"use client";

import { useState, useEffect, JSX, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { useParams } from "next/navigation";
import Personal from "./Personal";
import GroupChat from "./Groups";
import SearchInput from "../GlobalComponents/SearchInput";
import IconButton from "../GlobalComponents/IconButtons";
import NewChat from "./NewChat";
import {
  selectGroupUnread,
  selectPersonalUnread,
} from "@/redux/selectors/unreadSelectors";
import { createGroupChat } from "@/redux/features/chatSlice";
import MessageRequests from "./Messagerequests";
import GlobalSearch from "../Search/GlobalSearch";
import { clearSearch } from "@/redux/features/globalSearchSlice";
import { IoMdMail } from "react-icons/io";
import { BiSolidMessageSquareAdd } from "react-icons/bi";
import { UnreadCountBadge } from "../Notification/UnreadCountBadge";
import api from "@/utils/axiosInstance";

type ChatType = "personal" | "group";

export default function InboxSection() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [chatType, setChatType] = useState<ChatType>("personal");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMessageRequest, setShowMessageRequest] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  /* ---------- Search state ---------- */
  const [inputQuery, setInputQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce: only update debouncedQuery 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [inputQuery]);

  const isSearching = debouncedQuery.length >= 2;

  const { incoming } = useAppSelector((state) => state.requests);
  const { friends } = useAppSelector((state) => state.friends);
  const { accessLoading } = useAppSelector((state) => state.chat);

  const params = useParams<{ chatId?: string }>();
  const selectedChatId = params?.chatId;

  /* ---------- Unread counters ---------- */
  const personalUnread = useAppSelector(selectPersonalUnread);
  const groupUnread = useAppSelector(selectGroupUnread);

  /* ---------- Navigation ---------- */
  const openChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const sections: Record<ChatType, JSX.Element> = {
    personal: (
      <Personal ifInbox onOpenChat={openChat} selectedChatId={selectedChatId} />
    ),
    group: (
      <GroupChat
        ifInbox
        onOpenChat={openChat}
        selectedChatId={selectedChatId}
      />
    ),
  };

  /* ---------- Group creation ---------- */
  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.size === 0) return;

    const res = await dispatch(
      createGroupChat({
        name: groupName.trim(),
        userIds: Array.from(selectedUsers),
        avatar: groupAvatar,
      }),
    ).unwrap();

    if (groupAvatar) {
      await api.post("/file/temp-avatar", {
        groupId: res._id,
        tempKey: groupAvatar,
      });
    }

    setShowCreateModal(false);
    setGroupName("");
    setSelectedUsers(new Set());
    setGroupAvatar(null);
    setChatType("group");

    router.push(`/chat/${res._id}`);
  };

  const handleSearchClose = useCallback(() => {
    setInputQuery("");
    setDebouncedQuery("");
    dispatch(clearSearch());
  }, [dispatch]);

  return (
    <div className="h-full w-full relative overflow-hidden">
      <div className="h-full w-full p-3 flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-base-content p-1">
            Chats
          </h1>
          <div className="flex gap-2">
            {incoming.length > 0 && (
              <div className="relative">
                <IconButton
                  ariaLabel="Message request"
                  onClick={() => setShowMessageRequest(true)}
                >
                  {/* <Mail aria-hidden /> */}
                  <IoMdMail aria-hidden size={22} />
                </IconButton>
                {incoming.length > 0 && (
                  <UnreadCountBadge
                    position="top-1 right-0 z-50 pointer-events-none"
                    count={incoming.length}
                  />
                )}
              </div>
            )}
            <IconButton
              ariaLabel="Create group chat"
              onClick={() => setShowCreateModal(true)}
            >
              <BiSolidMessageSquareAdd aria-hidden size={22} />
            </IconButton>
          </div>
        </div>

        {/* Search */}
        <SearchInput
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
        />

        {/* Tabs + Chat list — hidden while searching */}
        {!isSearching && (
          <>
            {/* Tabs */}
            <div className="relative flex border-b border-base-content/10">
              {(
                [
                  {
                    type: "personal",
                    label: "Personal",
                    unread: personalUnread,
                  },
                  { type: "group", label: "Groups", unread: groupUnread },
                ] as const
              ).map(({ type, label, unread }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setChatType(type)}
                  className={`flex-1 py-2 text-sm transition-colors duration-200 ${chatType === type ? "cursor-auto" : "cursor-pointer"}`}
                >
                  <span className="inline-flex relative items-center transition-colors duration-200 text-base-content/90 text-base">
                    {label}
                    {unread > 0 && (
                      <UnreadCountBadge
                        position="-top-1 -right-4"
                        count={unread}
                      />
                    )}
                  </span>
                </button>
              ))}
              <span
                className="absolute bottom-0 left-0 h-[1px] w-1/2 bg-base-content transition-transform duration-300 ease-out"
                style={{
                  transform:
                    chatType === "personal"
                      ? "translateX(0%)"
                      : "translateX(100%)",
                }}
              />
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto">{sections[chatType]}</div>
          </>
        )}

        {/* Global search results — replaces tabs + chat list */}
        {isSearching && (
          <div className="flex-1 overflow-y-auto">
            <GlobalSearch query={debouncedQuery} onClose={handleSearchClose} />
          </div>
        )}
      </div>

      {/* Create group modal */}
      {showCreateModal && (
        <NewChat
          onClose={() => setShowCreateModal(false)}
          groupName={groupName}
          setGroupName={setGroupName}
          friends={friends}
          selectedUsers={selectedUsers}
          toggleUserSelection={toggleUserSelection}
          handleCreateGroup={handleCreateGroup}
          actionLoading={accessLoading}
          groupAvatar={groupAvatar}
          setGroupAvatar={setGroupAvatar}
        />
      )}

      {showMessageRequest && incoming.length > 0 && (
        <MessageRequests onClose={() => setShowMessageRequest(false)} />
      )}
    </div>
  );
}
