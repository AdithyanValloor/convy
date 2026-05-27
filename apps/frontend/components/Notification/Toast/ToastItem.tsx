"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Toast } from "./types";

interface Props {
  toast: Toast;
  removeToast: (id: string) => void;
}

export default function ToastItem({ toast, removeToast }: Props) {
  const getStyle = () => {
    switch (toast.type) {
      case "message":
        return "alert alert-info";
      case "friend_request":
        return "alert alert-warning";
      case "friend_accept":
        return "alert alert-success";
      case "call":
        return "alert alert-secondary";
      case "error":
        return "alert alert-error";
      default:
        return "alert";
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3 }}
      className={`${getStyle()} shadow-lg`}
    >
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-start">
          <span className="font-semibold">{toast.title}</span>
          <button aria-label="Close" onClick={() => removeToast(toast.id)}>
            <X size={16} />
          </button>
        </div>

        {toast.description && (
          <span className="text-sm opacity-80">{toast.description}</span>
        )}

        {toast.actionLabel && toast.onAction && (
          <button
            className="btn btn-sm btn-outline mt-2"
            onClick={() => {
              toast.onAction?.();
              removeToast(toast.id);
            }}
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}