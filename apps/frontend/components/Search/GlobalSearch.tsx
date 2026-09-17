"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  globalSearch,
  clearSearch,
} from "@/redux/features/globalSearchSlice";
import {
  selectFilteredFriends,
  selectFilteredChats,
} from "@/redux/selectors/globalSearchSelectors";
import {
  User,
  MessageSquare,
  Hash,
  SearchX,
} from "lucide-react";
import { accessChat } from "@/redux/features/chatSlice";
import { setJumpTo } from "@/redux/features/messageSlice";
import Avatar from "./Avatar";

interface GlobalSearchProps {
  query: string;
  onClose: () => void;
}

// ─── Local types ─────────────────────────────────────────────────────────────

interface PopulatedMessageSender {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: {
    key: string | null;
  };
}

interface PopulatedMessageChat {
  _id: string;
  chatName: string;
  isGroup: boolean;
  members: {
    _id: string;
    username: string;
    displayName?: string;
  }[];
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function HighlightMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query.trim()) {
    return <span>{text}</span>;
  }

  const index = text
    .toLowerCase()
    .indexOf(query.toLowerCase());

  if (index === -1) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {text.slice(0, index)}

      <span className="font-semibold text-violet-500">
        {text.slice(index, index + query.length)}
      </span>

      {text.slice(index + query.length)}
    </span>
  );
}

function groupMessagesByChat(
  messages: SearchMessage[],
): GroupedChat[] {
  const map = new Map<string, GroupedChat>();

  for (const msg of messages) {
    const chatId = msg.chat._id;

    if (!map.has(chatId)) {
      map.set(chatId, {
        chat: msg.chat,
        messages: [],
      });
    }

    map.get(chatId)!.messages.push(msg);
  }

  return Array.from(map.values());
}

function getSnippet(
  content: string,
  query: string,
  radius = 40,
): string {
  const index = content
    .toLowerCase()
    .indexOf(query.toLowerCase());

  if (index === -1) {
    return content.slice(0, radius * 2);
  }

  const start = Math.max(0, index - radius);
  const end = Math.min(
    content.length,
    index + query.length + radius,
  );

  return (
    (start > 0 ? "..." : "") +
    content.slice(start, end) +
    (end < content.length ? "..." : "")
  );
}

