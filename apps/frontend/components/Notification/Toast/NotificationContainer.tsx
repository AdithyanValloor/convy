"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Toast } from "./types";
import defaultPFP from "@/public/default-pfp.png";

interface Props {
  notifications: Toast[];
  removeToast: (id: string) => void;
}

export default function NotificationContainer({
  notifications,
  removeToast,
}: Props) {
  return (
    <div className="fixed top-6 left-1/2 text-base-content -translate-x-1/2 z-50 flex flex-col gap-2 w-80">
      <AnimatePresence>
        {notifications.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="bg-base-100 shadow-xl border border-base-content/10 rounded-2xl px-3 py-2 cursor-pointer hover:bg-base-200 transition"
            onClick={() => {
              toast.onAction?.();
              removeToast(toast.id);
            }}
          >
            <div className="flex gap-3 items-center">
              {toast.profilePicture && (
                <Image
                  //   src={toast.profilePicture ?? defaultPFP}
                  src={defaultPFP}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}

              <div className="flex flex-col">
                <span className="font-semibold">{toast.title}</span>
                {toast.description && (
                  <div className="text-sm opacity-90">
                    <span className="line-clamp-1">{toast.description}</span>

                    {toast.messageCount && toast.messageCount > 1 && (
                      <span className="text-xs opacity-60">
                        +{toast.messageCount - 1} more messages
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
