import ProfilePicture from "../ProfilePicture/ProfilePicture";
import defaultPFP from "@/public/default-pfp.png";
import groupDefaultPFP from "@/public/default-group-icon.png";
import {
  selectChatHasMention,
  selectMessagesByChat,
} from "@/redux/selectors/messageSelectors";
import {
  selectUserStatus,
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import {
  AtSign,
  Check,
  CheckCheck,
  Crown,
  Shield,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import InboxContextMenu from "../inbox/components/InboxContextMenu";
import { removeFriend } from "@/redux/features/friendsSlice";
import ConfirmModal from "../GlobalComponents/ConfirmModal";
import { MdBlock } from "react-icons/md";
import {
  leaveGroup,
  deleteGroup,
  transferOwnership,
} from "@/redux/features/chatSlice";
import TransferOwnershipModal from "../chat/TransferOwnershipModal";
import { blockUser, unblockUser } from "@/redux/features/blockSlice";
import { RootState } from "@/redux/store";
import { RiPushpinFill } from "react-icons/ri";
import { FaBellSlash } from "react-icons/fa6";
import { isChatMuted } from "@/utils/isChatMuted";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { getLastMessagePreview } from "@/utils/lastMessagePreview";

// ---------------------------------------------------------------------------
// Types (unchanged)
// ---------------------------------------------------------------------------

interface UserType {
  _id?: string;
  name: string;
  displayName?: string;
  profilePicture?: { key: string | null } | null;
  lastMessage?: string;
  status?: "online" | "offline";
}

interface ContextMenuState {
  x: number;
  y: number;
  chatId: string;
  position: "top" | "bottom";
}

interface GroupMemberType {
  _id: string;
  username: string;
  displayName: string;
  profilePicture?: { key: string | null };
  role?: "owner" | "admin" | "member";
}

interface BaseFriendCardProps {
  user?: UserType;
  groupMember?: GroupMemberType;
  msgId: string;
  selectedChat?: string;
  unread?: number;
  rightSlot?: React.ReactNode;
  hideLastMessage?: boolean;
  forceActive?: boolean;
  onClick?: () => void;
  ClassName?: string;
  openDropdown?: boolean;
  modal?: boolean;
}

interface InboxFriendCardProps extends BaseFriendCardProps {
  ifInbox?: true;
  chatType: "personal" | "group" | "other";
  activeContextMenuChatId?: string | null;
  contextMenuRef?: React.RefObject<HTMLDivElement | null>;
  onContextMenuOpen?: (state: ContextMenuState) => void;
  onContextMenuClose?: () => void;
  contextMenuPos?: { x: number; y: number; position: "top" | "bottom" } | null;
}

interface NonInboxFriendCardProps extends BaseFriendCardProps {
  ifInbox?: false;
  chatType?: never;
}

type FriendCardProps = InboxFriendCardProps | NonInboxFriendCardProps;

// ---------------------------------------------------------------------------
// Role badge (extracted for clarity)
// ---------------------------------------------------------------------------

function RoleBadge({ role }: { role: "owner" | "admin" | "member" }) {
  const config = {
    owner: {
      Icon: Crown,
      styles: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    },
    admin: {
      Icon: Shield,
      styles: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    },
    member: {
      Icon: UserRound,
      styles: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    },
  }[role];

  const label = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold
        rounded-full border transition-all duration-200 ${config.styles}`}
    >
      <config.Icon size={11} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function FriendCard(props: FriendCardProps) {
  const {
    msgId,
    selectedChat,
    onClick,
    unread = 0,
    rightSlot,
    hideLastMessage,
    forceActive,
    ClassName,
    openDropdown,
    modal,
  } = props;

  const chats = useAppSelector((state) => state.chat.chats);
  const chat = chats.find((c) => c._id === msgId);
  const chatMuted = chat?._id ? isChatMuted(chat._id) : false;
  const hasMention = useAppSelector(selectChatHasMention(msgId));
  const isPinned = chat?.isPinned ?? false;

  const isInbox = props.ifInbox === true;
  const activeContextMenuChatId = isInbox
    ? props.activeContextMenuChatId
    : undefined;
  const contextMenuRef = isInbox ? props.contextMenuRef : undefined;
  const onContextMenuOpen = isInbox ? props.onContextMenuOpen : undefined;
  const onContextMenuClose = isInbox ? props.onContextMenuClose : undefined;
  const contextMenuPos = isInbox ? props.contextMenuPos : undefined;
  const chatType = isInbox ? props.chatType : undefined;

  const currentUser = useAppSelector((s) => s.auth.user);
  const currentUserId = currentUser?._id;

  const targetUser =
    chatType === "personal" && chat
      ? chat.members.find((m) => m._id !== currentUserId)
      : null;

  const typingUsers = useAppSelector((s) => s.typing.byChat[msgId] ?? {});
  const dispatch = useAppDispatch();
  const isMenuOpen = activeContextMenuChatId === msgId;

  // Modal state
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [exitChatId, setExitChatId] = useState<string | null>(null);
  const [blockTarget, setBlockTarget] = useState<{
    userId: string;
    isBlocked: boolean;
  } | null>(null);

  // Normalise user data from either prop shape
  const isGroupMemberCard = !!props.groupMember;

  const defaultPFPToUse = chatType === "group" ? groupDefaultPFP : defaultPFP;

  const key = isGroupMemberCard
    ? props.groupMember?.profilePicture?.key
    : props.user?.profilePicture?.key;

  const url = useSignedUrl(key, msgId);

  const userData = isGroupMemberCard
    ? {
        _id: props.groupMember!._id,
        name: props.groupMember!.username,
        displayName: props.groupMember!.displayName,
        profilePic: url ? url : defaultPFPToUse
      }
    : {
        _id: props.user!._id,
        name: props.user!.name,
        displayName: props.user!.displayName,
        profilePic: url ? url : defaultPFPToUse
      };

  const status = useAppSelector(selectUserStatus(userData._id ?? ""));

  const isBlockedByMe = useAppSelector((state: RootState) => {
    if (chat?.isGroup) return false;
    const other = chat?.members.find((m) => m._id !== currentUser?._id);
    if (!other) return false;
    return state.block.blockedUsers.some((u) => u._id === other._id);
  });

  // Context-menu open handler (logic unchanged)
  const openContextMenu = (e: React.MouseEvent) => {
    if (!isInbox || !onContextMenuOpen) return;
    e.preventDefault();
    e.stopPropagation();

    if (isMenuOpen) {
      onContextMenuClose?.();
      return;
    }

    const menuWidth = 192;
    const menuHeight = 260;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = e.clientX;
    let y = e.clientY;
    let position: "top" | "bottom" = "bottom";

    if (x + menuWidth > vw) x = vw - menuWidth - 10;
    if (x < 10) x = 10;

    if (vh - y < menuHeight && y > vh - y) {
      position = "top";
    } else if (y + menuHeight > vh) {
      y = vh - menuHeight - 10;
    }

    onContextMenuOpen({ x, y, chatId: msgId, position });
  };

  // Last message + time
  const messages = useAppSelector((state) =>
    selectMessagesByChat(state, msgId),
  );

  const { lastMessageText, lastMessageTime } = useMemo(() => {
    const lastMsg = messages.at(-1);
    if (!lastMsg?.sender)
      return { lastMessageText: "No messages yet", lastMessageTime: "" };

    const text = getLastMessagePreview(lastMsg);

    const msgDate = new Date(lastMsg.createdAt);
    const diffH = (Date.now() - msgDate.getTime()) / 36e5;

    const timeStr =
      diffH < 24
        ? msgDate.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        : diffH < 168
          ? msgDate.toLocaleDateString([], { weekday: "short" })
          : msgDate.toLocaleDateString([], { month: "short", day: "numeric" });

    return { lastMessageText: text, lastMessageTime: timeStr };
  }, [messages]);

  const lastMsg = messages.at(-1);
  const isMyMessage = lastMsg?.sender._id === currentUserId;
  const ifSeen = lastMsg?.seenBy && lastMsg.seenBy.length > 0;
  const ifDelivered = lastMsg?.deliveredTo && lastMsg.deliveredTo.length > 0;

  const typingUserIds = Object.keys(typingUsers);
  const isChatTyping =
    typingUserIds.filter((id) => id !== currentUserId).length > 0;
  const isMemberTyping = isGroupMemberCard
    ? typingUserIds.includes(userData._id ?? "")
    : false;

  // Derived active state
  const isActive =
    forceActive || msgId === selectedChat || isMenuOpen || openDropdown;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div
        onContextMenu={openContextMenu}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-right-slot]")) return;
          onClick?.();
        }}
        className={`
          cursor-pointer w-full px-2 py-2.5 rounded-xl flex items-center gap-3
          transition-colors duration-150
          ${isBlockedByMe ? "opacity-50" : ""}
          ${isActive ? "bg-base-content/5" : "hover:bg-base-content/5"}
          ${ClassName ?? ""}
        `}
      >
        {/* Avatar */}
        <ProfilePicture
          src={userData.profilePic}
          status={status}
          size="sm"
          showStatus={chatType !== "group"}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Top row: name + time / badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold truncate text-base-content/90 flex-1">
              {userData.displayName || userData.name}{" "}
              {isGroupMemberCard &&
                userData._id === currentUser?._id &&
                "( You )"}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Mute / pin indicators */}
              {!hideLastMessage && !isBlockedByMe && chatMuted && (
                <FaBellSlash size={11} className="text-base-content/40" />
              )}
              {!hideLastMessage && isPinned && (
                <RiPushpinFill size={11} className="text-base-content/40" />
              )}

              {/* Timestamp */}
              {!modal &&
                lastMessageTime &&
                !isBlockedByMe &&
                !hideLastMessage && (
                  <span
                    className={`text-[11px] font-medium tabular-nums ${
                      unread ? "text-green-500" : "text-base-content/40"
                    }`}
                  >
                    {lastMessageTime}
                  </span>
                )}

              {/* Role badge (group member cards) */}
              {isGroupMemberCard && props.groupMember?.role && (
                <RoleBadge role={props.groupMember.role} />
              )}
            </div>
          </div>

          {/* Bottom row: last message / typing + status icons + unread */}
          {!hideLastMessage && (
            <div className="flex items-center justify-between gap-2 mt-0.5">
              {/* Left: preview text or typing dots */}
              <span className="flex-1 min-w-0 truncate text-xs text-base-content/50">
                {isGroupMemberCard ? (
                  isMemberTyping ? (
                    <span className="loading loading-dots loading-xs opacity-50" />
                  ) : null
                ) : isChatTyping ? (
                  <span className="loading loading-dots loading-xs opacity-50" />
                ) : rightSlot ? null : isBlockedByMe ? (
                  "Blocked user"
                ) : (
                  lastMessageText
                )}
              </span>

              {/* Right: delivery / mention / unread */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Seen / delivered tick */}
                {!isBlockedByMe &&
                  !isGroupMemberCard &&
                  !isChatTyping &&
                  isMyMessage &&
                  (ifSeen ? (
                    <CheckCheck
                      size={12}
                      strokeWidth={3}
                      className="text-blue-400"
                    />
                  ) : ifDelivered ? (
                    <Check
                      size={12}
                      strokeWidth={3}
                      className="text-base-content/50"
                    />
                  ) : null)}

                {/* Mention */}
                {hasMention && !isGroupMemberCard && (
                  <AtSign
                    size={13}
                    strokeWidth={3}
                    className="text-green-500"
                  />
                )}

                {/* Unread badge */}
                {unread > 0 && (
                  <span
                    className="bg-green-600 text-base-300 text-[10px] font-extrabold
                      min-w-[18px] h-[18px] px-1 rounded-full
                      flex items-center justify-center"
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right slot */}
        {rightSlot && (
          <div className="shrink-0" data-right-slot>
            {rightSlot}
          </div>
        )}

        {/* Blocked indicator */}
        {isBlockedByMe && (
          <span className="shrink-0 p-1 rounded-full bg-red-500/10">
            <MdBlock className="text-red-500" size={12} />
          </span>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Context menu                                                        */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {isMenuOpen && isInbox && contextMenuRef && contextMenuPos && (
          <InboxContextMenu
            x={contextMenuPos.x}
            y={contextMenuPos.y}
            position={contextMenuPos.position}
            onClose={() => onContextMenuClose?.()}
            menuRef={contextMenuRef}
            chatId={msgId}
            chatType={chatType}
            onRemove={(userId) => setRemoveUserId(userId)}
            onBlock={(userId, isBlocked) =>
              setBlockTarget({ userId, isBlocked })
            }
            onExitGroup={(chatId) => {
              setExitChatId(chatId);
              setShowLeaveModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Remove friend modal                                                 */}
      {/* ------------------------------------------------------------------ */}
      {removeUserId && targetUser && (
        <ConfirmModal
          open
          title={`Remove ${targetUser.displayName || targetUser.username}`}
          description={`Are you sure you want to remove ${
            targetUser.displayName || targetUser.username
          } from your friends?`}
          confirmText="Remove"
          onCancel={() => setRemoveUserId(null)}
          onConfirm={() => {
            dispatch(removeFriend(removeUserId));
            setRemoveUserId(null);
          }}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Leave / delete / transfer group modals                             */}
      {/* ------------------------------------------------------------------ */}
      {exitChatId &&
        (() => {
          const ec = chats.find((c) => c._id === exitChatId);
          const ecIsOwner = ec?.createdBy?._id === currentUserId;
          const ecIsLast = (ec?.members?.length ?? 0) === 1;
          const ecNeedsTransfer = ecIsOwner && !ecIsLast;

          return (
            <>
              {showLeaveModal && (
                <ConfirmModal
                  open
                  title={
                    ecNeedsTransfer
                      ? "Transfer Ownership Required"
                      : ecIsLast
                        ? `Delete ${ec?.chatName}?`
                        : `Leave ${ec?.chatName}?`
                  }
                  confirmText={
                    ecNeedsTransfer
                      ? "Continue"
                      : ecIsLast
                        ? "Delete Group"
                        : "Leave Group"
                  }
                  cancelText="Cancel"
                  description={
                    ecNeedsTransfer
                      ? "You are the owner of this group. You must transfer ownership before leaving."
                      : ecIsLast
                        ? "You are the last member. Leaving will permanently delete this group."
                        : "Are you sure you want to leave? You won't be able to rejoin unless invited."
                  }
                  onCancel={() => {
                    setShowLeaveModal(false);
                    setExitChatId(null);
                  }}
                  onConfirm={() => {
                    setShowLeaveModal(false);
                    if (ecNeedsTransfer) {
                      setShowTransferModal(true);
                    } else if (ecIsLast) {
                      dispatch(deleteGroup({ chatId: exitChatId }));
                      setExitChatId(null);
                    } else {
                      dispatch(leaveGroup({ chatId: exitChatId }));
                      setExitChatId(null);
                    }
                  }}
                />
              )}
              {showTransferModal && (
                <TransferOwnershipModal
                  show={showTransferModal}
                  onClose={() => {
                    setShowTransferModal(false);
                    setExitChatId(null);
                  }}
                  members={ec?.members ?? []}
                  currentUserId={currentUserId ?? ""}
                  onTransfer={async (newOwnerId) => {
                    await dispatch(
                      transferOwnership({ chatId: exitChatId, newOwnerId }),
                    );
                    dispatch(leaveGroup({ chatId: exitChatId }));
                    setShowTransferModal(false);
                    setExitChatId(null);
                  }}
                />
              )}
            </>
          );
        })()}

      {/* ------------------------------------------------------------------ */}
      {/* Block / unblock modal                                               */}
      {/* ------------------------------------------------------------------ */}
      {blockTarget && (
        <ConfirmModal
          open
          title={blockTarget.isBlocked ? "Unblock User" : "Block User"}
          description={
            blockTarget.isBlocked
              ? "Are you sure you want to unblock this user?"
              : "Are you sure you want to block this user? They will be removed from your friends."
          }
          confirmText={blockTarget.isBlocked ? "Unblock" : "Block"}
          onCancel={() => setBlockTarget(null)}
          onConfirm={() => {
            dispatch(
              blockTarget.isBlocked
                ? unblockUser(blockTarget.userId)
                : blockUser(blockTarget.userId),
            );
            setBlockTarget(null);
          }}
        />
      )}
    </>
  );
}
