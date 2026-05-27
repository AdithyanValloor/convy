"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, ImageIcon, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import Image from "next/image";

export const ACCEPTED_TYPES = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "application/pdf": ".pdf",
} as const;

export type AcceptedMimeType = keyof typeof ACCEPTED_TYPES;

export interface SelectedFile {
  file: File;
  mimeType: AcceptedMimeType;
  previewUrl?: string;
}

interface AttachmentPickerProps {
  onFileSelect: (selected: SelectedFile) => void;
  onPickerOpen?: () => void;
}

interface StagedFilePreviewProps {
  stagedFile: SelectedFile;
  onRemove: () => void;
}

// ─── Staged file preview ─────────────────────────────────────

export function StagedFilePreview({
  stagedFile,
  onRemove,
}: StagedFilePreviewProps) {
  const label =
    stagedFile.mimeType === "application/pdf"
      ? "PDF"
      : stagedFile.mimeType === "image/png"
      ? "PNG Image"
      : "JPEG Image";

  return (
    <AnimatePresence initial={false}>
      <motion.div
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.22 }}
        className="overflow-hidden"
      >
        <div className="border-b border-base-content/15 bg-base-200 px-4 py-2 flex items-center gap-3">
          {stagedFile.previewUrl ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-base-content/10">
              <Image
                src={stagedFile.previewUrl}
                alt="preview"
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-base-content/8 flex items-center justify-center border border-base-content/10">
              <FileText size={18} className="text-base-content/50" />
            </div>
          )}

          <div className="flex-1 min-w-0 text-base-content/80">
            <p className="text-sm font-medium truncate">
              {stagedFile.file.name}
            </p>
            <p className="text-[11px] opacity-50">
              {label} · {(stagedFile.file.size / 1024).toFixed(0)} KB
            </p>
          </div>

          <button
            aria-label="Remove attachment"
            onClick={onRemove}
            className="opacity-60 hover:opacity-100 cursor-pointer p-1 rounded-full text-base-content flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Attachment Picker ─────────────────────────────────────

export default function AttachmentPicker({
  onFileSelect,
  onPickerOpen,
}: AttachmentPickerProps) {
  const [showMenu, setShowMenu] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (showMenu && buttonRef.current && menuRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current.offsetHeight;

      setPosition({
        top: rect.top - menuHeight - 8,
        left: rect.left,
      });
    }
  }, [showMenu]);

  // ─── Outside click ─────────────────────
  useEffect(() => {
    if (!showMenu) return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  // ─── File picker ─────────────────────
  const openFilePicker = (mode: "image" | "file") => {
    setShowMenu(false);

    if (!fileInputRef.current) return;

    fileInputRef.current.accept =
      mode === "image"
        ? "image/png,image/jpeg"
        : "application/pdf";

    fileInputRef.current.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;
    

    const mimeType = file.type as AcceptedMimeType;
    if (!(mimeType in ACCEPTED_TYPES)) return;

    const previewUrl = mimeType.startsWith("image/")
      ? URL.createObjectURL(file)
      : undefined;

    onFileSelect({ file, mimeType, previewUrl });
  };

  return (
    <>
      {/* Button */}
      <div className="relative flex-shrink-0">
        <button
          ref={buttonRef}
          type="button"
          aria-label="Attach file"
          onClick={() => {
            setShowMenu((prev) => !prev);
            onPickerOpen?.();
          }}
          className={`p-2 rounded-full transition-all duration-200 text-base-content cursor-pointer
            ${
              showMenu
                ? "opacity-100 bg-base-content/10 rotate-45"
                : "opacity-60 hover:opacity-100 hover:bg-base-content/8"
            }`}
        >
          <Paperclip size={19} />
        </button>
      </div>

      {/* Portal Dropdown */}
      {showMenu &&
        createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.92, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 6 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                zIndex: 999999,
              }}
              className="w-44 bg-base-100 border border-base-content/10 rounded-xl shadow-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => openFilePicker("image")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-content/5 text-base-content/80 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ImageIcon size={14} className="text-blue-500" />
                </div>
                Image
                <span className="ml-auto text-[10px] opacity-40">
                  jpg · png
                </span>
              </button>

              <div className="mx-3 h-px bg-base-content/8" />

              <button
                type="button"
                onClick={() => openFilePicker("file")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-base-content/5 text-base-content/80 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <FileText size={14} className="text-amber-500" />
                </div>
                File
                <span className="ml-auto text-[10px] opacity-40">
                  pdf
                </span>
              </button>
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      }

      {/* Hidden Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        aria-label="Upload file"
        className="hidden"
      />
    </>
  );
}