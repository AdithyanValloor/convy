"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { useEffect } from "react";
import ChatView from "@/components/chat/ChatView";
import { useSocket } from "@/context/SocketContext";

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const router = useRouter();

  const chat = useAppSelector((s) =>
    s.chat.chats.find((c) => c._id === chatId),
  );

  const currentUser = useAppSelector((s) => s.auth.user);
  const isLoading = useAppSelector((s) => s.chat.listLoading);

  const socket = useSocket();

  useEffect(() => {
    if (!chat && !isLoading) {
      router.push("/chat");
    }
  }, [chat, isLoading, router]);

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!chat) return null;

  return <ChatView chat={chat} currentUser={currentUser} socket={socket} />;
}
