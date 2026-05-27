"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import { Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import ProfileView from "../layout/profileView";
import { selectMessagesByChat } from "@/redux/selectors/messageSelectors";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import {
  fetchMessages,
  sendMessage,
  MessageType,
  deleteMessageApi,
  editMessageApi,
  fetchMessageContext,
  setJumpTo,
} from "@/redux/features/messageSlice";
import {
  addMembers,
  removeMembers,
  toggleAdmin,
  leaveGroup,
  deleteGroup,
  transferOwnership,
} from "@/redux/features/chatSlice";
import GroupSidebar from "../layout/GroupchatSideBar";
import MessageInput from "./MessageInput";
import { motion, AnimatePresence } from "framer-motion";
import { ChatHeader } from "./ChatHeader";
import { ChatBody, ChatBodyHandle } from "./ChatBody"; // ← import handle type
import ChatSearchComponent from "./ChatSearchComponent";
import ConfirmModal from "../GlobalComponents/ConfirmModal";
import { setActiveChatId } from "@/utils/activeChat";
import { RootState } from "@/redux/store";
import { unblockUser } from "@/redux/features/blockSlice";
import {
  clearMentionsForChat,
  markMentionsReadForChat,
} from "@/redux/features/notificationSlice";
import { useIsMobile } from "@/utils/screenSize";
import { SelectedFile } from "./Attachmentpicker";
import { uploadFileToS3 } from "@/utils/uploadToS3";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { Chat } from "@/types/chat.types";

interface ChatViewProps {
  chat: {
    _id: string;
    chatName: string;
    isGroup: boolean;
    members: {
      _id: string;
      username: string;
      displayName?: string;
      profilePicture?: { key: string | null };
      avatar?: {key: string | null}
      status?: "online" | "offline";
    }[];
  };
  currentUser: {
    _id: string;
    username: string;
    displayName?: string;
    profilePic?: string;
  };
  socket: Socket | null;
}

type SidebarMode = "profile" | "search" | null;

export default function ChatView({ chat, currentUser, socket }: ChatViewProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  // ─── Refs ─────────────────────────────────────────────────────────────────
  // Points into ChatBody → Messages, exposes scrollToBottom()
  const chatBodyRef = useRef<ChatBodyHandle>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasFetchedRef = useRef<Set<string>>(new Set());
  const markAsSeenTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMarkingRef = useRef(false);
  const hasMarkedInitialRef = useRef(false);

  // ─── State ────────────────────────────────────────────────────────────────
  const [message, setMessage] = useState("");
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editingMessage, setEditingMessage] = useState<MessageType | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [pendingMentionIds, setPendingMentionIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    open: boolean;
    msg: MessageType | null;
  }>({ open: false, msg: null });
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [forward, setForward] = useState<MessageType | null>(null);
  const [stagedFile, setStagedFile] = useState<SelectedFile | null>(null);

  // ─── Selectors ────────────────────────────────────────────────────────────
  const onlineStatus = useAppSelector((state) => state.presence.users);
  const messages = useAppSelector((state) =>
    selectMessagesByChat(state, chat._id),
  );
  const typingUsers = useAppSelector((s) => s.typing.byChat[chat._id] ?? {});

  const isBlocked = useAppSelector((state: RootState) => {
    if (chat.isGroup) return false;
    const other = chat.members.find((m) => m._id !== currentUser._id);
    if (!other) return false;
    return (
      state.block.blockedUsers.some((u) => u._id === other._id) ||
      state.block.blockedByUsers.includes(other._id)
    );
  });

  const isBlockedByMe = useAppSelector((state: RootState) => {
    if (chat.isGroup) return false;
    const other = chat.members.find((m) => m._id !== currentUser._id);
    if (!other) return false;
    return state.block.blockedUsers.some((u) => u._id === other._id);
  });

  const isBlockingMe = useAppSelector((state: RootState) => {
    if (chat.isGroup) return false;
    const other = chat.members.find((m) => m._id !== currentUser._id);
    if (!other) return false;
    return state.block.blockedByUsers.includes(other._id);
  });

  // ─── Derived display values (memoized) ────────────────────────────────────
  const otherMember = useMemo(
    () => chat.members.find((m) => m._id !== currentUser._id),
    [chat.members, currentUser._id],
  );

  const displayUser = useMemo(() => {
    if (chat.isGroup) {
      return {
        _id: chat._id,
        username: chat.chatName,
        displayName: chat.chatName,
        avatar: { key: null },
      };
    }
    return (
      otherMember ?? {
        _id: "unknown",
        username: "Unknown",
        displayName: "Unknown",
        profilePicture: { key: currentUser.profilePic ?? null },
      }
    );
  }, [
    chat.isGroup,
    chat._id,
    chat.chatName,
    otherMember,
    currentUser.profilePic,
  ]);

  const displayStatus: "online" | "offline" = useMemo(() => {
    if (chat.isGroup) return "online";
    if (!otherMember) return "offline";
    return onlineStatus[otherMember._id] || "offline";
  }, [chat.isGroup, otherMember, onlineStatus]);

  const displayName = displayUser.displayName;
  const name = displayUser.username;