function getChatDisplayName(
  chat: PopulatedMessageChat,
  currentUserId: string,
): string {
  if (chat.isGroup) {
    return chat.chatName;
  }

  const otherMember = chat.members?.find(
    (member) => member._id !== currentUserId,
  );

  return (
    otherMember?.displayName ??
    otherMember?.username ??
    "Direct Message"
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
      <span className="text-base-content/40">
        {icon}
      </span>

      <span
        className="
          text-xs
          font-semibold
          uppercase
          tracking-widest
          text-base-content/40
        "
      >
        {title}
      </span>

      <span className="ml-auto text-xs text-base-content/30">
        {count}
      </span>
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        gap-3
        py-16
        text-base-content/30
      "
    >
      <SearchX
        size={36}
        strokeWidth={1.2}
      />

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
    <div
      className="
        flex
        items-center
        gap-3
        px-2
        py-2.5
        animate-pulse
      "
    >
      <div
        className="
          h-9
          w-9
          shrink-0
          rounded-full
          bg-base-content/10
        "
      />

      <div className="flex flex-1 flex-col gap-1.5">
        <div
          className="
            h-3
            w-2/5
            rounded
            bg-base-content/10
          "
        />

        <div
          className="
            h-2.5
            w-3/5
            rounded
            bg-base-content/10
          "
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function GlobalSearch({
  query,
  onClose,
}: GlobalSearchProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { messages, status } = useAppSelector(
    (state) => state.globalSearch,
  );

  const currentUserId = useAppSelector(
    (state) => state.auth.user?._id ?? "",
  );

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
        const chat = await dispatch(
          accessChat({
            userId: friendId,
          }),
        ).unwrap();

        onClose();

        router.push(`/chat/${chat.data._id}`);
      } catch (err) {
        console.error(
          "Failed to access chat",
          err,
        );
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

      router.push(
        `/chat/${chatId}`,
      );

      dispatch(
        setJumpTo({
          chatId,
          messageId,
        }),
      );
    },
    [dispatch, router, onClose],
  );

  const isLoading = status === "loading";

  const groupedMessages =
    groupMessagesByChat(messages);

  const hasResults =
    filteredFriends.length > 0 ||
    filteredChats.length > 0 ||
    messages.length > 0;

  if (query.length < 2) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 pb-4">

      {/* ─────────────────────────────────────────────
          People
      ───────────────────────────────────────────── */}

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
                  onClick={() =>
                    handleFriendClick(friend._id)
                  }
                  className="
                    flex
                    w-full
                    cursor-pointer
                    items-center
                    gap-3
                    rounded-xl
                    px-2
                    py-2.5
                    text-left
                    transition-colors
                    duration-150
                    hover:bg-violet-500/5
                  "
                >
                  <div className="relative shrink-0">
                    <Avatar
                      profilePicture={
                        friend.profilePicture
                      }
                      size={36}
                      alt={
                        friend.displayName ||
                        friend.username
                      }
                    />
                  </div>

                  <div
                    className="
                      flex
                      min-w-0
                      flex-col
                      items-start
                    "
                  >
                    <span
                      className="
                        truncate
                        text-sm
                        font-medium
                        text-base-content
                      "
                    >
                      <HighlightMatch
                        text={
                          friend.displayName ??
                          friend.username
                        }
                        query={query}
                      />
                    </span>

                    <span
                      className="
                        truncate
                        text-xs
                        text-base-content/40
                      "
                    >
                      @
                      <HighlightMatch
                        text={friend.username}
                        query={query}
                      />
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─────────────────────────────────────────────
          Chats
      ───────────────────────────────────────────── */}

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
                  onClick={() =>
                    handleChatClick(chat._id)
                  }
                  className="
                    flex
                    w-full
                    cursor-pointer
                    items-center
                    gap-3
                    rounded-xl
                    px-2
                    py-2.5
                    text-left
                    transition-colors
                    duration-150
                    hover:bg-violet-500/5
                  "
                >
                  <div
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-violet-500/10
                    "
                  >
                    {chat.isGroup ? (
                      <Hash
                        size={15}
                        className="text-violet-500"
                      />
                    ) : (
                      <User
                        size={15}
                        className="text-violet-500"
                      />
                    )}
                  </div>

                  <div
                    className="
                      flex
                      min-w-0
                      flex-col
                      items-start
                    "
                  >
                    <span
                      className="
                        truncate
                        text-sm
                        font-medium
                        text-base-content
                      "
                    >
                      <HighlightMatch
                        text={getChatDisplayName(
                          chat,
                          currentUserId,
                        )}
                        query={query}
                      />
                    </span>

                    <span
                      className="
                        text-xs
                        text-base-content/40
                      "
                    >
                      {chat.isGroup
                        ? "Group"
                        : "Personal"}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ─────────────────────────────────────────────
          Messages
      ───────────────────────────────────────────── */}

      <section>
        <SectionHeader
          icon={<MessageSquare size={13} />}
          title="Messages"
          count={messages.length}
        />

        {/* Loading */}
        {isLoading && (
          <div>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}

        {/* Results */}
        {!isLoading &&
          groupedMessages.length > 0 && (
            <ul className="flex flex-col gap-1">
              {groupedMessages.map(
                ({
                  chat,
                  messages: chatMessages,
                }) => {
                  
                  console.log("chat ---------------------------- ", chat);
                  

                  const chatDisplayName =
                    getChatDisplayName(
                      chat,
                      currentUserId,
                    );

                  return (
                    <li key={chat._id}>

                      {/* Chat label */}
                      <div
                        className="
                          flex
                          items-center
                          gap-1.5
                          px-2
                          pb-1
                          pt-2
                        "
                      >
                        <div
                          className="
                            flex
                            h-4
                            w-4
                            shrink-0
                            items-center
                            justify-center
                            rounded-sm
                            bg-violet-500/10
                          "
                        >
                          {chat.isGroup ? (
                            <Hash
                              size={9}
                              className="text-violet-500"
                            />
                          ) : (
                            <User
                              size={9}
                              className="text-violet-500"
                            />
                          )}
                        </div>

                        <span
                          className="
                            truncate
                            text-xs
                            font-medium
                            text-base-content/50
                          "
                        >
                          {chatDisplayName}
                        </span>
                      </div>

                      <ul>
                        {chatMessages.map((msg) => (
                          <li key={msg._id}>
                            <button
                              type="button"
                              onClick={() =>
                                handleMessageClick(
                                  chat._id,
                                  msg._id,
                                )
                              }
                              className="
                                flex
                                w-full
                                cursor-pointer
                                items-start
                                gap-3
                                rounded-xl
                                px-2
                                py-2
                                text-left
                                transition-colors
                                duration-150
                                hover:bg-violet-500/5
                              "
                            >
                              {/* Avatar */}
                              <div className="mt-0.5 shrink-0">
                                <Avatar
                                  profilePicture={
                                    msg.sender
                                      ?.profilePicture
                                  }
                                  size={28}
                                  alt={
                                    msg.sender
                                      ?.displayName ??
                                    msg.sender
                                      ?.username ??
                                    "User"
                                  }
                                />
                              </div>

                              {/* Content */}
                              <div
                                className="
                                  flex
                                  min-w-0
                                  flex-1
                                  flex-col
                                "
                              >
                                <div
                                  className="
                                    flex
                                    items-baseline
                                    gap-2
                                  "
                                >
                                  <span
                                    className="
                                      truncate
                                      text-xs
                                      font-semibold
                                      text-base-content/70
                                    "
                                  >
                                    {msg.sender
                                      ?.displayName ??
                                      msg.sender
                                        ?.username ??
                                      "Unknown"}
                                  </span>

                                  <span
                                    className="
                                      shrink-0
                                      text-[10px]
                                      text-base-content/30
                                    "
                                  >
                                    {new Date(
                                      msg.createdAt,
                                    ).toLocaleDateString(
                                      [],
                                      {
                                        month: "short",
                                        day: "numeric",
                                      },
                                    )}
                                  </span>
                                </div>

                                <p
                                  className="
                                    line-clamp-2
                                    text-xs
                                    leading-relaxed
                                    text-base-content/60
                                  "
                                >
                                  <HighlightMatch
                                    text={getSnippet(
                                      msg.content,
                                      query,
                                    )}
                                    query={query}
                                  />
                                </p>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                },
              )}
            </ul>
          )}

        {/* No results */}
        {!isLoading &&
          !hasResults && (
            <EmptyState query={query} />
          )}

        {!isLoading &&
          messages.length === 0 &&
          hasResults && (
            <p
              className="
                px-2
                py-2
                text-xs
                text-base-content/30
              "
            >
              No messages found
            </p>
          )}
      </section>
    </div>
  );
}