"use client";

import Image from "next/image";
import { MessageType } from "@/redux/features/messageSlice";
import { renderTwemoji } from "@/utils/renderEmoji";
import { parseMessageText } from "@/utils/parseMessage";
import { BadgeX, Check, CheckCheck, Forward } from "lucide-react";
import LinkPreviewCard from "../Message/LinkPreviewCard";
import { useAppSelector } from "@/redux/hooks";
import { useIsMobile } from "@/utils/screenSize";
import FilePreviewCard from "./FilePreviewCard";

export interface ChatBubbleProps {
  msg: MessageType;
  isMe: boolean;
  grouped: boolean;
  isLastInGroup: boolean;
  handleReaction: (msg: MessageType, emoji: string) => void;
  scrollToMessage: (id: string) => void;
  replyingTo: MessageType | null;
  editingMessage: MessageType | null;
  profilePic: string;
  senderName: string;
  contextMenu: {
    x: number;
    y: number;
    msg: MessageType | null;
    position: "top" | "bottom";
  };
  isLastMessage: boolean;
}

const EMOJI_RE =
  /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})[\p{Emoji}\uFE0F\u20E3\u200D\u{1F3FB}-\u{1F3FF}]*$/u;

// Counts how many top-level emoji grapheme clusters are in a string.
// Returns 0 if the string contains any non-emoji, non-whitespace characters.
function countEmojis(str: string): number {
  const trimmed = str.trim();
  if (!trimmed) return 0;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    const nonSpace = Array.from(
      segmenter.segment(trimmed),
      (s) => s.segment,
    ).filter((g) => g.trim() !== "");
    if (nonSpace.some((g) => !EMOJI_RE.test(g))) return 0;
    return nonSpace.length;
  }

  // Fallback for environments without Intl.Segmenter
  const stripped = trimmed
    .replace(
      /(\p{Emoji_Presentation}|\p{Extended_Pictographic})[\p{Emoji}\uFE0F\u20E3\u200D\u{1F3FB}-\u{1F3FF}]*/gu,
      "",
    )
    .trim();
  if (stripped.length > 0) return 0;
  const matches = trimmed.match(
    /(\p{Emoji_Presentation}|\p{Extended_Pictographic})[\p{Emoji}\uFE0F\u20E3\u200D\u{1F3FB}-\u{1F3FF}]*/gu,
  );
  return matches ? matches.length : 0;
}

