"use client";

import { MessageType } from "@/redux/features/messageSlice";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { MdAddReaction } from "react-icons/md";
import {
  RiDeleteBin5Fill,
  RiEditFill,
  RiFileCopyFill,
  RiReplyFill,
  RiShareForwardFill,
} from "react-icons/ri";
import { useIsMobile } from "@/utils/screenSize";
import { IconType } from "react-icons/lib";

interface ContextMenuProps {
  contextMenuRef: React.RefObject<HTMLDivElement | null>;
  contextMenu: {
    x: number;
    y: number;
    msg: MessageType | null;
    position: "top" | "bottom";
  };
  isMe: boolean;
  openFullPicker: (msgId: string) => void;
  msg: MessageType;
  handleReply: (msg: MessageType) => void;
  closeContextMenu: () => void;
  setReplyingTo: (msg: MessageType | null) => void;
  setForward: (msg: MessageType | null) => void;
  SetShowForwardModal: () => void;
  onEdit?: (msg: MessageType) => void;
  onDelete?: (msg: MessageType) => void;
  isBlockedByMe: boolean;
}

type MenuItem = {
  label: string;
  icon: IconType;
  action: () => void;
  show: boolean;
  danger?: boolean;
};

export default function ContextMenu({
  contextMenuRef,
  contextMenu,
  isMe,
  openFullPicker,
  msg,
  handleReply,
  closeContextMenu,
  setReplyingTo,
  setForward,
  SetShowForwardModal,
  onEdit,
  onDelete,
  isBlockedByMe,
}: ContextMenuProps) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContextMenu();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeContextMenu]);

  // ─── Drag-to-dismiss ────────────────────────────────────────────────────────
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const dragStartTime = useRef(0);
  const DISMISS_THRESHOLD = 80;
  const VELOCITY_THRESHOLD = 0.5;

  const onDragStart = (clientY: number) => {
    isDragging.current = true;
    dragStartY.current = clientY;
    dragCurrentY.current = clientY;
    dragStartTime.current = Date.now();
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };

  const onDragMove = (clientY: number) => {
    if (!isDragging.current || !sheetRef.current) return;
    const delta = Math.max(0, clientY - dragStartY.current);
    dragCurrentY.current = clientY;
    sheetRef.current.style.transform = `translateY(${delta}px)`;
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
      sheetRef.current.style.transition =
        "transform 0.26s cubic-bezier(0.32,0.72,0,1)";
      sheetRef.current.style.transform = "translateY(100%)";
      setTimeout(closeContextMenu, 240);
    } else {
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

  const menuItems = [
    !isBlockedByMe
      ? [
          {
            label: "React",
            icon: MdAddReaction,
            action: () => {
              openFullPicker(msg._id);
            },
            show: true,
          },
          {
            label: "Reply",
            icon: RiReplyFill,
            action: () => {
              handleReply(msg);
              closeContextMenu();
            },
            show: true,
          },
        ]
      : [],
    {
      label: "Forward",
      icon: RiShareForwardFill,
      action: () => {
        setForward(msg);
        SetShowForwardModal();
        closeContextMenu();
      },
      show: true,
    },
    !isBlockedByMe
      ? [
          {
            label: "Edit",
            icon: RiEditFill,
            action: () => {
              setReplyingTo(null);
              onEdit?.(msg);
              closeContextMenu();
            },
            show: isMe && !msg.forwarded,
          },
        ]
      : [],
    {
      label: "Copy",
      icon: RiFileCopyFill,
      action: () => {
        navigator.clipboard.writeText(msg.content);
        closeContextMenu();
      },
      show: true,
    },
    {
      label: "Delete",
      icon: RiDeleteBin5Fill,
      action: () => {
        onDelete?.(msg);
        closeContextMenu();
      },
      show: isMe,
      danger: true,
    },
  ];
const visibleItems = menuItems.flat().filter((item): item is MenuItem => item.show);

  if (typeof document === "undefined") return null;

  // ─── Mobile: full-width bottom sheet ────────────────────────────────────────
  if (isMobile) {
    return createPortal(
      <AnimatePresence>
        {contextMenu.msg && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[99998] bg-black/40"
              onClick={closeContextMenu}
              onContextMenu={closeContextMenu}
            />

            {/* Bottom sheet */}
            <motion.div
              ref={(el) => {
                (
                  contextMenuRef as React.MutableRefObject<HTMLDivElement | null>
                ).current = el;
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
              {/* Drag handle */}
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

              <ul className="flex flex-col gap-0.5 px-2 pb-4 pt-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        onClick={item.action}
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
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body,
    );
  }

  // ─── Desktop: floating context menu ─────────────────────────────────────────
  return createPortal(
    <AnimatePresence>
      {contextMenu.msg && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[99998]"
            onClick={closeContextMenu}
            onContextMenu={closeContextMenu}
          />

          {/* Menu */}
          <motion.div
            ref={contextMenuRef}
            initial={{
              opacity: 0,
              scale: 0.96,
              y: contextMenu.position === "top" ? 6 : -6,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="fixed z-[99999] bg-base-100 border border-base-content/10 shadow-xl rounded-xl w-48 p-1.5 backdrop-blur-sm"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <ul className="flex flex-col gap-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <button
                      className={`
                        flex items-center justify-between
                        w-full px-3 py-2
                        rounded-lg
                        text-sm
                        transition-colors duration-150
                        cursor-pointer
                        opacity-80
                        ${
                          item.danger
                            ? "text-red-400 hover:bg-red-400/10"
                            : "text-base-content hover:bg-base-content/10"
                        }
                      `}
                      onClick={item.action}
                    >
                      <span>{item.label}</span>
                      <Icon size={18} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
