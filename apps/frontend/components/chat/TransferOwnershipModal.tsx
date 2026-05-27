"use client";

import { X, Crown } from "lucide-react";
import FriendCard from "../Message/FriendCard";
import IconButton from "../GlobalComponents/IconButtons";
import SearchInput from "../GlobalComponents/SearchInput";
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface Member {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: { key: string | null };
}

interface TransferOwnershipModalProps {
  show: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string;
  onTransfer: (newOwnerId: string) => void;
}

export default function TransferOwnershipModal({
  show,
  onClose,
  members,
  currentUserId,
  onTransfer,
}: TransferOwnershipModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const eligibleMembers = members.filter((m) => m._id !== currentUserId);

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return eligibleMembers;

    const query = searchQuery.toLowerCase();

    return eligibleMembers.filter(
      (member) =>
        member.displayName?.toLowerCase().includes(query) ||
        member.username.toLowerCase().includes(query),
    );
  }, [eligibleMembers, searchQuery]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center text-base-content"
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
             rounded-xl border border-base-content/10 shadow-xl overflow-hidden"
          >
            <div className="flex flex-col h-full p-4 min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Transfer Ownership</h3>
                <IconButton onClick={onClose} ariaLabel="Close modal">
                  <X size={18} />
                </IconButton>
              </div>

              {/* Description */}
              <p className="text-sm opacity-70 mt-2">
                Select a member to become the new owner. You will lose owner
                privileges after this action.
              </p>

              {/* Search (conditional) */}
              {eligibleMembers.length > 10 && (
                <div className="mt-3">
                  <SearchInput
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search members"
                    autoFocus
                  />
                </div>
              )}

              {/* Scrollable List */}
              <div className="flex-1 min-h-0 overflow-y-auto mt-3 pr-1">
                {filteredMembers.length === 0 ? (
                  <p className="text-sm text-center opacity-60">
                    No members found
                  </p>
                ) : (
                  <ul>
                    {filteredMembers.map((m) => {
                      const isSelected = selectedId === m._id;

                      return (
                        <li
                          key={m._id}
                          onClick={() =>
                            setSelectedId((prev) =>
                              prev === m._id ? null : m._id,
                            )
                          }
                          className={`relative my-1 rounded-lg cursor-pointer border transition ${
                            isSelected
                              ? "bg-yellow-500/10 border-yellow-500"
                              : "border-transparent hover:bg-base-300"
                          }`}
                        >
                          <FriendCard
                            groupMember={{
                              _id: m._id,
                              username: m.username,
                              displayName: m.displayName ?? m.username,
                              profilePicture: m.profilePicture,
                            }}
                            msgId={m._id}
                          />

                          {isSelected && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500">
                              <Crown size={18} />
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Fixed Buttons */}
              <div className="mt-4 pt-3 border-t border-base-content/10 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedId(null);
                    onClose();
                  }}
                  className="w-full p-2 cursor-pointer rounded-xl bg-base-300 hover:bg-base-300/50 transition"
                >
                  Cancel
                </button>

                <button
                  disabled={!selectedId}
                  onClick={() => {
                    if (selectedId) {
                      onTransfer(selectedId);
                      setSelectedId(null);
                      onClose();
                    }
                  }}
                  className="w-full cursor-pointer p-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Transfer
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
