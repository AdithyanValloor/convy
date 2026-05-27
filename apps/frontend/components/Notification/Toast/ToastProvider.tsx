"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { Toast } from "./types";
import ToastContainer from "./ToastContainer";
import { registerToastListener } from "@/utils/toastEmitter";
import NotificationContainer from "./NotificationContainer";
import { useRouter } from "next/navigation";
import { isChatSilenced } from "@/utils/isChatMuted";
import { useSelector } from "react-redux";
import { RootState, store } from "@/redux/store";
import { shouldNotify } from "@/utils/notificationGate";

interface ToastContextType {
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [systemToasts, setSystemToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Toast[]>([]);
  const lastPlayed = useRef(0);

  const router = useRouter();

  useEffect(() => {
    registerToastListener((event) => {
      showToast({
        ...event,
        onAction:
          event.type === "message"
            ? () => router.push(`/chat/${event.chatId}`)
            : event.onAction,
      });
    });
  }, [router]);

  useEffect(() => {
    const enableAudio = () => {
      notificationSound.current = new Audio("/sounds/notification.mp3");
      document.removeEventListener("click", enableAudio);
    };
    document.addEventListener("click", enableAudio);
    return () => document.removeEventListener("click", enableAudio);
  }, []);

  const notificationSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    notificationSound.current = new Audio("/sounds/notification.mp3");
    notificationSound.current.volume = 0.6;
  }, []);

  const mapToastType = (type: string) => {
    switch (type) {
      case "message":
        return "message";
      case "friend_request":
        return "friend_request";
      case "friend_accept":
        return "friend_accept";
      case "notification":
        return "group_added";
      default:
        return null;
    }
  };

  const showToast = (toast: Omit<Toast, "id">) => {
    const state = store.getState();
    const settings = state.notificationSettings.settings;

    if (toast.type === "notification") return;

    const mapped = mapToastType(toast.type);
    if (!mapped) return;

    const allowed = shouldNotify(mapped, settings);
    if (!allowed) return;

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);

    const isNotification =
      toast.type === "message" ||
      toast.type === "friend_request" ||
      toast.type === "friend_accept";

    if (isNotification) {
      const now = Date.now();
      const shouldPlaySound = !toast.chatId || !isChatSilenced(toast.chatId);
      if (shouldPlaySound && now - lastPlayed.current > 800) {
        notificationSound.current?.play().catch(() => {});
        lastPlayed.current = now;
      }

      setNotifications((prev) => {
        if (toast.chatId) {
          const existingIndex = prev.findIndex(
            (t) => t.chatId === toast.chatId,
          );
          if (existingIndex !== -1) {
            const updated = [...prev];
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...existing,
              description: toast.description,
              messageCount: (existing.messageCount ?? 1) + 1,
            };
            return updated;
          }
        }
        return [...prev, { ...toast, id, messageCount: 1 }];
      });

      if (!toast.persistent) {
        setTimeout(() => removeToast(id), toast.duration || 4000);
      }
      return;
    }

    // System toasts (errors, info, etc.)
    setSystemToasts((prev) => [...prev, { ...toast, id }]);
    if (!toast.persistent) {
      setTimeout(() => removeToast(id), toast.duration || 4000);
    }
  };

  const removeToast = (id: string) => {
    setSystemToasts((prev) => prev.filter((t) => t.id !== id));
    setNotifications((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={systemToasts} removeToast={removeToast} />
      <NotificationContainer
        notifications={notifications}
        removeToast={removeToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
};
