"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  X,
  ArrowLeft,
  UserMinus,
  Shield,
  ShieldOff,
  LogOut,
  Trash2,
  Edit,
  Check,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import ProfileView from "./profileView";
import Image from "next/image";
import FriendCard from "../Message/FriendCard";
import IconButton from "../GlobalComponents/IconButtons";
import AddMembersModal from "../chat/AddMembersModal";
import ConfirmModal from "../GlobalComponents/ConfirmModal";
import TransferOwnershipModal from "../chat/TransferOwnershipModal";
import { useIsMobile } from "@/utils/screenSize";
import GroupAvatarUploader from "../inbox/GroupAvatarUploader";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { editGroupName } from "@/redux/features/chatSlice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Member {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: { key: string | null };
}

interface MemberWithRole extends Member {
  role: "admin" | "member" | "owner";
}

interface Friend {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: { key: string | null };
}


interface Group {
  _id: string;
  chatName: string;
  members: Member[];
  admin?: Member[];
  createdBy?: Member;
  avatar?: { key: string | null };
}

interface GroupSidebarProps {
  group: Group;
  currentUserId: string;
  onAddMembers?: (userIds: string[]) => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
  onRemoveMember?: (userId: string) => void;
  onMakeAdmin?: (userId: string) => void;
  onRemoveAdmin?: (userId: string) => void;
  onTransferOwnership?: (userId: string) => void;
  onBack?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GroupSidebar({
  group,
  currentUserId,
  onAddMembers,
  onLeaveGroup,
  onDeleteGroup,
  onTransferOwnership,
  onRemoveMember,
  onMakeAdmin,
  onRemoveAdmin,
  onBack,
}: GroupSidebarProps) {
  const [selectedProfile, setSelectedProfile] = useState<MemberWithRole | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableFriends, setAvailableFriends] = useState<Friend[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(group.chatName);

  const isMobile = useIsMobile();

  const [dropdownPos, setDropdownPos] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  const { friends } = useAppSelector((state) => state.friends);

  const adminIds = new Set(group.admin?.map((a) => a._id) ?? []);

  const creatorId = group.createdBy?._id;
  const isOwner = creatorId === currentUserId;
  const isAdmin = adminIds.has(currentUserId);
  const canManageMembers = isOwner || isAdmin;

  const membersWithRoles: MemberWithRole[] = group.members.map((m) => {
    if (creatorId && m._id === creatorId) {
      return { ...m, role: "owner" };
    }

    if (adminIds.has(m._id)) {
      return { ...m, role: "admin" };
    }

    return { ...m, role: "member" };
  });

  const dispatch = useAppDispatch();

  const isLastMember = group.members.length === 1;
  const needsTransfer = isOwner && !isLastMember;

  // Populate available friends when modal opens
  useEffect(() => {
    if (!showAddModal) return;
    const available = (friends as Friend[]).filter(
      (f) => !group.members.some((m) => m._id === f._id),
    );
    setAvailableFriends(available);
  }, [showAddModal, friends, group.members]);

  // Close dropdown on outside click
  const handleClickOutside = useCallback(() => setOpenDropdownId(null), []);

  useEffect(() => {
    if (!openDropdownId) return;
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdownId, handleClickOutside]);

  useEffect(() => {
    const handleGlobalRightClick = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("contextmenu", handleGlobalRightClick);

    return () => {
      document.removeEventListener("contextmenu", handleGlobalRightClick);
    };
  }, [openDropdownId]);

  useEffect(() => {
    setTempName(group.chatName);
  }, [group.chatName]);

  const toggleUserSelection = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    onAddMembers?.(Array.from(selectedUsers));
    setSelectedUsers(new Set());
    setShowAddModal(false);
  };

  const handleProfileSelect = (member: MemberWithRole) => {
    setSelectedProfile(member);
  };

  const handleProfileBack = () => {
    setSelectedProfile(null);
  };

  const handleSaveName = () => {
    const trimmed = tempName.trim();

    if (!trimmed || trimmed === group.chatName) {
      setIsEditingName(false);
      setTempName(group.chatName);
      return;
    }

    dispatch(editGroupName({ chatId: group._id, newName: trimmed }));
    setIsEditingName(false);
  };

