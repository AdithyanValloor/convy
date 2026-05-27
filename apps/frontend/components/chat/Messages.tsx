"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
} from "react";
import {
  fetchMessages,
  forwardMessageApi,
  markMessagesAsSeen,
  MessageType,
  toggleReaction,
} from "@/redux/features/messageSlice";
import { ChevronDown, ChevronsDown } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { selectMessagesByChat } from "@/redux/selectors/messageSelectors";
import ChatBubble, { ChatBubbleProps } from "./ChatBubble";
import ContextMenu from "./ContextMenu";
import { motion, AnimatePresence } from "framer-motion";

import { clearJumpTo, fetchNewerMessages } from "@/redux/features/messageSlice";
import UniversalEmojiPicker from "../GlobalComponents/UniversalEmojiPicker";
import ForwardModal from "../GlobalComponents/Forward";
import { useRouter } from "next/navigation";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface MessagesProps {
  chatId: string;
  currentUser: { _id: string; username: string; profilePicture?: { key: string } };
  onEdit: (msg: MessageType | null) => void;
  onDelete: (msg: MessageType) => void;
  setReplyingTo: (msg: MessageType | null) => void;
  forwardMessage: MessageType | null;
  setForward: (msg: MessageType | null) => void;
  replyingTo: MessageType | null;
  editingMessage: MessageType | null;
  typingUsers: Record<string, string>;
  scrollTargetId?: string | null;
  scrollToMessage: (id: string) => void;
  ref?: React.Ref<MessagesHandle>;
  isBlockedByMe: boolean;
}

type MessageItemProps = Omit<ChatBubbleProps, "profilePic"> & {
  currentUser: { _id: string; username: string; profilePicture?: { key: string } };
};

export interface MessagesHandle {
  scrollToBottom: () => void;
}