const groupAvatarKey = (chat as Chat)?.avatar?.key;

const userAvatarKey = displayUser?.profilePicture?.key;

const signedUrl = useSignedUrl(groupAvatarKey || userAvatarKey);


const displayPic = signedUrl ? signedUrl : chat.isGroup ? "/default-group-icon.png" : "/default-pfp.png";

  // ─── Scroll helper — delegates into Messages via imperative handle ─────────
  const scrollToBottom = useCallback(() => {
    chatBodyRef.current?.scrollToBottom();
  }, []);

  // ─── Active chat tracking ──────────────────────────────────────────────────
  useEffect(() => {
    setActiveChatId(chat._id);
    return () => setActiveChatId(null);
  }, [chat._id]);

  // ─── Scroll on link preview change ────────────────────────────────────────
  const lastMessage = messages.at(-1);
  useLayoutEffect(() => {
    if (lastMessage?.linkPreview) scrollToBottom();
  }, [lastMessage?.linkPreview, scrollToBottom]);

  const isMobile = useIsMobile();

  // ─── Mark mentions read ───────────────────────────────────────────────────
  useEffect(() => {
    dispatch(markMentionsReadForChat(chat._id));
    dispatch(clearMentionsForChat(chat._id));
  }, [chat._id, dispatch]);

  // ─── Reset state on chat change ───────────────────────────────────────────
  useEffect(() => {
    hasMarkedInitialRef.current = false;
    isMarkingRef.current = false;

    if (markAsSeenTimeoutRef.current) {
      clearTimeout(markAsSeenTimeoutRef.current);
      markAsSeenTimeoutRef.current = null;
    }

    return () => {
      if (markAsSeenTimeoutRef.current) {
        clearTimeout(markAsSeenTimeoutRef.current);
        markAsSeenTimeoutRef.current = null;
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [chat._id]);

  // ─── Fetch messages (skips if already fetched) ────────────────────────────
  useEffect(() => {
    if (hasFetchedRef.current.has(chat._id)) return;
    hasFetchedRef.current.add(chat._id);

    dispatch(fetchMessages(chat._id))
      .unwrap()
      .then(() => scrollToBottom())
      .catch((err) => {
        console.error("❌ Failed to fetch messages:", err);
        hasFetchedRef.current.delete(chat._id);
      });
  }, [chat._id, dispatch, scrollToBottom]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleBackClick = useCallback(() => {
    router.push("/chat");
  }, [router]);

  const handleTyping = useCallback(() => {
    if (!socket?.connected) return;

    socket.emit("typing", {
      roomId: chat._id,
      userId: currentUser._id,
      username: currentUser.username,
      displayName: currentUser.displayName,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (socket?.connected) {
        socket.emit("stopTyping", {
          roomId: chat._id,
          userId: currentUser._id,
        });
      }
    }, 1500);
  }, [
    socket,
    chat._id,
    currentUser._id,
    currentUser.username,
    currentUser.displayName,
  ]);

  const handleSend = useCallback(async () => {
    if (!message.trim() && !editingMessage && !stagedFile) return;
    if (uploading) return;

    setShowPicker(false);

    if (editingMessage) {
      await dispatch(
        editMessageApi({
          chatId: chat._id,
          messageId: editingMessage._id,
          content: editingMessage.content.trim(),
        }),
      );
      setEditingMessage(null);
      return;
    }

    let fileData;

    if (stagedFile) {
      setUploading(true);
      try {
        fileData = await uploadFileToS3(stagedFile.file, chat._id);
      } finally {
        setUploading(false);
      }
    }

    const content = message;
    setMessage("");
    setPendingMentionIds([]);

    try {
      await dispatch(
        sendMessage({
          chatId: chat._id,
          content,
          replyTo: replyingTo?._id || null,
          ...(chat.isGroup && pendingMentionIds.length > 0
            ? { mentionIds: pendingMentionIds }
            : {}),
          ...(fileData ? { file: fileData } : {}),
        }),
      ).unwrap();

      setMessage("");

      if (stagedFile?.previewUrl) URL.revokeObjectURL(stagedFile.previewUrl);
      setStagedFile?.(null);

      setReplyingTo(null);

      if (socket?.connected) {
        socket.emit("stopTyping", {
          roomId: chat._id,
          userId: currentUser._id,
        });
      }
    } catch (err) {
      console.error("Send message failed:", err);
    }
  }, [
    message,
    editingMessage,
    stagedFile,
    uploading,
    dispatch,
    chat._id,
    chat.isGroup,
    replyingTo,
    pendingMentionIds,
    socket,
    currentUser._id,
  ]);

  const scrollToMessage = useCallback(
    async (messageId: string) => {
      const exists = messages.find((m) => m._id === messageId);
      if (!exists) {
        await dispatch(
          fetchMessageContext({ messageId, chatId: chat._id }),
        ).unwrap();
      } else {
        dispatch(setJumpTo({ chatId: chat._id, messageId }));
      }
    },
    [messages, dispatch, chat._id],
  );

  const handleUnblock = useCallback(() => {
    if (!chat.isGroup && otherMember) {
      dispatch(unblockUser(otherMember._id));
    }
  }, [chat.isGroup, otherMember, dispatch]);

  // ─── Sidebar content ──────────────────────────────────────────────────────
  const sidebarContent = (
    <div
      className={`h-full w-full overflow-hidden ${
        !isMobile && "rounded-2xl shadow-md border border-base-content/10"
      }`}
    >
      {sidebarMode === "search" && (
        <ChatSearchComponent
          chatId={chat._id}
          currentUser={currentUser}
          onClose={() => setSidebarMode(null)}
          onSelectMessage={(id) => scrollToMessage(id)}
        />
      )}

      {sidebarMode === "profile" && (
        <>
          {chat.isGroup ? (
            <GroupSidebar
              group={chat}
              currentUserId={currentUser._id}
              onBack={() => setSidebarMode(null)}
              onAddMembers={(ids) =>
                dispatch(addMembers({ chatId: chat._id, members: ids }))
              }
              onRemoveMember={(id) =>
                dispatch(removeMembers({ chatId: chat._id, member: id }))
              }
              onMakeAdmin={(id) =>
                dispatch(
                  toggleAdmin({
                    chatId: chat._id,
                    member: id,
                    makeAdmin: true,
                  }),
                )
              }
              onRemoveAdmin={(id) =>
                dispatch(
                  toggleAdmin({
                    chatId: chat._id,
                    member: id,
                    makeAdmin: false,
                  }),
                )
              }
              onLeaveGroup={() => dispatch(leaveGroup({ chatId: chat._id }))}
              onDeleteGroup={() => dispatch(deleteGroup({ chatId: chat._id }))}
              onTransferOwnership={(id) =>
                dispatch(
                  transferOwnership({ chatId: chat._id, newOwnerId: id }),
                ).then(() => {
                  dispatch(leaveGroup({ chatId: chat._id }));
                })
              }
            />
          ) : (
            <ProfileView
              onBack={() => setSidebarMode(null)}
              user={displayUser}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      {/* Main Chat Area */}
      <div
        className={`flex flex-col h-full transition-all duration-300 ease-in-out ${
          isMobile || !sidebarMode ? "w-full" : "w-2/3"
        }`}
      >
        <ChatHeader
          isMobile={isMobile}
          displayName={displayName || name}
          displayStatus={displayStatus}
          displayPic={displayPic}
          onBack={handleBackClick}
          onProfileClick={() =>
            setSidebarMode((prev) => (prev === "profile" ? null : "profile"))
          }
          setSidebarMode={setSidebarMode}
        />

        {/* ref gives us chatBodyRef.current.scrollToBottom() */}
        <ChatBody
          ref={chatBodyRef}
          chatId={chat._id}
          currentUser={currentUser}
          typingUsers={typingUsers}
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          onEdit={(msg) => {
            setReplyingTo(null);
            setEditingMessage(msg);
          }}
          onDelete={(msg) => setShowDeleteModal({ open: true, msg })}
          setReplyingTo={setReplyingTo}
          setForward={setForward}
          forwardMessage={forward}
          scrollToMessage={scrollToMessage}
          isBlockedByMe={isBlockedByMe}
        />

        <ConfirmModal
          open={showDeleteModal.open}
          title="Delete Message"
          description="Are you sure you want to delete this message?"
          cancelText="Cancel"
          confirmText="Delete"
          onCancel={() => setShowDeleteModal({ open: false, msg: null })}
          onConfirm={() => {
            if (showDeleteModal.msg) {
              dispatch(
                deleteMessageApi({
                  chatId: chat._id,
                  messageId: showDeleteModal.msg._id,
                }),
              );
            }
            setShowDeleteModal({ open: false, msg: null });
          }}
        />

        <div className="flex-shrink-0 safe-area-bottom">
          <MessageInput
            isMobile={isMobile}
            message={message}
            setMessage={setMessage}
            handleSend={handleSend}
            handleTyping={handleTyping}
            editingMessage={editingMessage}
            setEditingMessage={setEditingMessage}
            showPicker={showPicker}
            setShowPicker={setShowPicker}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            isBlocked={isBlocked && !chat.isGroup}
            isBlockedByMe={isBlockedByMe}
            isBlockingMe={isBlockingMe}
            isGroup={chat.isGroup}
            groupMembers={chat.isGroup ? chat.members : []}
            currentUserId={currentUser._id}
            onMentionsChange={setPendingMentionIds}
            onUnblock={handleUnblock}
            stagedFile={stagedFile}
            setStagedFile={setStagedFile}
            isUploading={uploading}
          />
        </div>
      </div>

      {/* Desktop Sidebar */}
      {!isMobile && sidebarMode && (
        <div className="relative w-1/3 mx-2 pb-3 h-full">{sidebarContent}</div>
      )}

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobile && sidebarMode && (
          <>
            <motion.div
              key="backdrop"
              className="absolute inset-0 z-20 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              onClick={() => setSidebarMode(null)}
            />
            <motion.div
              key="mobile-sidebar"
              className="absolute inset-0 z-30 bg-base-100 flex flex-col overflow-hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
      `}</style>
    </div>
  );
}
