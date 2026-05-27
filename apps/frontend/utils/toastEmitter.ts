import { ToastType } from "@/components/Notification/Toast/types";


export type ToastEvent = {
  type: ToastType; 
  title: string;
  description?: string;
  duration?: number;
  persistent?: boolean;
  actionLabel?: string;
  profilePicture?: { key: string | null };
  chatId?: string;
  onAction?: () => void;
};

type Listener = (event: ToastEvent) => void;

let listener: Listener | null = null;

export const registerToastListener = (cb: Listener) => {
  listener = cb;
};

export const emitToast = (event: ToastEvent) => {
  if (listener) listener(event);
};
 