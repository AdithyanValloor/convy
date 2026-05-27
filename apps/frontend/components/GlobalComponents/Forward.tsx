"use client";

import { Check, Send, X } from "lucide-react";
import FriendCard from "../Message/FriendCard";
import IconButton from "./IconButtons";
import SearchInput from "./SearchInput";
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoSend } from "react-icons/io5";

import { useAppSelector } from "@/redux/hooks";
import { Chat } from "@/types/chat.types";

interface User {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: { url: string | null };
}

interface ForwardModalProps {
  show: boolean;
  onClose: () => void;
  chats: Chat[];
  selectedChats: Set<string>;
  toggleChatSelection: (id: string) => void;
  handleForwardSelected: () => void;
}

export default function ForwardModal({
  show,
  onClose,
  chats,
  selectedChats,
  toggleChatSelection,
  handleForwardSelected,
}: ForwardModalProps) {
  const currentUser = useAppSelector((state) => state.auth.user);
  const blockedUsers = useAppSelector((state) => state.block.blockedUsers);
  const blockedByUsers = useAppSelector((state) => state.block.blockedByUsers);

  const blockedIds = useMemo(
    () => new Set(blockedUsers.map((u) => u._id)),
    [blockedUsers],
  );

  const blockedByIds = useMemo(() => new Set(blockedByUsers), [blockedByUsers]);

  const getChatDisplayName = (chat: Chat) => {
    if (chat.isGroup) return chat.chatName;

    const other = chat.members.find((m) => m._id !== currentUser?._id);
    return other?.displayName ?? other?.username ?? "Unknown";
  };

  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return chats.filter((chat) => {
      if (chat.isGroup) {
        if (!query) return true;
        return getChatDisplayName(chat).toLowerCase().includes(query);
      }

      const other = chat.members.find((m) => m._id !== currentUser?._id);

      if (!other) return false;

      if (blockedIds.has(other._id) || blockedByIds.has(other._id)) {
        return false;
      }

      if (!query) return true;

      return getChatDisplayName(chat).toLowerCase().includes(query);
    });
  }, [chats, searchQuery, currentUser, blockedIds, blockedByIds]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex px-4 items-center justify-center text-base-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 5 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 bg-base-200 flex flex-col 
             w-full max-w-md 
             max-h-[85vh] 
             rounded-2xl border border-base-content/10 shadow-xl overflow-hidden"
          >
            <div className="flex flex-col h-full p-4 min-h-0">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Forward Message</h3>
                  {/* <span className="text-xs opacity-60">
                    {selectedChats.size}/5 selected
                  </span> */}
                  <IconButton onClick={onClose} ariaLabel="Close modal">
                    <X size={18} />
                  </IconButton>
                </div>
                <p className="opacity-70 text-sm">
                  Select where you want to share this message.
                </p>
              </div>

              {/* Search only if large list */}
              {chats.length > 10 && (
                <div className="mt-3">
                  <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends"
                    autoFocus
                  />
                </div>
              )}

              {/* Scrollable List */}
              <div className="flex-1 min-h-0 overflow-y-auto mt-3 pr-1">
                {filteredChats.length === 0 ? (
                  <p className="text-sm text-center opacity-60">
                    No friends to foreward
                  </p>
                ) : (
                  <ul>
                    {filteredChats.map((chat) => {
                      const isSelected = selectedChats.has(chat._id);

                      return (
                        <li
                          key={chat._id}
                          onClick={() => toggleChatSelection(chat._id)}
                          className={`relative my-1 rounded-xl cursor-pointer border transition ${
                            isSelected
                              ? "bg-green-900/5 border-green-900"
                              : "border-transparent hover:bg-base-200"
                          }`}
                        >
                          <FriendCard
                            modal
                            groupMember={{
                              _id: chat._id,
                              username: getChatDisplayName(chat),
                              displayName: getChatDisplayName(chat),
                              profilePicture: chat.isGroup
                                ? { key: chat.avatar?.key ?? null }
                                :{ key: chat.members.find(
                                    (m) => m._id !== currentUser?._id,
                                  )?.profilePicture?.key ?? null },
                            }}
                            msgId={chat._id}
                            hideLastMessage
                          />

                          {isSelected && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-900">
                              <Check size={18} strokeWidth={2} />
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Buttons */}
              <div className="mt-4 pt-3 border-t border-base-content/10 flex gap-2">
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="w-full p-2 cursor-pointer rounded-xl bg-base-300 hover:bg-base-300/50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForwardSelected}
                  disabled={selectedChats.size === 0}
                  className="w-full p-2 flex items-center justify-center gap-3 cursor-pointer bg-[#004030] text-white rounded-xl hover:bg-[#006644] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Foreward <IoSend strokeWidth={1.3} size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
