"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { LogOut, ChevronRight, Check, X } from "lucide-react";
import {
  selectIsBlockedByMe,
  useAppDispatch,
  useAppSelector,
} from "@/redux/hooks";
import {
  togglePinLocal,
  togglePin,
  markUnreadLocal,
  markAsUnread,
  markAsRead,
  toggleArchive,
  toggleArchiveLocal,
  clearChat,
  deleteChat,
  deleteChatLocal,
  muteChat,
  unmuteChat,
  muteChatLocal,
} from "@/redux/features/chatSlice";
import { resetUnread } from "@/redux/features/unreadSlice";
import { MdMarkChatRead, MdMarkUnreadChatAlt, MdBlock } from "react-icons/md";
import { usePathname, useRouter } from "next/navigation";
import {
  acceptFriend,
  addFriend,
  cancelFriend,
} from "@/redux/features/friendsSlice";
import { FaUserMinus, FaUserPlus, FaBell, FaBellSlash } from "react-icons/fa6";
import {
  RiChatDeleteFill,
  RiDeleteBin5Fill,
  RiEraserFill,
  RiInboxArchiveFill,
  RiInboxUnarchiveFill,
  RiPushpinFill,
  RiUnpinFill,
} from "react-icons/ri";
import { isChatMuted } from "@/utils/isChatMuted";
import { useIsMobile } from "@/utils/screenSize";
// useIsMobile now initializes synchronously from window.innerWidth,
// so isMobile is correct on the very first render (no flash).

type MuteDuration = "1h" | "8h" | "24h" | "1w" | "forever";

const MUTE_OPTIONS: { label: string; value: MuteDuration }[] = [
  { label: "1 Hour", value: "1h" },
  { label: "8 Hours", value: "8h" },
  { label: "24 Hours", value: "24h" },
  { label: "1 Week", value: "1w" },
  { label: "Until I turn it back on", value: "forever" },
];

interface InboxContextMenuProps {
  x: number;
  y: number;
  position: "top" | "bottom";
  onClose: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  chatId?: string;
  chatType?: "personal" | "group" | "other";
  onRemove?: (userId: string) => void;
  onBlock?: (userId: string, isBlocked: boolean) => void;
  onExitGroup?: (chatId: string) => void;
}

