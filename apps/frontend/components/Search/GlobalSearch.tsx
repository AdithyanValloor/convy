"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { globalSearch, clearSearch } from "@/redux/features/globalSearchSlice";
import {
  selectFilteredFriends,
  selectFilteredChats,
} from "@/redux/selectors/globalSearchSelectors";
import { User, MessageSquare, Hash, SearchX } from "lucide-react";
import Image from "next/image";
import defaultPFP from "@/public/default-pfp.png";
import { accessChat } from "@/redux/features/chatSlice";
import { setJumpTo } from "@/redux/features/messageSlice";
import Avatar from "./Avatar";

interface GlobalSearchProps {
  query: string;
  onClose: () => void;
}

// ─── Local types for populated search results from backend ───────────────────

interface PopulatedMessageSender {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: { key: string | null };
}

interface PopulatedMessageChat {
  _id: string;
  chatName: string;
  isGroup: boolean;
  members: { _id: string; username: string; displayName?: string }[];
}

interface SearchMessage {
  _id: string;
  content: string;
  createdAt: string;
  sender: PopulatedMessageSender;
  chat: PopulatedMessageChat;
}

interface GroupedChat {
  chat: PopulatedMessageChat;
  messages: SearchMessage[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return <span>{text}</span>;

  return (
    <span>
      {text.slice(0, index)}
      <span className="text-green-500 font-semibold">
        {text.slice(index, index + query.length)}
      </span>
      {text.slice(index + query.length)}
    </span>
  );
}

function groupMessagesByChat(messages: SearchMessage[]): GroupedChat[] {
  const map = new Map<string, GroupedChat>();
  for (const msg of messages) {
    const chatId = msg.chat._id;
    if (!map.has(chatId)) {
      map.set(chatId, { chat: msg.chat, messages: [] });
    }
    map.get(chatId)!.messages.push(msg);
  }
  return Array.from(map.values());
}

function getSnippet(content: string, query: string, radius = 40): string {
  const index = content.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return content.slice(0, radius * 2);
  const start = Math.max(0, index - radius);
  const end = Math.min(content.length, index + query.length + radius);
  return (
    (start > 0 ? "..." : "") +
    content.slice(start, end) +
    (end < content.length ? "..." : "")
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 px-1 py-1.5">
      <span className="text-base-content/40">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
        {title}
      </span>
      <span className="ml-auto text-xs text-base-content/30">{count}</span>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-base-content/30">
      <SearchX size={36} strokeWidth={1.2} />
      <p className="text-sm">
        No results for{" "}
        <span className="font-medium text-base-content/50">
          &quot;{query}&quot;
        </span>
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-2 py-2.5 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-base-content/10 shrink-0" />
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="h-3 w-2/5 rounded bg-base-content/10" />
        <div className="h-2.5 w-3/5 rounded bg-base-content/10" />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function GlobalSearch({ query, onClose }: GlobalSearchProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { messages, status } = useAppSelector((state) => state.globalSearch);
  const currentUserId = useAppSelector((state) => state.auth.user?._id ?? "");

  const filteredFriends = useAppSelector((state) =>
    selectFilteredFriends(state, query),
  );
  const filteredChats = useAppSelector((state) =>
    selectFilteredChats(state, query),
  );

  useEffect(() => {
    if (query.length < 2) {
      dispatch(clearSearch());
      return;
    }
    dispatch(globalSearch(query));
  }, [query, dispatch]);

  const handleFriendClick = useCallback(
    async (friendId: string) => {
      try {
        const chat = await dispatch(accessChat({ userId: friendId })).unwrap();
        onClose();
        router.push(`/chat/${chat.data._id}`);
      } catch (err) {
        console.error("Failed to access chat", err);
      }
    },
    [dispatch, router, onClose],
  );

  const handleChatClick = useCallback(
    (chatId: string) => {
      onClose();
      router.push(`/chat/${chatId}`);
    },
    [router, onClose],
  );

  const handleMessageClick = useCallback(
    (chatId: string, messageId: string) => {
      onClose();
      router.push(`/chat/${chatId}?messageId=${messageId}`);
      dispatch(setJumpTo({ chatId, messageId }));
    },
    [dispatch, router, onClose],
  );

  const isLoading = status === "loading";
  const groupedMessages = groupMessagesByChat(messages);
  const hasResults =
    filteredFriends.length > 0 ||
    filteredChats.length > 0 ||
    messages.length > 0;

  if (query.length < 2) return null;

  return (
    <div className="flex flex-col gap-1 pb-4">
      {/* ── People ── */}
      {filteredFriends.length > 0 && (
        <section>
          <SectionHeader
            icon={<User size={14} />}
            title="People"
            count={filteredFriends.length}
          />
          <ul>
            {filteredFriends.map((friend) => (
              <li key={friend._id}>
                <button
                  type="button"
                  onClick={() => handleFriendClick(friend._id)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-base-content/5 transition-colors duration-150 cursor-pointer"
                >
                  <div className="relative shrink-0">
                    <Avatar
                      profilePicture={friend.profilePicture}
                      size={36}
                      alt={friend.displayName || friend.username}
                    />
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-base-content truncate">
                      <HighlightMatch
                        text={friend.displayName ?? friend.username}
                        query={query}
                      />
                    </span>
                    <span className="text-xs text-base-content/40 truncate">
                      @<HighlightMatch text={friend.username} query={query} />
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Chats ── */}
      {filteredChats.length > 0 && (
        <section>
          <SectionHeader
            icon={<Hash size={13} />}
            title="Chats"
            count={filteredChats.length}
          />
          <ul>
            {filteredChats.map((chat) => (
              <li key={chat._id}>
                <button
                  type="button"
                  onClick={() => handleChatClick(chat._id)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-base-content/5 transition-colors duration-150 cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                    {chat.isGroup ? (
                      <Hash size={15} className="text-secondary" />
                    ) : (
                      <User size={15} className="text-secondary" />
                    )}
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium text-base-content truncate">
                      {/* resolvedName = group chatName OR other member's name for DMs */}
                      <HighlightMatch text={chat.resolvedName} query={query} />
                    </span>
                    <span className="text-xs text-base-content/40">
                      {chat.isGroup ? "Group" : "Personal"}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Messages ── */}
      <section>
        <SectionHeader
          icon={<MessageSquare size={13} />}
          title="Messages"
          count={messages.length}
        />

        {isLoading && (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {!isLoading && groupedMessages.length > 0 && (
          <ul className="flex flex-col gap-1">
            {groupedMessages.map(({ chat, messages: chatMessages }) => (
              <li key={chat._id}>
                {/* Chat group label — chatName from backend populate */}
                <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
                  <div className="w-4 h-4 rounded-sm bg-primary/10 flex items-center justify-center shrink-0">
                    {chat.isGroup ? (
                      <Hash size={9} className="text-primary" />
                    ) : (
                      <User size={9} className="text-primary" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-base-content/50 truncate">
                    {/* {chat.chatName ?? "Direct Message"} */}

                    {chat.isGroup
                      ? chat.chatName
                      : (chat.members?.find((m) => m._id !== currentUserId)
                          ?.displayName ??
                        chat.members?.find((m) => m._id !== currentUserId)
                          ?.username ??
                        "Direct Message")}
                  </span>
                </div>
                <ul>
                  {chatMessages.map((msg) => (
                    <li key={msg._id}>
                      <button
                        type="button"
                        onClick={() => handleMessageClick(chat._id, msg._id)}
                        className="w-full flex items-start gap-3 px-2 py-2 rounded-xl hover:bg-base-content/5 transition-colors duration-150 cursor-pointer text-left"
                      >
                        <div className="shrink-0 mt-0.5">
                          <Avatar
                            profilePicture={msg.sender?.profilePicture}
                            size={28}
                            alt={
                              msg.sender?.displayName ??
                              msg.sender?.username ??
                              "User"
                            }
                          />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs font-semibold text-base-content/70 truncate">
                              {msg.sender?.displayName ??
                                msg.sender?.username ??
                                "Unknown"}
                            </span>
                            <span className="text-[10px] text-base-content/30 shrink-0">
                              {new Date(msg.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-base-content/60 leading-relaxed line-clamp-2">
                            <HighlightMatch
                              text={getSnippet(msg.content, query)}
                              query={query}
                            />
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}

        {!isLoading && !hasResults && <EmptyState query={query} />}

        {!isLoading && messages.length === 0 && hasResults && (
          <p className="text-xs text-base-content/30 px-2 py-2">
            No messages found
          </p>
        )}
      </section>
    </div>
  );
}
