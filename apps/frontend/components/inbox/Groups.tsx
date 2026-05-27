"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import FriendCard from "../Message/FriendCard";
import { fetchChats } from "@/redux/features/chatSlice";

interface ContextMenuState {
  x: number;
  y: number;
  chatId: string;
  position: "top" | "bottom";
}

interface GroupChatProps {
  onOpenChat: (chatId: string) => void;
  selectedChatId?: string;
  ifInbox: boolean;
}

export default function GroupChat({
  onOpenChat,
  selectedChatId,
}: GroupChatProps) {
  const dispatch = useAppDispatch();

  const { chats, listLoading } = useAppSelector((state) => state.chat);
  const { user, sessionLoading } = useAppSelector((state) => state.auth);
  const perChatUnread = useAppSelector((state) => state.unread.perChat);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const handleContextMenuOpen = useCallback((state: ContextMenuState) => {
    setContextMenu(state);
  }, []);

  const handleContextMenuClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  /* -------- Fetch chats once -------- */
  useEffect(() => {
    if (user?._id && !sessionLoading) {
      dispatch(fetchChats());
    }
  }, [dispatch, user?._id, sessionLoading]);

  if (sessionLoading || (listLoading && chats.length === 0)) {
    return <p className="p-3">Loading groups...</p>;
  }

  const groupChats = chats.filter((c) => c.isGroup && !c.isArchived);

  if (!groupChats.length) {
    return <p className="p-3 text-center opacity-70">No groups yet</p>;
  }

  

  return (
    <div className="h-full w-full flex flex-col gap-1">
      {groupChats.map((chat) => {
        const unreadCount = perChatUnread[chat._id] || 0;

        console.log("CHAT AVATAR:", chat.avatar);

        return (
          <FriendCard
            key={chat._id}
            ifInbox
            user={{
              name: chat.chatName,
              profilePicture: chat.avatar?.key
                ? { key: chat.avatar.key }
                : undefined,
              lastMessage: chat.lastMessage?.content || "",
            }}
            msgId={chat._id}
            chatType="group"
            unread={unreadCount}
            onClick={() => onOpenChat(chat._id)}
            selectedChat={selectedChatId}
            activeContextMenuChatId={contextMenu?.chatId ?? null}
            contextMenuRef={contextMenuRef}
            onContextMenuOpen={handleContextMenuOpen}
            onContextMenuClose={handleContextMenuClose}
            contextMenuPos={
              contextMenu?.chatId === chat._id
                ? {
                    x: contextMenu.x,
                    y: contextMenu.y,
                    position: contextMenu.position,
                  }
                : null
            }
          />
        );
      })}
    </div>
  );
}
