"use client";

import { MessageSquare } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 select-none px-6">
      
      {/* Icon */}
      <div className="bg-base-100 p-3 rounded-2xl text-base-content/50 shadow-sm">
        <MessageSquare size={32} strokeWidth={1.2} />
      </div>

      {/* Text */}
      <div className="text-center space-y-1.5">
        <p className="text-xl font-semibold text-base-content/80 tracking-tight">
          Select a chat
        </p>
        <p className="text-sm text-base-content/40 max-w-[240px] leading-relaxed">
          Choose a conversation to start messaging.
        </p>
      </div>
    </div>
  );
}