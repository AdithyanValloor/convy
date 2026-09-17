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

  const [friendRequestError, setFriendRequestError] = useState(false);

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

  const handleMessage = async () => {
    try {
      const chat = await dispatch(accessChat({ userId: user._id })).unwrap();

      router.push(`/chat/${chat.data._id}`);
    } catch (err) {
      console.error("Failed to access chat", err);
    }
  };

  // --------------------------------------------------
  // Friend status
  // --------------------------------------------------

  const friendStatus: "friend" | "outgoing" | "incoming" | "none" = (() => {
    if (friends.some((f) => f._id === user._id)) {
      return "friend";
    }

    if (outgoing.some((r) => r.to._id === user._id)) {
      return "outgoing";
    }

    if (incoming.some((r) => r.from._id === user._id)) {
      return "incoming";
    }

    return "none";
  })();

  const incomingReq = incoming.find((r) => r.from._id === user._id);

  const outgoingReq = outgoing.find((r) => r.to._id === user._id);

  // --------------------------------------------------
  // Unified action handler
  // --------------------------------------------------

  const performAction = async (
    action: () => Promise<unknown>,
    type: FriendAction,
    after?: () => void,
    onError?: (err: unknown) => void,
  ): Promise<void> => {
    try {
      setPendingAction(type);

      await action();

      after?.();
    } catch (err) {
      console.error(err);
      onError?.(err);
    } finally {
      setPendingAction(null);
    }
  };

  // --------------------------------------------------
  // Date
  // --------------------------------------------------

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  // --------------------------------------------------
  // Friend button
  // --------------------------------------------------

  const renderFriendButton = () => {
    if (friendStatus === "friend") {
      return (
        <IconButton
          ariaLabel="Remove friend"
          onClick={() => setShowRemoveModal(true)}
        >
          <FaUserCheck size={19} />
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
          className="
            bg-red-500/10
            text-red-400
            px-4
            text-sm
            hover:bg-red-500/15
          "
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
            undefined,
            () => setFriendRequestError(true),
          )
        }
      >
        {incomingReq ? <FaUserClock size={18} /> : <FaUserPlus size={18} />}
      </IconButton>
    );
  };

  // --------------------------------------------------
  // Animations
  // --------------------------------------------------

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
    hidden: {
      opacity: 0,
      y: 15,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: "easeOut",
      },
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
      className="
        relative
        flex
        flex-col
        w-full
        h-full
        px-3
        overflow-hidden
        bg-base-200
        text-base-content
      "
    >
      {/* Back */}
      {onBack && (
        <div className="absolute top-3 left-3 z-50">
          <IconButton ariaLabel="Go back" onClick={onBack}>
            <ArrowLeft size={20} />
          </IconButton>
        </div>
      )}

      {/* --------------------------------------------------
          Blocked Overlay
      -------------------------------------------------- */}

      <AnimatePresence>
        {isBlockedByMe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="
              absolute
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-base-200/80
              backdrop-blur-sm
            "
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.9,
                y: 10,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                y: 10,
              }}
              transition={{
                duration: 0.25,
                ease: "easeOut",
              }}
              className="
                w-[90%]
                max-w-sm
                rounded-2xl
                border
                border-base-content/10
                bg-base-100
                p-6
                text-center
                shadow-xl
                flex
                flex-col
                items-center
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500/10
                "
              >
                <MdBlock className="text-red-500" size={34} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-semibold">User Blocked</h3>

                <p className="text-sm text-base-content/70">
                  You blocked{" "}
                  <span className="font-medium text-base-content">
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

      {/* --------------------------------------------------
          Top Actions
      -------------------------------------------------- */}

      {currentUser?._id !== user._id && (
        <div
          className="
            absolute
            top-3
            right-3
            z-20
            flex
            items-center
            gap-1
          "
        >
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
              className="
                menu
                dropdown-content
                z-10
                mt-1
                w-40
                rounded-xl
                border
                border-base-content/10
                bg-base-100
                p-2
                shadow-xl
              "
            >
              <li>
                <button
                  type="button"
                  disabled={blockLoading}
                  onClick={handleBlock}
                  className="
                    text-red-400
                    disabled:opacity-50
                  "
                >
                  {blockLoading
                    ? "..."
                    : isBlockedByMe
                      ? "Unblock User"
                      : "Block User"}
                </button>
              </li>

              <li>
                <a className="text-red-400">Report User</a>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* --------------------------------------------------
          Profile Card
      -------------------------------------------------- */}

      <motion.div variants={itemVariants} className="relative z-10 mt-22">
        <div
          className="
            flex
            items-center
            gap-4
            rounded-2xl
            border
            border-base-content/10
            bg-base-100
            p-4
            shadow-sm
          "
        >
          <ProfilePicture src={url} size="lg" status={status ?? "offline"} />

          <div className="min-w-0 flex-1">
            <h2
              className="
                truncate
                text-lg
                font-semibold
                leading-tight
              "
            >
              {user.displayName || user.username}
            </h2>

            <div
              className="
                mt-0.5
                flex
                items-center
                gap-2
                text-sm
                text-base-content/60
              "
            >
              <p className="select-text">@{user.username}</p>

              {user.pronouns && <span>• {user.pronouns}</span>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* --------------------------------------------------
          Incoming Friend Request
      -------------------------------------------------- */}

      <AnimatePresence>
        {incomingReq && (
          <motion.div
            key="incoming-request"
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{
              duration: 0.25,
            }}
            style={{
              overflow: "hidden",
            }}
            className="
              mt-4
              rounded-2xl
              border
              border-base-content/10
              bg-base-100
              p-4
              shadow-sm
            "
          >
            <p className="text-sm text-base-content/80">
              <span className="font-semibold text-base-content">
                {user.displayName || user.username}
              </span>{" "}
              sent you a friend request.
            </p>

            <div className="mt-3 flex gap-2">
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
                className="
                  
                  px-7
                  text-red-400
                  
                "
                color="bg-red-600 hover:bg-red-500"
              >
                Reject
              </AppButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------
          About
      -------------------------------------------------- */}

      <motion.div
        variants={itemVariants}
        className="
          mt-4
          rounded-2xl
          border
          border-base-content/10
          bg-base-100
          p-4
          shadow-sm
        "
      >
        <p
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-wider
            text-base-content/50
          "
        >
          About
        </p>

        <p
          className="
            mt-1
            select-text
            text-sm
            leading-relaxed
            text-base-content/90
          "
        >
          {user.bio || "Melo user."}
        </p>
      </motion.div>

      {/* --------------------------------------------------
          Member Info
      -------------------------------------------------- */}

      <motion.div
        variants={itemVariants}
        className="
          mt-4
          flex
          items-center
          justify-between
          rounded-2xl
          border
          border-base-content/10
          bg-base-100
          p-4
          shadow-sm
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
            text-xs
            text-base-content/70
          "
        >
          <CalendarDays size={14} />

          <span>Joined {joinedDate}</span>
        </div>

        <span
          className="
            rounded-full
            bg-violet-500/10
            px-2.5
            py-1
            text-[10px]
            font-semibold
            uppercase
            tracking-wider
            text-violet-500
          "
        >
          Member
        </span>
      </motion.div>

      {/* --------------------------------------------------
          Melo Accent
      -------------------------------------------------- */}

      <div
        className="
          absolute
          bottom-0
          left-0
          h-[3px]
          w-full
          bg-[linear-gradient(90deg,#17A6E8_0%,#7029F7_55%,#F73EC9_100%)]
        "
      />

      {/* --------------------------------------------------
          Remove Friend Modal
      -------------------------------------------------- */}

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

      {/* --------------------------------------------------
          Block Confirm Modal
      -------------------------------------------------- */}

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

      <ConfirmModal
        open={friendRequestError}
        title="Couldn't send request"
        description="You cannot send a friend request to this user."
        showCancel={false}
        confirmText="OK"
        onConfirm={() => setFriendRequestError(false)}
      />
      
    </motion.div>
  );
}
