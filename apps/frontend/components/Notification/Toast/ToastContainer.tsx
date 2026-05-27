"use client";

import { AnimatePresence } from "framer-motion";
import { Toast } from "./types";
import ToastItem from "./ToastItem";

interface Props {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export default function ToastContainer({ toasts, removeToast }: Props) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 w-80">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            removeToast={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}