  const url = useSignedUrl(group.avatar?.key, group._id);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full text-base-content overflow-hidden bg-base-200">
      {/* ── Main Group Info Panel ── */}
      <div
        className={`
          absolute inset-0 flex flex-col
          transition-transform duration-300 ease-in-out will-change-transform
          ${selectedProfile ? "-translate-x-full" : "translate-x-0"}
        `}
      >
        {/* Scrollable content wrapper */}
        <div className="flex flex-col w-full h-full overflow-y-auto overflow-x-hidden px-3 pb-4">
          {onBack && (
            <div className="absolute top-3 z-51 left-3">
              <IconButton ariaLabel="Go back" onClick={onBack}>
                <ArrowLeft size={20} />
              </IconButton>
            </div>
          )}
          {/* Add Members button */}
          {isAdmin && (
            <div className="absolute right-5 top-1 flex justify-end py-3 shrink-0">
              {/* <div className="w-[45px] h-[45px] bg-base-100 border border-base-content/10 flex items-center justify-center gap-1 px-3 py-1.5 rounded-full hover:bg-green-900/30 cursor-pointer transition-colors text-sm"> */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="bg-base-100 border border-base-content/10 flex items-center justify-center gap-2 px-4 py-2 rounded-full hover:bg-base-content/5 cursor-pointer transition-colors hover:border-base-content/20 text-sm"
              >
                <UserPlus size={20} />
                <span className="font-semibold">Add</span>
              </button>
            </div>
          )}

          {/* Group profile card */}
          <div className={`mt-22 shrink-0`}>
            <div className="flex border border-base-content/10 flex-col items-center text-center bg-base-100 rounded-xl p-4 shadow">
              <GroupAvatarUploader
                value={url}
                canEdit={isOwner || isAdmin}
                temp={false}
                groupId={group._id}
              />
              <div className="mt-3 relative group mb-1 flex items-center justify-center">
                {isEditingName ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-base-100/40 backdrop-blur-sm border border-base-content/10 w-fit mx-auto">
                    <input
                      aria-label="input"
                      autoFocus
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") {
                          setIsEditingName(false);
                          setTempName(group.chatName);
                        }
                      }}
                      className="
                        text-lg font-semibold text-center
                        bg-transparent
                        outline-none
                        min-w-[120px]
                        max-w-[220px]
                        truncate
                      "
                    />

                    {/* Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        aria-label="cancel"
                        onClick={() => {
                          setIsEditingName(false);
                          setTempName(group.chatName);
                        }}
                        className="p-1.5 rounded-full hover:bg-base-content/10 transition cursor-pointer"
                      >
                        <X size={16} />
                      </button>

                      {tempName.trim() !== group.chatName && (
                        <button
                          aria-label="save"
                          onClick={handleSaveName}
                          className="p-1.5 rounded-full hover:bg-base-content/10 transition cursor-pointer"
                        >
                          <Check size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <h2
                    onClick={() => {
                      if (isOwner || isAdmin) setIsEditingName(true);
                    }}
                    className={`text-lg font-semibold transition-all
                      ${isOwner || isAdmin ? "hover:opacity-70 cursor-pointer" : "cursor-default"}
                    `}
                  >
                    {group.chatName}
                  </h2>
                )}

                {/* ✏️ hover hint */}
                {(isOwner || isAdmin) && !isEditingName && (
                  <span className="absolute -right-5 text-xs opacity-0 group-hover:opacity-60 transition">
                    <Edit size={14} />
                  </span>
                )}
              </div>
              <p className="text-sm opacity-70">
                {group.members.length}{" "}
                {group.members.length === 1 ? "member" : "members"}
              </p>
            </div>
          </div>

          {/* Members list */}
          <div className="mt-4 shrink-0">
            <p className="text-[11px] uppercase font-medium opacity-60 tracking-wide px-4">
              {group.members.length}{" "}
              {group.members.length === 1 ? "Member" : "Members"}
            </p>

            <ul className="flex flex-col">
              {membersWithRoles.map((m, index) => (
                <li
                  key={m._id ? `${m._id}-${m.role}` : `member-${index}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProfileSelect(m);
                  }}
                  onContextMenu={(e) => {
                    if (
                      canManageMembers &&
                      m._id !== currentUserId &&
                      m.role !== "owner"
                    ) {
                      e.preventDefault();
                      e.stopPropagation();

                      if (openDropdownId === m._id) {
                        setOpenDropdownId(null);
                        return;
                      }

                      const rect = e.currentTarget.getBoundingClientRect();

                      const menuWidth = 176; // w-44
                      const menuHeight = 140; // approx

                      let offsetX = e.clientX - rect.left;
                      let offsetY = e.clientY - rect.top;

                      // Prevent RIGHT overflow
                      if (offsetX + menuWidth > rect.width) {
                        offsetX = rect.width - menuWidth - 8;
                      }

                      // Prevent LEFT overflow
                      if (offsetX < 8) {
                        offsetX = 8;
                      }

                      // Prevent BOTTOM overflow
                      if (offsetY + menuHeight > rect.height) {
                        offsetY = rect.height - menuHeight - 8;
                      }

                      // Prevent TOP overflow
                      if (offsetY < 8) {
                        offsetY = 8;
                      }

                      setDropdownPos({ x: offsetX, y: offsetY });
                      setOpenDropdownId(m._id);
                    }
                  }}
                  className="hover:bg-base-200 py-1 rounded-md transition-colors cursor-pointer relative"
                >
                  <FriendCard
                    groupMember={{
                      _id: m._id,
                      username: m.username,
                      displayName: m.displayName ?? m.username,
                      profilePicture: m.profilePicture,
                      role: m.role,
                    }}
                    openDropdown={openDropdownId === m._id}
                    msgId={m._id}
                  />

                  {/* Context menu dropdown */}
                  {canManageMembers &&
                    m._id !== currentUserId &&
                    openDropdownId === m._id && (
                      <div
                        style={{
                          position: "absolute",
                          top: dropdownPos.y,
                          left: dropdownPos.x,
                        }}
                        className="bg-base-100 rounded-lg z-[100] w-44 p-2 shadow-xl border border-base-content/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ul className="menu menu-compact w-full p-0">
                          <li key={`remove-${m._id}`}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveMember?.(m._id);
                                setOpenDropdownId(null);
                              }}
                              className="flex justify-between items-center"
                            >
                              <span>Remove User</span>
                              <UserMinus size={16} />
                            </button>
                          </li>

                          {m.role === "member" ? (
                            <li key={`make-admin-${m._id}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMakeAdmin?.(m._id);
                                  setOpenDropdownId(null);
                                }}
                                className="flex justify-between items-center"
                              >
                                <span>Make Admin</span>
                                <Shield size={16} />
                              </button>
                            </li>
                          ) : (
                            <li key={`remove-admin-${m._id}`}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveAdmin?.(m._id);
                                  setOpenDropdownId(null);
                                }}
                                className="flex justify-between items-center"
                              >
                                <span>Remove Admin</span>
                                <ShieldOff size={16} />
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                </li>
              ))}
            </ul>
          </div>
          <div className="py-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowLeaveModal(true);
              }}
              className="w-full cursor-pointer px-6 py-4 rounded-lg flex items-center gap-3 text-red-400 text-sm font-medium hover:bg-base-content/5"
            >
              <LogOut />
              Leave Group
            </button>
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full cursor-pointer px-6 py-4 rounded-lg flex items-center gap-3 text-red-400 text-sm font-medium hover:bg-base-content/5"
              >
                <Trash2 />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile View Panel ── */}
      <div
        className={`
          absolute inset-0
          transition-transform duration-300 ease-in-out will-change-transform
          ${selectedProfile ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="relative h-full w-full overflow-y-auto">
          {selectedProfile && (
            <ProfileView
              onBack={handleProfileBack}
              onMessage
              user={selectedProfile}
            />
          )}
        </div>
      </div>

      <AddMembersModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUsers(new Set());
        }}
        availableFriends={availableFriends}
        selectedUsers={selectedUsers}
        toggleUserSelection={toggleUserSelection}
        handleAddSelected={handleAddSelected}
      />

      {showLeaveModal && (
        <ConfirmModal
          open
          title={
            needsTransfer
              ? "Transfer Ownership Required"
              : isLastMember
                ? `Delete ${group.chatName}?`
                : `Leave ${group.chatName}?`
          }
          confirmText={
            needsTransfer
              ? "Continue"
              : isLastMember
                ? "Delete Group"
                : "Leave Group"
          }
          cancelText="Cancel"
          onCancel={() => setShowLeaveModal(false)}
          onConfirm={() => {
            setShowLeaveModal(false);

            if (needsTransfer) {
              setShowTransferModal(true);
            } else {
              onLeaveGroup?.();
            }
          }}
          description={
            needsTransfer
              ? `You are the owner of this group.
           You must transfer ownership before leaving.`
              : isLastMember
                ? `You are the last member of this group.
           Leaving will permanently delete it.
           You will never be able to rejoin.`
                : `Are you sure you want to leave this group?
           You won't be able to rejoin unless invited again.`
          }
        />
      )}

      {isOwner && showTransferModal && (
        <TransferOwnershipModal
          show={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          members={group.members}
          currentUserId={currentUserId}
          onTransfer={(newOwnerId) => {
            setShowTransferModal(false);
            onTransferOwnership?.(newOwnerId);
            console.log("Transfer to:", newOwnerId);
          }}
        />
      )}

      {showDeleteModal && (
        <ConfirmModal
          open
          title={`Delete ${group.chatName}`}
          confirmText="Delete Group"
          cancelText="No"
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={() => {
            setShowDeleteModal(false);
            onDeleteGroup?.();
          }}
          description={`This will permanently delete "${group.chatName}" for all members. 
          All conversations and shared content will be removed. 
          This action cannot be undone.`}
        />
      )}
    </div>
  );
}
