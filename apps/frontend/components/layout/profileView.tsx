"use client";

import {
  ArrowLeft,
  CalendarDays,
  EllipsisVertical,
  MessageCircle,
} from "lucide-react";
import { FaUserCheck, FaUserClock, FaUserPlus } from "react-icons/fa6";
import { useState } from "react";

import ProfilePicture from "../ProfilePicture/ProfilePicture";
import IconButton from "../GlobalComponents/IconButtons";

import {
  selectIsBlocked,
  selectIsBlockedByMe,
  selectUserStatus,
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import {
  addFriend,
  removeFriend,
  cancelFriend,
  acceptFriend,
  rejectFriend,
  FriendRequest,
  addFriendFromSocket,
} from "@/redux/features/friendsSlice";
import ConfirmModal from "../GlobalComponents/ConfirmModal";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { blockUser, unblockUser } from "@/redux/features/blockSlice";
import { RootState } from "@/redux/store";
import { MdBlock } from "react-icons/md";
import AppButton from "../GlobalComponents/AppButton";
import { accessChat } from "@/redux/features/chatSlice";
import { useRouter } from "next/navigation";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface ProfileViewProps {
  user: {
    _id: string;
    username: string;
    displayName?: string;
    profilePicture?: { key: string | null };
    createdAt?: string;
    bio?: string;
    pronouns?: string;
  };
  onBack?: () => void;
  onMessage?: boolean;
}

type FriendAction = "add" | "remove" | "accept" | "reject" | "cancel" | null;

export default function ProfileView({
  user,
  onBack,
  onMessage,
}: ProfileViewProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const currentUser = useAppSelector((state) => state.auth.user);
  const friends = useAppSelector((state) => state.friends.friends);
  const { incoming, outgoing } = useAppSelector(
    (state) => state.friends.requests,
  );

  const [pendingAction, setPendingAction] = useState<FriendAction>(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const isLoading = (action: FriendAction) => pendingAction === action;

  const status = useAppSelector(selectUserStatus(user._id ?? ""));

  const isBlockedByMe = useAppSelector((state: RootState) =>
    state.block.blockedUsers.some((u) => u._id === user._id),
  );

  const url = useSignedUrl(user.profilePicture?.key) || "";

  const isBlocked = useAppSelector(
    (state: RootState) =>
      state.block.blockedUsers.some((u) => u._id === user._id) ||
      state.block.blockedByUsers.includes(user._id),
  );

  const blockLoading = useAppSelector(
    (state: RootState) => state.block.actionLoading,
  );

  const handleBlock = () => {
    if (blockLoading) return;
    setShowBlockModal(true);
  };

  const confirmBlock = () => {
    if (isBlockedByMe) {
      dispatch(unblockUser(user._id));
    } else {
      dispatch(blockUser(user._id));
    }
    setShowBlockModal(false);
  };

  // In ProfileView — handle the message button click
  const handleMessage = async () => {
    try {
      const chat = await dispatch(accessChat({ userId: user._id })).unwrap();
      router.push(`/chat/${chat.data._id}`);
    } catch (err) {
      console.error("Failed to access chat", err);
    }
  };

  // --------------------------------------------------
  // Derived friend status (single source of truth)
  // --------------------------------------------------
  const friendStatus: "friend" | "outgoing" | "incoming" | "none" = (() => {
    if (friends.some((f) => f._id === user._id)) return "friend";
    if (outgoing.some((r) => r.to._id === user._id)) return "outgoing";
    if (incoming.some((r) => r.from._id === user._id)) return "incoming";
    return "none";
  })();

  const incomingReq = incoming.find((r) => r.from._id === user._id);
  const outgoingReq = outgoing.find((r) => r.to._id === user._id);

  // --------------------------------------------------
  // Unified action handler
  // --------------------------------------------------
  const performAction = async (
    action: () => Promise<FriendRequest | string>,
    type: FriendAction,
    after?: () => void,
  ): Promise<void> => {
    try {
      setPendingAction(type);

      await action();

      after?.();
    } catch (err) {
      console.error(err);
    } finally {
      setPendingAction(null);
    }
  };

  // --------------------------------------------------
  // Date formatting
  // --------------------------------------------------
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  // --------------------------------------------------
  // Friend button renderer
  // --------------------------------------------------
  const renderFriendButton = () => {
    if (friendStatus === "friend") {
      return (
        <IconButton
          ariaLabel="Remove friend"
          onClick={() => setShowRemoveModal(true)}
        >
          <FaUserCheck size={20} />
        </IconButton>
      );
    }

    if (friendStatus === "outgoing" && outgoingReq) {
      return (
        <IconButton
          ariaLabel="Cancel request"
          disabled={isLoading("cancel")}
          onClick={() =>
            performAction(
              () => dispatch(cancelFriend(outgoingReq._id)).unwrap(),
              "cancel",
            )
          }
          className="bg-base-100 px-5 text-sm text-red-500"
        >
          Cancel Request
        </IconButton>
      );
    }

    return (
      <IconButton
        ariaLabel="Add friend"
        disabled={!!incomingReq || isLoading("add")}
        onClick={() =>
          performAction(
            () => dispatch(addFriend(user.username)).unwrap(),
            "add",
          )
        }
      >
        {incomingReq ? <FaUserClock size={18} /> : <FaUserPlus size={18} />}
      </IconButton>
    );
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.25, ease: "easeOut" },
    },
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="relative flex flex-col text-base-content w-full h-full px-3 bg-base-200 overflow-hidden"
    >
      {onBack && (
        <div className="absolute top-3 z-51 left-3">
          <IconButton ariaLabel="Go back" onClick={onBack}>
            <ArrowLeft size={20} />
          </IconButton>
        </div>
      )}

      <AnimatePresence>
        {isBlockedByMe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-base-200/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-base-100 border border-base-content/10 rounded-2xl shadow-lg p-6 w-[90%] max-w-sm text-center flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <MdBlock className="text-red-500" size={36} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold text-base-content">
                  User Blocked
                </h3>
                <p className="text-sm text-base-content/70">
                  You blocked{" "}
                  <span className="font-medium">
                    {user.displayName || user.username}
                  </span>
                  . You won&apos;t receive messages or friend requests from
                  them.
                </p>
              </div>

              <AppButton onClick={() => dispatch(unblockUser(user._id))}>
                Unblock User
              </AppButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentUser?._id !== user._id && (
        <div className="absolute top-3 right-3 flex items-center gap-1">
          {!isBlocked && onMessage && (
            <IconButton ariaLabel="Send message" onClick={handleMessage}>
              <MessageCircle size={20} />
            </IconButton>
          )}

          {renderFriendButton()}

          <div className="dropdown dropdown-end">
            <IconButton ariaLabel="More actions" tabIndex={0}>
              <EllipsisVertical size={20} />
            </IconButton>

            <ul
              tabIndex={0}
              className="menu dropdown-content mt-1 bg-base-100 rounded-xl z-10 w-36 p-2 shadow border border-base-content/10"
            >
              <li>
                <button
                  type="button"
                  disabled={blockLoading}
                  onClick={handleBlock}
                  className="text-red-500 disabled:opacity-50"
                >
                  {blockLoading
                    ? "..."
                    : isBlockedByMe
                      ? "Unblock User"
                      : "Block User"}
                </button>
              </li>
              <li>
                <a className="text-red-500">Report User</a>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <motion.div variants={itemVariants} className="relative mt-22 z-10">
        <div className="flex items-center gap-4 bg-base-100 border border-base-content/10 rounded-xl p-4 shadow">
          <ProfilePicture src={url} size="lg" status={status ?? "offline"} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold leading-tight">
              {user.displayName || user.username}
            </h2>
            <div className="flex items-center gap-2 text-sm opacity-70">
              <p className="select-text">@{user.username}</p>
              {user.pronouns && <span>• {user.pronouns}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Incoming Request Banner */}
      <AnimatePresence>
        {incomingReq && (
          <motion.div
            key="incoming-request"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
            className="mt-4 bg-base-100 rounded-2xl border border-base-content/10 shadow p-4"
          >
            <p className="text-sm text-base-content/80">
              <span className="font-semibold text-base-content">
                {user.displayName || user.username}
              </span>{" "}
              sent you a friend request.
            </p>

            <div className="flex gap-2 mt-3">
              <AppButton
                isLoading={isLoading("accept")}
                onClick={() =>
                  performAction(
                    () => dispatch(acceptFriend(incomingReq._id)).unwrap(),
                    "accept",
                  )
                }
                className="px-7"
              >
                Accept
              </AppButton>

              <AppButton
                isLoading={isLoading("reject")}
                onClick={() =>
                  performAction(
                    () => dispatch(rejectFriend(incomingReq._id)).unwrap(),
                    "reject",
                  )
                }
                className="bg-red-900 px-7"
              >
                Reject
              </AppButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* About */}
      <motion.div
        variants={itemVariants}
        className="mt-4 bg-base-100 rounded-xl border border-base-content/10 shadow p-4"
      >
        <p className="text-[11px] uppercase font-medium opacity-60 tracking-wide">
          About
        </p>
        <p className="select-text text-sm mt-1 leading-relaxed">
          {user.bio || "Whisp user."}
        </p>
      </motion.div>

      {/* Member Info */}
      <motion.div
        variants={itemVariants}
        className="mt-5 flex items-center border border-base-content/10 justify-between bg-base-100 rounded-xl p-4"
      >
        <div className="flex items-center gap-2 text-xs opacity-80">
          <CalendarDays size={14} />
          <span>Joined {joinedDate}</span>
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-900">
          Member
        </span>
      </motion.div>

      {/* Accent Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-cyan-900" />

      {/* Remove Friend Modal */}
      {showRemoveModal && (
        <ConfirmModal
          open
          title={`Remove ${user.displayName || user.username}`}
          description="Are you sure you want to remove this user from your friends?"
          confirmText="Remove"
          confirmLoading={isLoading("remove")}
          onCancel={() => setShowRemoveModal(false)}
          onConfirm={() =>
            performAction(
              () => dispatch(removeFriend(user._id)).unwrap(),
              "remove",
              () => setShowRemoveModal(false),
            )
          }
        />
      )}

      {/* Block confirm Modal */}
      {showBlockModal && (
        <ConfirmModal
          open
          title={
            isBlockedByMe
              ? `Unblock ${user.displayName || user.username}`
              : `Block ${user.displayName || user.username}`
          }
          description={
            isBlockedByMe
              ? "Are you sure you want to unblock this user?"
              : "Are you sure you want to block this user? They will be removed from your friends."
          }
          confirmText={isBlockedByMe ? "Unblock" : "Block"}
          confirmLoading={blockLoading}
          onCancel={() => setShowBlockModal(false)}
          onConfirm={confirmBlock}
        />
      )}
    </motion.div>
  );
}