export default function InboxContextMenu({
  x,
  y,
  onClose,
  menuRef,
  position,
  chatType,
  chatId,
  onRemove,
  onExitGroup,
  onBlock,
}: InboxContextMenuProps) {
  const chats = useAppSelector((state) => state.chat.chats);
  const chat = chats.find((c) => c._id === chatId);
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();

  const [showMuteMenu, setShowMuteMenu] = useState(false);

  const targetUser =
    chatType === "personal" && chat
      ? chat.members.find((m) => m._id !== currentUser?._id)
      : null;

  const isBlockedByMe = useAppSelector(
    selectIsBlockedByMe(targetUser?._id ?? ""),
  );
  const isChatOpen = chatId && pathname === `/chat/${chatId}`;
  const isPinned = chat?.isPinned ?? false;
  const isArchived = chat?.isArchived ?? false;
  const chatMuted = chat?._id ? isChatMuted(chat._id) : false;

  const unreadCount = useAppSelector((state) =>
    chatId ? (state.unread.perChat[chatId] ?? 0) : 0,
  );
  const hasUnread = unreadCount > 0;

  const friends = useAppSelector((s) => s.friends.friends);
  const { incoming, outgoing } = useAppSelector((s) => s.friends.requests);

  const friendStatus: "friend" | "outgoing" | "incoming" | "none" = (() => {
    if (!targetUser) return "none";
    if (friends.some((f) => f._id === targetUser._id)) return "friend";
    if (outgoing.some((r) => r.to._id === targetUser._id)) return "outgoing";
    if (incoming.some((r) => r.from._id === targetUser._id)) return "incoming";
    return "none";
  })();

  const incomingReq = incoming.find((r) => r.from._id === targetUser?._id);
  const outgoingReq = outgoing.find((r) => r.to._id === targetUser?._id);

  const menuItems = [
    {
      key: "pin",
      label: isPinned ? "Unpin Chat" : "Pin Chat",
      icon: isPinned ? RiUnpinFill : RiPushpinFill,
    },
    {
      key: "archive",
      label: isArchived ? "Unarchive Chat" : "Archive Chat",
      icon: isArchived ? RiInboxUnarchiveFill : RiInboxArchiveFill,
    },
    ...(!isBlockedByMe
      ? [
          {
            key: hasUnread ? "read" : "unread",
            label: hasUnread ? "Mark as Read" : "Mark as Unread",
            icon: hasUnread ? MdMarkChatRead : MdMarkUnreadChatAlt,
          },
        ]
      : []),

    ...(!isArchived && !isBlockedByMe
      ? [
          chatMuted
            ? { key: "unmute", label: "Unmute Notifications", icon: FaBell }
            : { key: "mute", label: "Mute Notifications", icon: FaBellSlash },
        ]
      : []),
    ...(isChatOpen
      ? [{ key: "close", label: "Close Chat", icon: RiChatDeleteFill }]
      : []),

    { divider: true },

    ...(chatType === "personal" && targetUser && !isBlockedByMe
      ? [
          friendStatus === "friend"
            ? {
                key: "remove",
                label: "Remove Friend",
                icon: FaUserMinus,
                danger: true,
              }
            : friendStatus === "incoming"
              ? { key: "accept", label: "Accept Request", icon: Check }
              : friendStatus === "outgoing"
                ? { key: "cancel", label: "Cancel Request", icon: X }
                : { key: "add", label: "Add Friend", icon: FaUserPlus },
        ]
      : []),
    {
      key: "block",
      label: isBlockedByMe ? "Unblock User" : "Block User",
      icon: MdBlock,
      danger: true,
    },

    ...(chatType === "group"
      ? [{ key: "exit", label: "Exit Group", icon: LogOut, danger: true }]
      : []),

    { key: "clear", label: "Clear Chat", icon: RiEraserFill, danger: true },
    {
      key: "delete",
      label: "Delete Chat",
      icon: RiDeleteBin5Fill,
      danger: true,
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleMuteSelect = (duration: MuteDuration) => {
    if (!chatId) return;
    const optimisticDate =
      duration === "forever"
        ? "9999-12-31T23:59:59.999Z"
        : new Date(
            Date.now() +
              ({ "1h": 3.6e6, "8h": 2.88e7, "24h": 8.64e7, "1w": 6.048e8 }[
                duration
              ] ?? 0),
          ).toISOString();
    dispatch(muteChatLocal({ chatId, mutedUntil: optimisticDate }));
    dispatch(muteChat({ chatId, duration }));
    onClose();
  };

  const handleUnmute = () => {
    if (!chatId) return;
    dispatch(muteChatLocal({ chatId, mutedUntil: null }));
    dispatch(unmuteChat(chatId));
    onClose();
  };

  // Shared action handler to avoid duplication
  const handleAction = (key: string) => {
    if (!chatId) return;

    switch (key) {
      case "pin":
        onClose();
        setTimeout(() => {
          dispatch(togglePinLocal(chatId));
          dispatch(togglePin(chatId));
        }, 120);
        return;
      case "unread":
        dispatch(markUnreadLocal(chatId));
        dispatch(markAsUnread(chatId));
        break;
      case "read":
        dispatch(resetUnread(chatId));
        dispatch(markAsRead(chatId));
        break;
      case "close":
        router.replace("/chat");
        break;
      case "remove":
        if (targetUser) onRemove?.(targetUser._id);
        break;
      case "add":
        if (targetUser) dispatch(addFriend(targetUser.username));
        break;
      case "accept":
        if (incomingReq) dispatch(acceptFriend(incomingReq._id));
        break;
      case "cancel":
        if (outgoingReq) dispatch(cancelFriend(outgoingReq._id));
        break;
      case "archive":
        dispatch(toggleArchiveLocal(chatId));
        dispatch(toggleArchive(chatId));
        if (isPinned) {
          dispatch(togglePinLocal(chatId));
          dispatch(togglePin(chatId));
        }
        break;
      case "exit":
        onExitGroup?.(chatId);
        break;
      case "clear":
        dispatch(clearChat(chatId));
        dispatch(resetUnread(chatId));
        break;
      case "delete":
        dispatch(deleteChatLocal(chatId));
        dispatch(deleteChat(chatId));
        dispatch(resetUnread(chatId));
        if (isChatOpen) router.replace("/chat");
        break;
      case "block":
        if (targetUser) {
          onClose();
          onBlock?.(targetUser._id, isBlockedByMe);
        }
        return;
      case "unmute":
        handleUnmute();
        return;
      case "mute":
        return; // handled separately
      default:
        break;
    }
    onClose();
  };

  // ─── Drag-to-dismiss for mobile bottom sheet ────────────────────────────────
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const DISMISS_THRESHOLD = 80; // px dragged down
  const VELOCITY_THRESHOLD = 0.5; // px/ms
  const dragStartTime = useRef(0);

  const onDragStart = (clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    dragCurrentY.current = clientY;
    dragStartTime.current = Date.now();
    if (sheetRef.current) {
      sheetRef.current.style.transition = "none";
    }
  };

  const onDragMove = (clientY: number) => {
    if (!isDragging.current || !sheetRef.current) return;
    const delta = Math.max(0, clientY - dragStartY.current); // only drag down
    dragCurrentY.current = clientY;
    sheetRef.current.style.transform = `translateY(${delta}px)`;
    // Fade backdrop proportionally
    const backdropEl = sheetRef.current
      .previousElementSibling as HTMLElement | null;
    if (backdropEl) {
      const opacity = Math.max(0, 0.4 - (delta / 300) * 0.4);
      backdropEl.style.opacity = String(opacity);
    }
  };

  const onDragEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    const delta = Math.max(0, dragCurrentY.current - dragStartY.current);
    const elapsed = Date.now() - dragStartTime.current;
    const velocity = delta / Math.max(elapsed, 1);

    if (delta > DISMISS_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
      // Fling out
      sheetRef.current.style.transition =
        "transform 0.26s cubic-bezier(0.32,0.72,0,1)";
      sheetRef.current.style.transform = "translateY(100%)";
      setTimeout(onClose, 240);
    } else {
      // Snap back
      sheetRef.current.style.transition =
        "transform 0.3s cubic-bezier(0.32,0.72,0,1)";
      sheetRef.current.style.transform = "translateY(0)";
      const backdropEl = sheetRef.current
        .previousElementSibling as HTMLElement | null;
      if (backdropEl) {
        backdropEl.style.transition = "opacity 0.3s ease";
        backdropEl.style.opacity = "0.4";
      }
    }
  };

  if (typeof document === "undefined") return null;

  // ─── Mobile: full-width bottom sheet ────────────────────────────────────────
  // isMobile is initialized synchronously from window.innerWidth, so this
  // branch is correct on the very first render — no desktop flash on mobile.
  if (isMobile) {
    return createPortal(
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99998] bg-black/40"
          onClick={onClose}
          onContextMenu={onClose}
        />

        {/* Bottom sheet */}
        <motion.div
          ref={(el) => {
            // Assign to both menuRef and sheetRef
            (menuRef as React.MutableRefObject<HTMLDivElement | null>).current =
              el;
            sheetRef.current = el;
          }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[99999] bg-base-100 border-t border-base-content/10 shadow-2xl rounded-t-2xl"
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 16px)",
            touchAction: "none",
          }}
        >
          {/* Drag handle — touch/pointer events attached here */}
          <div
            className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              onDragStart(e.clientY);
            }}
            onPointerMove={(e) => onDragMove(e.clientY)}
            onPointerUp={() => onDragEnd()}
            onPointerCancel={() => onDragEnd()}
          >
            <div className="w-10 h-1 rounded-full bg-base-content/20" />
          </div>

          <ul className="flex flex-col gap-0.5 px-2 pb-4 pt-1 max-h-[70vh] overflow-y-auto">
            {menuItems.map((item, index) => {
              if ("divider" in item) {
                return (
                  <li key={`divider-${index}`}>
                    <hr className="my-1.5 border-base-content/10" />
                  </li>
                );
              }

              const Icon = item.icon;
              const isMuteItem = item.key === "mute";

              return (
                <li key={item.key}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMuteItem) {
                        setShowMuteMenu((prev) => !prev);
                        return;
                      }
                      handleAction(item.key);
                    }}
                    className={`
                      flex items-center gap-3.5
                      w-full px-3 py-3.5
                      rounded-xl text-[15px] transition-colors duration-150 cursor-pointer text-left
                      ${
                        item.danger
                          ? "text-red-400 hover:bg-red-300/10 active:bg-red-300/15"
                          : "text-base-content hover:bg-base-content/8 active:bg-base-content/12"
                      }
                    `}
                  >
                    <Icon size={20} className="flex-shrink-0 opacity-75" />
                    <span className="opacity-90">{item.label}</span>
                    {isMuteItem && (
                      <ChevronRight
                        size={16}
                        className={`ml-auto opacity-40 transition-transform duration-200 ${showMuteMenu ? "rotate-90" : ""}`}
                      />
                    )}
                  </button>

                  {/* Inline mute duration options */}
                  {isMuteItem && showMuteMenu && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col overflow-hidden pl-4 pb-1"
                    >
                      {MUTE_OPTIONS.map((opt) => (
                        <li key={opt.value}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-base-content/70 hover:bg-base-content/8 active:bg-base-content/12 cursor-pointer"
                            onClick={() => handleMuteSelect(opt.value)}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </li>
              );
            })}
          </ul>
        </motion.div>
      </>,
      document.body,
    );
  }

  // ─── Desktop: floating context menu ─────────────────────────────────────────
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[99998]"
        onClick={onClose}
        onContextMenu={onClose}
      />

      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.96, y: position === "bottom" ? 6 : -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
        className="fixed z-[99999] bg-base-100 border border-base-content/10 shadow-2xl rounded-xl w-52 py-1.5 backdrop-blur-md"
        style={{
          left: x,
          ...(position === "bottom"
            ? { top: y }
            : { bottom: window.innerHeight - y }),
        }}
      >
        <ul className="flex flex-col gap-1">
          {menuItems.map((item, index) => {
            if ("divider" in item) {
              return (
                <li key={`divider-${index}`}>
                  <hr className="my-1 border-base-content/10" />
                </li>
              );
            }

            const Icon = item.icon;
            const isMuteItem = item.key === "mute";
            const isUnmuteItem = item.key === "unmute";

            return (
              <li
                key={item.key}
                className="relative px-1.5"
                onMouseEnter={() => isMuteItem && setShowMuteMenu(true)}
                onMouseLeave={() => isMuteItem && setShowMuteMenu(false)}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.key === "mute") return;
                    handleAction(item.key);
                  }}
                  className={`
                    flex items-center gap-3
                    w-full ${isMuteItem ? "pl-2" : "px-2"} py-2
                    rounded-lg text-sm transition-colors duration-150 cursor-pointer
                    ${
                      item.danger
                        ? "text-red-400 hover:bg-red-300/10"
                        : "text-base-content hover:bg-base-content/10"
                    }
                  `}
                >
                  {isMuteItem ? (
                    <span className="relative flex items-center gap-3 w-full">
                      <FaBellSlash size={18} />
                      <span className="opacity-80">{item.label}</span>
                      <ChevronRight
                        size={18}
                        className="absolute right-0 opacity-50"
                      />
                    </span>
                  ) : (
                    <>
                      <Icon
                        size={18}
                        className={`${item.key === "remove" || item.key === "add" ? "ml-[2px] -mr-[2px]" : ""} flex-shrink-0`}
                      />
                      <span className="opacity-80">{item.label}</span>
                    </>
                  )}
                </button>

                {/* Mute duration submenu */}
                {isMuteItem && showMuteMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, x: -4 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="absolute left-full -top-2 p-1 z-[99999]"
                  >
                    <ul className="flex bg-base-100 flex-col rounded-xl border border-base-content/10 shadow-2xl w-44 p-1.5 gap-1">
                      {MUTE_OPTIONS.map((opt) => (
                        <li key={opt.value}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 rounded-lg cursor-pointer text-sm text-base-content hover:bg-base-content/10"
                            onClick={() => handleMuteSelect(opt.value)}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </li>
            );
          })}
        </ul>
      </motion.div>
    </>,
    document.body,
  );
}
