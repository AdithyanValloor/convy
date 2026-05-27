"use client";

import EmojiPicker, {
  EmojiClickData,
  EmojiStyle,
  Theme,
} from "emoji-picker-react";
import { Keyboard, Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/utils/screenSize";

interface EmojiPickerBoxProps {
  onEmojiClick: (emoji: string) => void;
  setShowPicker: React.Dispatch<React.SetStateAction<boolean>>;
  showPicker: boolean;
  isMobile: boolean;
}

export default function EmojiPickerBox({
  onEmojiClick,
  showPicker,
  setShowPicker,
}: EmojiPickerBoxProps) {
  const isMobile = useIsMobile();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

  // ─── Desktop: position calculation ─────────────────────────────────────────
  useEffect(() => {
    if (!showPicker || !buttonRef.current || isMobile) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const pickerWidth = 350;
    const pickerHeight = 450;
    const gap = 8;

    let top = rect.top - pickerHeight - gap;
    let left = rect.right - pickerWidth;

    if (top < 8) top = rect.bottom + gap;
    if (left < 8) left = 8;
    if (left + pickerWidth > window.innerWidth - 8)
      left = window.innerWidth - pickerWidth - 8;

    setPickerPos({ top, left });
  }, [showPicker, isMobile]);

  // ─── Desktop: close on outside click ───────────────────────────────────────
  useEffect(() => {
    if (!showPicker || isMobile) return;
    const handle = (e: MouseEvent) => {
      if (
        pickerRef.current?.contains(e.target as Node) ||
        buttonRef.current?.contains(e.target as Node)
      )
        return;
      setShowPicker(false);
    };
    window.addEventListener("mousedown", handle, { capture: true });
    return () =>
      window.removeEventListener("mousedown", handle, { capture: true });
  }, [showPicker, setShowPicker, isMobile]);

  // ─── Shared: close on Escape ────────────────────────────────────────────────
  useEffect(() => {
    if (!showPicker) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPicker(false);
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [showPicker, setShowPicker]);

  // ─── Mobile drag-to-dismiss ─────────────────────────────────────────────────
  const dragStartY = useRef(0);
  const dragCurrentY = useRef(0);
  const isDragging = useRef(false);
  const dragStartTime = useRef(0);
  const DISMISS_THRESHOLD = 60;
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
      setTimeout(() => setShowPicker(false), 240);
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

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onEmojiClick(emojiData.emoji);
  };

  if (typeof window === "undefined") return null;

  return (
    <div className="emoji-picker-container">
      <button
        ref={buttonRef}
        title="Emojis"
        type="button"
        className="p-2 text-base-content rounded-full opacity-80 hover:scale-110 cursor-pointer transition"
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker((prev) => !prev);
        }}
      >
        {showPicker && isMobile ? <Keyboard size={20} /> : <Smile size={20} />}
      </button>
      {/* ─── Mobile: bottom sheet ─────────────────────────────────────────────── */}
      {isMobile
        ? createPortal(
            <motion.div
              ref={sheetRef}
              initial={false}
              animate={{ y: showPicker ? 0 : "100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-0 left-0 right-0 z-[99999] bg-base-100 border-t border-base-content/10 shadow-2xl rounded-t-2xl overflow-hidden"
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
                touchAction: "none",
                pointerEvents: showPicker ? "auto" : "none",
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

              <EmojiPicker
                emojiStyle={EmojiStyle.TWITTER}
                onEmojiClick={handleEmojiClick}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                autoFocusSearch={false}
                theme={Theme.AUTO}
                width="100%"
                height={350}
                style={{ border: "none", borderRadius: 0, boxShadow: "none" }}
              />
            </motion.div>,
            document.body,
          )
        : /* ─── Desktop: floating picker ──────────────────────────────────────── */
          createPortal(
            <div
              ref={pickerRef}
              className="fixed z-[99999]"
              style={{
                top: pickerPos.top,
                left: pickerPos.left,
                opacity: showPicker ? 1 : 0,
                pointerEvents: showPicker ? "auto" : "none",
                transform: showPicker
                  ? "scale(1) translateY(0)"
                  : "scale(0.95) translateY(8px)",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
            >
              <EmojiPicker
                emojiStyle={EmojiStyle.TWITTER}
                onEmojiClick={handleEmojiClick}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                theme={Theme.AUTO}
                width={350}
                height={450}
              />
            </div>,
            document.body,
          )}
    </div>
  );
}