export default function Messages({
  chatId,
  currentUser,
  onEdit,
  onDelete,
  setReplyingTo,
  setForward,
  replyingTo,
  typingUsers,
  editingMessage,
  scrollToMessage,
  isBlockedByMe,
  forwardMessage,
  ref,
}: MessagesProps) {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadingOlderRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const pageRef = useRef(1);
  const prevChatIdRef = useRef(chatId);
  const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  const animatedMessageIdRef = useRef<string | null>(null);
  const jumpLockRef = useRef(false);
  const router = useRouter();
  const hasMarkedRef = useRef(false);

  const messages = useAppSelector((state) =>
    selectMessagesByChat(state, chatId),
  );

  // FIX 1: pressTimer must be a ref, not a `let` — avoids stale closure leaks
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const jumpTo = useAppSelector((s) => s.messages.jumpTo);
  const chatMeta = useAppSelector((s) => s.messages.meta[chatId]);
  const { chats, accessLoading } = useAppSelector((state) => state.chat);

  const loadingNewerRef = useRef(false);
  const loadNewerDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // FIX 2: Track active eased-scroll RAF so we can cancel on re-trigger
  const easedScrollRafRef = useRef<number | null>(null);
  const wasNearBottomOnActivateRef = useRef(false);

  const reactionTargetRef = useRef<MessageType | null>(null);

  const [hasMore, setHasMore] = useState(() => chatMeta?.hasMore ?? true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(
    () => messages.length === 0,
  );
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showNewMsgBadge, setShowNewMsgBadge] = useState(false);
  const [unreadDividerIndex, setUnreadDividerIndex] = useState<number | null>(
    null,
  );
  const [showForwardModal, SetShowForwardModal] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    },
  }));

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    msg: MessageType | null;
    position: "top" | "bottom";
  }>({
    x: 0,
    y: 0,
    msg: null,
    position: "bottom",
  });
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const [showFullPicker, setShowFullPicker] = useState<{
    visible: boolean;
    msgId: string | null;
  }>({ visible: false, msgId: null });

  // Scroll to bottom on initial load

  // REMOVE both of the duplicate initial load effects that call markMessagesAsSeen
  // and replace with this single one:

  useEffect(() => {
    if (messages.length === 0) return;

    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      setIsInitialLoading(false);
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
      });
    }

    if (!hasMarkedRef.current) {
      hasMarkedRef.current = true;
      dispatch(markMessagesAsSeen(chatId));
    }
  }, [messages.length, chatId, dispatch]);

  // FIX 3: Stable callbacks with useCallback to avoid stale closures in scroll handlers
  const isNearBottom = useCallback(() => {
    const c = containerRef.current;
    if (!c) return true;
    return c.scrollHeight - c.scrollTop - c.clientHeight < 150;
  }, []);

  const isNearTop = useCallback(() => {
    const c = containerRef.current;
    if (!c) return false;
    return c.scrollTop < 400;
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // FIX 4: Cancel any in-flight eased scroll before starting a new one
  const scrollToBottomEased = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Cancel any previous animation
    if (easedScrollRafRef.current !== null) {
      cancelAnimationFrame(easedScrollRafRef.current);
      easedScrollRafRef.current = null;
    }

    const start = container.scrollTop;
    const end = container.scrollHeight - container.clientHeight;
    const distance = end - start;

    if (distance <= 0) return;

    // For very short distances just snap — no point animating
    if (distance < 80) {
      container.scrollTop = end;
      return;
    }

    const duration = Math.min(500, Math.max(200, distance * 0.3));
    let startTime: number | null = null;

    // Ease-out cubic: fast start, slow landing
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      container.scrollTop = start + distance * eased;

      if (progress < 1) {
        easedScrollRafRef.current = requestAnimationFrame(step);
      } else {
        container.scrollTop = end; // Final snap
        easedScrollRafRef.current = null;
      }
    };

    easedScrollRafRef.current = requestAnimationFrame(step);
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    setShowScrollBtn(false);
    setShowNewMsgBadge(false);
    setUnreadDividerIndex(null);
    scrollToBottomEased();
  }, [scrollToBottomEased]);

  useEffect(() => {
    if (!jumpTo) return;

    const timer = setTimeout(() => {
      dispatch(clearJumpTo());
    }, 2000);

    return () => clearTimeout(timer);
  }, [jumpTo, dispatch]);

  const handleTouchStart = useCallback(
    (msg: MessageType, e: React.TouchEvent) => {
      pressTimerRef.current = setTimeout(() => {
        const touch = e.touches[0];
        if (!touch || !containerRef.current) return;

        const touchX = touch.clientX;
        const touchY = touch.clientY;

        const menuWidth = 160;
        const menuHeight = msg.sender._id === currentUser._id ? 220 : 160;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const containerRect = containerRef.current.getBoundingClientRect();

        const finalX = Math.max(
          10,
          Math.min(touchX - menuWidth / 2, viewportWidth - menuWidth - 10),
        );
        let finalY = touchY;

        let position: "top" | "bottom" = "bottom";
        const spaceBelow = viewportHeight - touchY;
        const spaceAbove = touchY - containerRect.top;

        if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
          position = "top";
          finalY = Math.max(containerRect.top + 10, touchY - menuHeight);
        } else {
          finalY = Math.min(touchY, viewportHeight - menuHeight - 10);
        }

        setContextMenu({ x: finalX, y: finalY, msg, position });
      }, 600);
    },
    [currentUser._id],
  );

  const handleTouchEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  }, []);

  // Reset on chat change
  useEffect(() => {
    if (prevChatIdRef.current !== chatId) {
      const hasCached = messages.length > 0;
      pageRef.current = 1;
      setHasMore(chatMeta?.hasMore ?? true);
      setLoadingMore(false);
      setIsInitialLoading(!hasCached);
      setShowScrollBtn(false);
      setShowNewMsgBadge(false);
      setUnreadDividerIndex(null);
      lastMessageIdRef.current = null;
      loadingOlderRef.current = false;
      isInitialLoadRef.current = !hasCached; // ← only set once, no duplicate
      prevMessagesLengthRef.current = 0;
      animatedMessageIdRef.current = null;
      prevChatIdRef.current = chatId;
      jumpLockRef.current = false;

      if (easedScrollRafRef.current !== null) {
        cancelAnimationFrame(easedScrollRafRef.current);
        easedScrollRafRef.current = null;
      }
    }
    if (loadNewerDebounceRef.current) {
      clearTimeout(loadNewerDebounceRef.current);
      loadNewerDebounceRef.current = null;
    }
  }, [chatId, messages.length]);

  const clearedAt = useAppSelector(
    (s) => s.chat.chats.find((c) => c._id === chatId)?.clearedAt ?? null,
  );

  useEffect(() => {
    if (!jumpTo || jumpTo.chatId !== chatId) return;

    const targetMsg = messages.find((m) => m._id === jumpTo.messageId);

    jumpLockRef.current = true;

    const attemptCenter = (attemptsLeft: number) => {
      const el = document.getElementById(`msg-${jumpTo.messageId}`);
      if (!el) {
        if (attemptsLeft > 0)
          setTimeout(() => attemptCenter(attemptsLeft - 1), 80);
        else {
          jumpLockRef.current = false;
        }
        return;
      }

      const container = containerRef.current!;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elOffsetTop = elRect.top - containerRect.top + container.scrollTop;
      const target = Math.max(
        0,
        elOffsetTop - container.clientHeight / 2 + elRect.height / 2,
      );

      container.scrollTo({ top: target, behavior: "smooth" });

      setTimeout(() => {
        jumpLockRef.current = false;
      }, 800);
    };

    requestAnimationFrame(() => attemptCenter(8));
  }, [jumpTo, chatId, dispatch]);

  const loadNewer = useCallback(async () => {
    if (loadingNewerRef.current) return;
    if (!chatMeta?.hasMoreNewer) return;
    if (jumpLockRef.current) return;

    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;

    loadingNewerRef.current = true;

    const container = containerRef.current;
    const scrollHeightBefore = container?.scrollHeight ?? 0;
    const scrollTopBefore = container?.scrollTop ?? 0;
    const clientHeight = container?.clientHeight ?? 0;
    const distanceFromBottom =
      scrollHeightBefore - scrollTopBefore - clientHeight;

    try {
      await dispatch(
        fetchNewerMessages({ chatId, after: lastMsg.createdAt, limit: 20 }),
      ).unwrap();

      // FIX 5: Double RAF is sufficient — triple was redundant
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const newHeight = containerRef.current.scrollHeight;
          containerRef.current.scrollTop =
            newHeight - distanceFromBottom - containerRef.current.clientHeight;
        });
      });
    } catch (e) {
      console.error("Failed to load newer messages", e);
    } finally {
      setTimeout(() => {
        loadingNewerRef.current = false;
      }, 150);
    }
  }, [chatId, chatMeta?.hasMoreNewer, dispatch, messages]);

  const safeScrollToMessage = useCallback(
    (messageId: string) => {
      const target = messages.find((m) => m._id === messageId);
      if (!target) return;
      if (clearedAt && new Date(target.createdAt) <= new Date(clearedAt))
        return;
      scrollToMessage(messageId);
    },
    [messages, clearedAt, scrollToMessage],
  );

  useEffect(() => {
    hasMarkedRef.current = false;
  }, [chatId]);

  // FIX 6: loadMore defined before handleScroll so it's in scope
  const loadMore = useCallback(async () => {
    if (!containerRef.current || loadingOlderRef.current || !hasMore) return;
    // FIX 7: Don't block older load on newer load — they operate on opposite ends
    if (jumpLockRef.current) return;

    loadingOlderRef.current = true;
    setLoadingMore(true);

    const container = containerRef.current;
    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;
    const clientHeight = container.clientHeight;
    const distanceFromBottom =
      scrollHeightBefore - scrollTopBefore - clientHeight;

    try {
      const nextPage = pageRef.current + 1;
      const res = await dispatch(
        fetchMessages({ chatId, page: nextPage, limit: 20 }),
      ).unwrap();

      if (res.messages.length === 0 || res.messages.length < 20) {
        setHasMore(false);
      } else {
        pageRef.current = nextPage;
        if (chatMeta && !chatMeta.hasMore) {
          setHasMore(false);
        }
      }

      if (res.messages.length > 0) {
        // FIX 5: Double RAF is sufficient and more predictable than triple
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!containerRef.current) return;
            const newScrollTop =
              containerRef.current.scrollHeight -
              distanceFromBottom -
              containerRef.current.clientHeight;
            containerRef.current.scrollTop = newScrollTop;
          });
        });
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setTimeout(() => {
        setLoadingMore(false);
        loadingOlderRef.current = false;
      }, 100);
    }
  }, [chatId, chatMeta, dispatch, hasMore]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const nearBottom = isNearBottom();

    if (nearBottom) {
      setShowScrollBtn(false);
      setShowNewMsgBadge(false);
      setUnreadDividerIndex(null);

      if (!hasMarkedRef.current) {
        hasMarkedRef.current = true;
        dispatch(markMessagesAsSeen(chatId));
      }

      if (chatMeta?.hasMoreNewer) {
        if (loadNewerDebounceRef.current)
          clearTimeout(loadNewerDebounceRef.current);
        loadNewerDebounceRef.current = setTimeout(() => {
          loadNewer();
        }, 200);
      }
    } else {
      setShowScrollBtn(true);
    }

    if (isNearTop() && hasMore && !loadingMore && !loadingOlderRef.current) {
      loadMore();
    }
  }, [
    chatId,
    chatMeta?.hasMoreNewer,
    dispatch,
    hasMore,
    isNearBottom,
    isNearTop,
    loadMore,
    loadNewer,
    loadingMore,
  ]);

  const toggleChatSelection = useCallback((id: string) => {
    setSelectedChats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= 5) return next;
      next.add(id);
      return next;
    });
  }, []);

  const handleForwardSelected = useCallback(() => {
    if (!forwardMessage) return;
    const firstChatId = Array.from(selectedChats)[0];
    router.push(`/chat/${firstChatId}`);
    dispatch(
      forwardMessageApi({
        messageId: forwardMessage._id,
        targetChatIds: Array.from(selectedChats),
      }),
    );
    SetShowForwardModal(false);
    setSelectedChats(new Set());
  }, [dispatch, forwardMessage, router, selectedChats]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!isInitialLoadRef.current) return;
    if (messages.length === 0) return;

    isInitialLoadRef.current = false;
    setIsInitialLoading((prev) => (prev ? false : prev));

    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });

    if (!hasMarkedRef.current) {
      hasMarkedRef.current = true;
      dispatch(markMessagesAsSeen(chatId));
    }
  }, [messages.length, chatId, dispatch]);

  // Close context menu on outside click
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".universal-emoji-picker-container")) return;
      if (contextMenuRef.current && !contextMenuRef.current.contains(target)) {
        setContextMenu({ x: 0, y: 0, msg: null, position: "bottom" });
        setShowFullPicker({ visible: false, msgId: null });
      }
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    if (loadingOlderRef.current) return;

    const lastMessage = messages.at(-1);
    if (!lastMessage?._id) return;

    const isMyMessage = lastMessage.sender._id === currentUser._id;
    if (!isMyMessage) {
      hasMarkedRef.current = false;
    }

    const isNewMessage = lastMessage._id !== lastMessageIdRef.current;

    let animationTimeout: NodeJS.Timeout | null = null;

    if (isNewMessage) {
      const prevLength = prevMessagesLengthRef.current;
      const grewByOne = prevLength > 0 && messages.length === prevLength + 1;

      if (grewByOne) {
        animatedMessageIdRef.current = lastMessage._id;
        animationTimeout = setTimeout(() => {
          animatedMessageIdRef.current = null;
        }, 500);
      }

      const nearBottom = isNearBottom();

      if (isMyMessage || nearBottom) {
        scrollToBottom(true);
        setShowNewMsgBadge(false);
        setUnreadDividerIndex(null);
      } else {
        setShowNewMsgBadge(true);
        setUnreadDividerIndex(messages.length - 1);
      }

      lastMessageIdRef.current = lastMessage._id;

      // ↓ THIS IS THE FIX — mark seen immediately if chat is open and visible
      if (!hasMarkedRef.current && (nearBottom || isMyMessage)) {
        hasMarkedRef.current = true;
        dispatch(markMessagesAsSeen(chatId));
      }
    }

    prevMessagesLengthRef.current = messages.length;

    return () => {
      if (animationTimeout) clearTimeout(animationTimeout);
    };
  }, [
    messages,
    currentUser._id,
    isNearBottom,
    scrollToBottom,
    chatId,
    dispatch,
  ]);

  // Persistent observer — fires post-reflow so nearBottom check uses real geometry
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let prevScrollHeight = container.scrollHeight;

    const observer = new ResizeObserver(() => {
      if (loadingOlderRef.current || jumpLockRef.current) return;

      const newScrollHeight = container.scrollHeight;
      if (newScrollHeight <= prevScrollHeight) {
        prevScrollHeight = newScrollHeight;
        return;
      }
      prevScrollHeight = newScrollHeight;

      // Post-reflow nearBottom check — accurate after bubble height changes
      const nearBottom =
        newScrollHeight - container.scrollTop - container.clientHeight < 180;
      if (!nearBottom) return;

      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
        rafId = null;
      });
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [chatId]);

  // Scroll when typing
  useEffect(() => {
    if (Object.keys(typingUsers).length === 0) return;
    if (isNearBottom()) {
      scrollToBottom(true);
    }
  }, [typingUsers, isNearBottom, scrollToBottom]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (easedScrollRafRef.current !== null) {
        cancelAnimationFrame(easedScrollRafRef.current);
      }
      if (loadNewerDebounceRef.current) {
        clearTimeout(loadNewerDebounceRef.current);
      }
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  const isNewDay = (curr: MessageType, prev?: MessageType) => {
    if (!prev) return true;
    return (
      new Date(curr.createdAt).toDateString() !==
      new Date(prev.createdAt).toDateString()
    );
  };

  const handleReply = useCallback(
    (msg: MessageType) => {
      onEdit(null);
      setReplyingTo(msg);
      setContextMenu({ x: 0, y: 0, msg: null, position: "bottom" });
    },
    [onEdit, setReplyingTo],
  );

  const handleReaction = useCallback(
    (msg: MessageType, emoji: string) => {
      dispatch(toggleReaction({ messageId: msg._id, emoji }));
      reactionTargetRef.current = null;
      setContextMenu({ x: 0, y: 0, msg: null, position: "bottom" });
      setShowFullPicker({ visible: false, msgId: null });
    },
    [dispatch],
  );

  const openContextMenu = useCallback(
    (e: React.MouseEvent, msg: MessageType) => {
      e.preventDefault();
      e.stopPropagation();

      if (contextMenu.msg?._id === msg._id) {
        setContextMenu({ x: 0, y: 0, msg: null, position: "bottom" });
        setShowFullPicker({ visible: false, msgId: null });
        return;
      }

      if (!containerRef.current) return;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const isUserMessage = msg.sender._id === currentUser._id;
      const menuWidth = 160;
      const menuHeight = isUserMessage ? 220 : 160;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const containerRect = containerRef.current.getBoundingClientRect();

      let finalX = mouseX;
      let finalY = mouseY;

      if (finalX + menuWidth > viewportWidth)
        finalX = viewportWidth - menuWidth - 10;
      if (finalX < 10) finalX = 10;

      let position: "top" | "bottom" = "bottom";
      const spaceBelow = viewportHeight - mouseY;
      const spaceAbove = mouseY - containerRect.top;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        position = "top";
        finalY = mouseY - menuHeight;
        if (finalY < containerRect.top + 10) finalY = containerRect.top + 10;
      } else {
        position = "bottom";
        if (finalY + menuHeight > viewportHeight)
          finalY = viewportHeight - menuHeight - 10;
      }

      setContextMenu({ x: finalX, y: finalY, msg, position });
      setShowFullPicker({ visible: false, msgId: null });
    },
    [contextMenu.msg?._id, currentUser._id],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu({ x: 0, y: 0, msg: null, position: "bottom" });
    setShowFullPicker({ visible: false, msgId: null });
  }, []);

  const openFullPicker = useCallback(
    (msgId: string) => {
      reactionTargetRef.current = contextMenu.msg;
      setShowFullPicker({ visible: true, msgId });
    },
    [contextMenu.msg],
  );

  // Freeze page scroll when context menu is open
  useEffect(() => {
    const prevent = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(".EmojiPickerReact")) return;
      e.preventDefault();
    };

    if (contextMenu.msg && !contextMenu.msg.deleted) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.addEventListener("wheel", prevent, { passive: false });
      window.addEventListener("touchmove", prevent, { passive: false });
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener("wheel", prevent as EventListener);
        window.removeEventListener("touchmove", prevent as EventListener);
      };
    }
  }, [contextMenu.msg]);

  // Capture scroll proximity BEFORE the input bar expands (pre-paint)
  useLayoutEffect(() => {
    if (replyingTo || editingMessage) {
      wasNearBottomOnActivateRef.current = isNearBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!replyingTo, !!editingMessage]);

  // Fire exactly when the container resizes (input bar expands)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || (!replyingTo && !editingMessage)) return;

    const observer = new ResizeObserver(() => {
      if (!wasNearBottomOnActivateRef.current) return;
      requestAnimationFrame(() => {
        containerRef.current?.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [replyingTo, editingMessage]);

  let groupStart: MessageType | null = null;
  const GROUP_INTERVAL = 300;

  function MessageItem({ msg, isMe, currentUser, ...rest }: MessageItemProps) {
    const key = isMe ? currentUser.profilePicture?.key : msg.sender.profilePicture?.key;
    const url = useSignedUrl(key);

    const profilePic = url || "/default-pfp.png";

    return (
      <ChatBubble {...rest} msg={msg} isMe={isMe} profilePic={profilePic} />
    );
  }

  return (
    <div className="relative flex-1 scroll-smooth flex flex-col h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="messages-container flex-1 flex flex-col overflow-y-scroll pb-3
          scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full"
      >
        {loadingMore && !isInitialLoading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-center items-center py-3"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-base-100/50 border border-base-content/10 rounded-full">
              <span className="loading loading-spinner loading-xs opacity-60 text-base-content" />
              <span className="text-xs opacity-60 text-base-content">
                Loading messages...
              </span>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {!isInitialLoading &&
            messages.map((msg, index) => {
              let grouped = false;
              if (!groupStart) {
                groupStart = msg;
                grouped = false;
              } else {
                const sameSender = msg.sender._id === groupStart.sender._id;
                const diffSeconds =
                  (new Date(msg.createdAt).getTime() -
                    new Date(groupStart.createdAt).getTime()) /
                  1000;

                if (sameSender && diffSeconds < GROUP_INTERVAL) {
                  grouped = true;
                } else {
                  groupStart = msg;
                  grouped = false;
                }
              }

              const prev = messages[index - 1];
              const newDay = isNewDay(msg, prev);
              const next = messages[index + 1];

              const nextInSameGroup =
                next &&
                next.sender._id === msg.sender._id &&
                (new Date(next.createdAt).getTime() -
                  new Date(msg.createdAt).getTime()) /
                  1000 <
                  300;

              const isLastInGroup = !nextInSameGroup;
              const isLastMessage = index === messages.length - 1;
              const shouldAnimate = msg._id === animatedMessageIdRef.current;

              const isMe = msg.sender._id === currentUser._id;
              const senderName = isMe
                ? "You"
                : msg.sender.displayName || msg.sender.username;

              return (
                <motion.div
                  id={`msg-${msg._id}`}
                  key={msg._id}
                  initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                  onContextMenu={(e) => openContextMenu(e, msg)}
                  onTouchStart={(e) => handleTouchStart(msg, e)}
                  onTouchEnd={handleTouchEnd}
                >
                  {newDay && (
                    <div className="flex items-center my-4 w-full">
                      <hr className="flex-grow border-t border-base-content opacity-10" />
                      <span className="opacity-50 text-base-content text-xs mx-3 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <hr className="flex-grow border-t border-base-content opacity-10" />
                    </div>
                  )}

                  {unreadDividerIndex === index && (
                    <div className="flex items-center justify-center my-2">
                      <div className="bg-primary text-white text-xs px-3 py-1 rounded-full shadow">
                        New Messages
                      </div>
                    </div>
                  )}

                  <MessageItem
                    msg={msg}
                    isMe={isMe}
                    currentUser={currentUser}
                    grouped={grouped}
                    isLastInGroup={isLastInGroup}
                    senderName={senderName}
                    scrollToMessage={safeScrollToMessage}
                    replyingTo={replyingTo}
                    editingMessage={editingMessage}
                    handleReaction={handleReaction}
                    contextMenu={contextMenu}
                    isLastMessage={isLastMessage}
                  />

                  {contextMenu.msg?._id === msg._id && !msg.deleted && (
                    <ContextMenu
                      contextMenuRef={contextMenuRef}
                      contextMenu={contextMenu}
                      isMe={isMe}
                      openFullPicker={openFullPicker}
                      msg={msg}
                      SetShowForwardModal={() => SetShowForwardModal(true)}
                      handleReply={handleReply}
                      closeContextMenu={closeContextMenu}
                      setReplyingTo={setReplyingTo}
                      setForward={setForward}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      isBlockedByMe={isBlockedByMe}
                    />
                  )}
                </motion.div>
              );
            })}
        </AnimatePresence>

        <AnimatePresence>
          {Object.keys(typingUsers).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="chat chat-start px-15 py-[1px]"
            >
              <div className="bg-base-100 flex items-center gap-2 shadow text-base-content px-5 rounded-full py-1.5">
                <span className="loading loading-dots loading-md opacity-50" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <UniversalEmojiPicker
        visible={showFullPicker.visible}
        setVisible={(v: boolean) =>
          setShowFullPicker({ visible: v, msgId: null })
        }
        onSelect={(emoji: string) => {
          const msg = reactionTargetRef.current;
          if (msg) handleReaction(msg, emoji);
        }}
      />

      <ForwardModal
        show={showForwardModal}
        onClose={() => {
          SetShowForwardModal(false);
          setSelectedChats(new Set());
        }}
        chats={chats}
        selectedChats={selectedChats}
        toggleChatSelection={toggleChatSelection}
        handleForwardSelected={handleForwardSelected}
      />

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            type="button"
            onClick={scrollToBottomInstant}
            aria-label="Scroll to bottom"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute flex items-center justify-center 
              bottom-0 right-4 mb-5 p-2 
              bg-base-200 text-base-content/40 
              hover:bg-base-200 cursor-pointer 
              rounded-full shadow"
          >
            <ChevronDown size={25} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewMsgBadge && (
          <motion.div
            onClick={scrollToBottomInstant}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-4 mb-5 z-50
              flex items-center gap-1
              pl-4 px-2 py-2
              rounded-full
              bg-base-content
              font-semibold
              text-sm
              cursor-pointer shadow"
          >
            New messages <ChevronsDown size={18} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
