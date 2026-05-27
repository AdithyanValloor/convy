import { forwardRef, useImperativeHandle, useRef } from "react";
import { MessageType } from "@/redux/features/messageSlice";
import Messages, { MessagesHandle } from "./Messages"; // ← also export handle from Messages

export interface ChatBodyHandle {
  scrollToBottom: () => void;
}

interface ChatBodyProps {
  chatId: string;
  currentUser: { _id: string; username: string; displayName?: string; profilePic?: string };
  typingUsers: Record<string, string>;
  replyingTo: MessageType | null;
  editingMessage: MessageType | null;
  onEdit: (msg: MessageType | null) => void;
  onDelete: (msg: MessageType) => void;
  setReplyingTo: (m: MessageType | null) => void;
  forwardMessage: MessageType | null;
  setForward: (m: MessageType | null) => void;
  scrollToMessage: (id: string) => void;
  isBlockedByMe: boolean;
}

// forwardRef lets ChatView do: <ChatBody ref={chatBodyRef} />
// useImperativeHandle exposes only scrollToBottom — nothing else leaks out
export const ChatBody = forwardRef<ChatBodyHandle, ChatBodyProps>(function ChatBody(
  {
    chatId,
    currentUser,
    typingUsers,
    replyingTo,
    editingMessage,
    onEdit,
    onDelete,
    setReplyingTo,
    setForward,
    scrollToMessage,
    forwardMessage,
    isBlockedByMe
  },
  ref
) {
  const messagesRef = useRef<MessagesHandle>(null);

  // Expose scrollToBottom upward to ChatView
  useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      messagesRef.current?.scrollToBottom();
    },
  }));

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <Messages
        ref={messagesRef}
        chatId={chatId}
        currentUser={currentUser}
        replyingTo={replyingTo}
        editingMessage={editingMessage}
        onEdit={onEdit}
        onDelete={onDelete}
        setReplyingTo={setReplyingTo}
        setForward={setForward}
        typingUsers={typingUsers}
        scrollToMessage={scrollToMessage}
        forwardMessage={forwardMessage}
        isBlockedByMe={isBlockedByMe}
      />
    </div>
  );
});