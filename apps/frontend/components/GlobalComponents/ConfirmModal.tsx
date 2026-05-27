"use client";

import { ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmModalProps {
  id?: string;
  open?: boolean;
  title: ReactNode;
  description?: ReactNode;
  onCancel?: () => void;
  onConfirm: () => void;
  confirmText?: React.ReactNode;
  cancelText?: string;
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
}

export default function ConfirmModal({
  id,
  open,
  title,
  description,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmLoading = false,
  confirmDisabled = false,
}: ConfirmModalProps) {

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 px-4 flex text-base-content items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
            }}
            className="relative z-10 bg-base-200 rounded-2xl max-w-sm w-full p-6 border border-base-content/10 shadow-xl"
          >
            <h3 className="font-bold text-lg">{title}</h3>

            {description && (
              <p className="pt-2 text-sm opacity-60">{description}</p>
            )}

            <div className="mt-6 flex gap-2">
              <button
                onClick={onCancel}
                className="w-full p-2 cursor-pointer rounded-xl bg-base-300 hover:bg-base-300/50 transition"
              >
                {cancelText}
              </button>

              <button
                disabled={confirmDisabled || confirmLoading}
                onClick={onConfirm}
                className="w-full p-2 cursor-pointer rounded-xl bg-red-900 text-white hover:bg-red-900/80 disabled:opacity-60 transition"
              >
                {confirmLoading ? <span className="loading loading-dots loading-lg"></span> : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}