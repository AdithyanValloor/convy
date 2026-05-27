"use client";

import { ArrowLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import {
  searchMessagesApi,
  type MessageType,
} from "@/redux/features/messageSlice";
import SearchInput from "../GlobalComponents/SearchInput";
import IconButton from "../GlobalComponents/IconButtons";
import DateFilter from "./DatePicker";
import type { Dayjs } from "dayjs";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

interface ChatSearchComponentProps {
  onClose: () => void;
  currentUser: {
    _id: string;
    username: string;
    displayName?: string;
    profilePic?: string;
  };
  chatId: string;
  onSelectMessage: (id: string) => void;
}

export default function ChatSearchComponent({
  onClose,
  currentUser,
  chatId,
  onSelectMessage,
}: ChatSearchComponentProps) {
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const dispatch = useAppDispatch();

  const searchResults = useAppSelector(
    (state) => state.messages.search.results,
  );

  const searchLoading = useAppSelector(
    (state) => state.messages.search.loading,
  );

  const searchMessages = useAppSelector((state) =>
    searchResults.map((id) => state.messages.byId[id]),
  );

  useEffect(() => {
    const hasQuery = query.trim().length > 0;
    const hasDate = !!selectedDate;

    if (!hasQuery && !hasDate) return;

    const timeout = setTimeout(() => {
      dispatch(
        searchMessagesApi({
          chatId,
          query,
          date: selectedDate?.toISOString(),
          page: 1,
        }),
      );
    }, 400); // debounce

    return () => clearTimeout(timeout);
  }, [query, selectedDate]);

  const getSenderLabel = (msg: MessageType) => {
    if (msg.sender._id === currentUser._id) {
      return "You";
    }

    return msg.sender.displayName || msg.sender.username;
  };

  return (
    <div className="h-full w-full text-base-content flex flex-col bg-base-200 shadow">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-base-content/8 bg-base-200">
        <IconButton
          ariaLabel="Close search"
          onClick={() => {
            setQuery("");
            setSelectedDate(null);
            onClose();
          }}
        >
          <ArrowLeft size={20} />
        </IconButton>

        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
          />
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages"
            autoFocus
          />
        </div>

        {/* Date picker here */}
        <DateFilter value={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {!query && (
          <p className="text-sm opacity-60 text-center mt-6">
            Type to search messages
          </p>
        )}

        {!searchLoading && searchMessages.length === 0 && query && (
          <p className="text-sm opacity-60 text-center mt-6">
            No messages found
          </p>
        )}

        <div className="flex flex-col gap-1">
          {searchMessages.map((msg) => (
            <div
              key={msg._id}
              onClick={() => onSelectMessage(msg._id)}
              className="p-2 rounded-lg hover:bg-base-content/10 cursor-pointer transition"
            >
              <p className="text-sm line-clamp-2">
                <span className="opacity-60">{getSenderLabel(msg)}:</span>{" "}
                {msg.content}
              </p>
              <p className="text-[11px] opacity-60 mt-0.5">
                {/* {new Date(msg.createdAt).toLocaleString()} */}
                {new Date(msg.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
