"use client";

import EmojiPicker, { EmojiClickData, EmojiStyle, Theme } from "emoji-picker-react";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface UniversalEmojiPickerProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  onSelect: (emoji: string) => void;
}

// Stable class name so Messages.tsx closeMenu can check against it
export const UNIVERSAL_PICKER_CLASS = "universal-emoji-picker-container";

export default function UniversalEmojiPicker({
  visible,
  setVisible,
  onSelect,
}: UniversalEmojiPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onSelect(emojiData.emoji);
    setVisible(false);
  };

  // Close only on outside pointerdown
  useEffect(() => {
    if (!visible) return;
    const handle = (e: PointerEvent) => {
      if (pickerRef.current?.contains(e.target as Node)) return;
      setVisible(false);
    };
    // Small delay so the click that opened it doesn't immediately close it
    const id = setTimeout(() => {
      window.addEventListener("pointerdown", handle, { capture: true });
    }, 0);
    return () => {
      clearTimeout(id);
      window.removeEventListener("pointerdown", handle, { capture: true });
    };
  }, [visible, setVisible]);

  // ESC to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    if (visible) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, setVisible]);

  useEffect(() => {
    const preload = new Image();
    preload.src =
      "https://cdn.jsdelivr.net/npm/emoji-datasource-twitter/img/twitter/sheets-256/64.png";
  }, []);

  return (
    <>
      {/* Backdrop — visual only, no pointer events so clicks pass through to our handler */}
      <motion.div
        className="fixed inset-0 bg-black/10 z-[100000]"
        initial={false}
        animate={visible ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{ pointerEvents: "none" }}
      />

      {/* Picker */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-[100001]"
        initial={false}
        animate={
          visible
            ? { opacity: 1, scale: 1, y: 0, pointerEvents: "auto" }
            : { opacity: 0, scale: 0.95, y: 0, pointerEvents: "none" }
        }
        transition={{ type: "spring", stiffness: 310, damping: 25 }}
      >
        <div ref={pickerRef} className={`shadow-2xl ${UNIVERSAL_PICKER_CLASS}`}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            emojiStyle={EmojiStyle.TWITTER}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            autoFocusSearch={false}
            theme={Theme.AUTO}
            width={340}
            height={400}
          />
        </div>
      </motion.div>
    </>
  );
}