export default function ChatBubble({
  msg,
  isMe,
  grouped,
  isLastInGroup,
  senderName,
  scrollToMessage,
  replyingTo,
  editingMessage,
  profilePic,
  handleReaction,
  contextMenu,
}: ChatBubbleProps) {
  const content = msg.content ?? "";

  // Only treat as emoji-only when: not deleted, no reply context
  const emojiCount = !msg.deleted && !msg.replyTo ? countEmojis(content) : 0;
  const isSingleEmoji = emojiCount === 1;
  const isMultipleEmoji = emojiCount >= 2 && emojiCount <= 5;
  const isEmojiOnly = isSingleEmoji || isMultipleEmoji;
  const jumpTo = useAppSelector((s) => s.messages.jumpTo);
  const isMobile = useIsMobile();

  // Pixel size passed directly to twemoji — CSS font-size has no effect on <img> tags
  const emojiSize = isSingleEmoji ? 56 : 44;
  // ${highlightedMessageId === msg._id ? "bg-cyan-900/30" : ""}

  return (
    <div
      className={`chat relative text-base-content p-0 border-1 border-transparent
        ${!msg.deleted && msg.reactions && msg.reactions.length > 0 ? "pb-6" : ""}
        ${isMe ? "chat-end" : "chat-start"}
        hover:bg-base-content/10 rounded-sm transition-colors
        ${isMobile ? "px-2" : "px-4"}
        ${jumpTo?.messageId === msg._id ? "bg-cyan-900/30" : ""}
        ${editingMessage?._id === msg._id ? "bg-base-content/10" : ""}
        ${replyingTo?._id === msg._id ? "bg-base-content/10" : ""}
        ${contextMenu.msg?._id === msg._id && !msg.deleted ? "bg-base-content/10" : ""}
      `}
    >
      {!grouped && (
        <div className="chat-image avatar">
          <div className="w-10 h-10 -mx-1 rounded-full overflow-hidden">
            <Image
              src={profilePic}
              alt="profile"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
        </div>
      )}

      {!grouped && (
        <div className="chat-header">
          {senderName}
          <time className="opacity-50 ml-1">
            {new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      )}

      {/* ── Emoji-only: no bubble background ── */}
      {isEmojiOnly ? (
        <div
          className={`relative chat-bubble !bg-transparent !shadow-none !p-0 flex flex-col
            ${grouped ? (isMe ? "mx-9" : "mx-9") : ""}
            max-w-[75%] sm:max-w-[65%] md:max-w-[55%] xl:max-w-[50%]`}
        >
          <div
            className={`twemoji-container select-none leading-none
              ${isMe ? "text-right" : "text-left"}`}
            dangerouslySetInnerHTML={{
              __html: renderTwemoji(parseMessageText(content), emojiSize),
            }}
          />

          {msg.edited && !msg.deleted && (
            <div className={`flex pt-1 ${isMe ? "justify-end" : ""}`}>
              <span className="text-[10px] opacity-50">edited</span>
            </div>
          )}

          {isMe && (
            <div className="flex justify-end">
              <div className="bg-cyan-900 p-1 px-2 rounded-lg mt-0.5">
                {msg.seenBy && msg.seenBy.length > 0 ? (
                  <CheckCheck
                    size={16}
                    strokeWidth={3}
                    className="text-blue-400"
                  />
                ) : msg.deliveredTo && msg.deliveredTo.length > 0 ? (
                  <Check size={16} strokeWidth={3} className="text-white" />
                ) : (
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="opacity-50 text-white"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Normal bubble ── */
        <div
          className={`relative rounded-2xl shadow-md chat-bubble flex flex-col text-sm
            ${
              grouped
                ? isMe
                  ? "!rounded-r-lg"
                  : "!rounded-l-lg"
                : isMe
                  ? "!rounded-br-lg"
                  : "!rounded-bl-lg"
            }
            ${
              isLastInGroup
                ? isMe
                  ? "!rounded-br-2xl"
                  : "!rounded-bl-2xl"
                : ""
            }
            ${msg.file ? "p-1" : "p-2"}
            ${isMe ? "bg-cyan-950 text-white" : "bg-base-100"}
            ${grouped ? (isMe ? "mx-8" : "mx-8") : ""}
            ${msg.deleted ? "italic opacity-50" : ""}
            break-words overflow-hidden whitespace-pre-wrap
            max-w-[280px] md:max-w-[400px] w-fit         
            `}
        >
          {msg.forwarded && !msg.deleted && (
            <div
              className={`flex items-center italic gap-1 opacity-50 pl-3 px-2`}
            >
              <Forward size={15} />
              <span className={`${isMe ? "pr-8" : ""} text-sm`}>Forwarded</span>
            </div>
          )}

          {msg.replyTo && (
            <div
              onClick={() => {
                if (msg.replyTo?._id) scrollToMessage(msg.replyTo._id);
              }}
              className={`bg-base-content/10 cursor-default
                ${
                  grouped
                    ? isMe
                      ? "!rounded-r-lg"
                      : "!rounded-l-lg"
                    : isMe
                      ? "!rounded-br-lg"
                      : "!rounded-bl-lg"
                }
                rounded-t-xl rounded-lg px-5 p-2 mb-1 text-sm`}
            >
              <span className="font-semibold">
                {msg.replyTo.sender?.displayName ||
                  msg.replyTo.sender?.username}
              </span>
              :{" "}
              <span className="opacity-70 inline-block max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap align-middle">
                {msg.replyTo.content}
              </span>
            </div>
          )}

          <div className="w-full">
            <div className="flex items-center">
              {msg.deleted && <BadgeX size={20} className="mr-1" />}
              <div
                className={`select-text w-full ${!msg.deleted && "px-3"} ${isMe ? "pr-6" : ""} twemoji-container`}
                dangerouslySetInnerHTML={{
                  __html: msg.deleted
                    ? "Deleted message"
                    : renderTwemoji(parseMessageText(msg.content)),
                }}
              />
            </div>
            {msg.linkPreview && <LinkPreviewCard preview={msg.linkPreview} />}
            {msg.file && <FilePreviewCard file={msg.file} />}
            {msg.edited && !msg.deleted && (
              <div className={`flex py-1 ${isMe ? "justify-end" : ""}`}>
                <span
                  className={`pl-3 ${isMe ? "pr-8" : ""} text-[10px] opacity-50`}
                >
                  edited
                </span>
              </div>
            )}
          </div>

          {isMe && (
            <div className="absolute bottom-2 right-2 flex items-center">
              {msg.seenBy && msg.seenBy.length > 0 ? (
                <CheckCheck
                  size={16}
                  strokeWidth={3}
                  className="text-blue-400"
                />
              ) : msg.deliveredTo && msg.deliveredTo.length > 0 ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <Check size={16} strokeWidth={3} className="opacity-50" />
              )}
            </div>
          )}
        </div>
      )}

      {!msg.deleted && msg.reactions && msg.reactions.length > 0 && (
        <div
          className={`absolute flex flex-wrap gap-[2px] px-[7px] py-[3px] rounded-full text-sm bottom-8 select-none twemoji-container translate-y-[95%]
            ${isMe ? `${isMobile ? "right-12" : "right-14"} justify-end` : `${isMobile ? "left-12" : "left-14"} justify-start`}`}
        >
          {Object.entries(
            msg.reactions.reduce(
              (acc, r) => {
                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>,
            ),
          ).map(([emoji, count]) => (
            <span
              key={emoji}
              className={`flex items-center border border-base-content/10 shadow-md justify-center p-1 gap-[4px] ${isMe ? "bg-base-100" : "bg-cyan-950"} rounded-full cursor-pointer transition-all`}
              onClick={() => handleReaction(msg, emoji)}
            >
              <span
                className="flex items-center justify-center leading-none"
                dangerouslySetInnerHTML={{ __html: renderTwemoji(emoji, 15) }}
              />
              {count > 1 && (
                <span className="text-xs font-semibold opacity-70 leading-none flex items-center">
                  {count}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
