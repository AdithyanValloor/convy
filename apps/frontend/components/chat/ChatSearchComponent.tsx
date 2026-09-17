"use client";

import { ArrowLeft, Search, CalendarDays, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  searchMessagesApi,
  type MessageType,
  clearMessageSearch,
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
    searchResults.map((id) => state.messages.byId[id]).filter(Boolean),
  );

  useEffect(() => {
    const hasQuery = query.trim().length > 0;
    const hasDate = !!selectedDate;

    if (!hasQuery && !hasDate) {
      return;
    }

    const timeout = setTimeout(() => {
      dispatch(
        searchMessagesApi({
          chatId,
          query: query.trim(),
          date: selectedDate?.toISOString(),
          page: 1,
        }),
      );
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, selectedDate, chatId, dispatch]);

  const handleClose = () => {
    setQuery("");
    setSelectedDate(null);
    dispatch(clearMessageSearch());
    onClose();
  };

  const handleClearQuery = () => {
    setQuery("");
    setSelectedDate(null);
    dispatch(clearMessageSearch());
  };

  const getSenderLabel = (msg: MessageType) => {
    if (msg.sender._id === currentUser._id) {
      return "You";
    }

    return msg.sender.displayName || msg.sender.username;
  };

  const hasFilters = query.trim().length > 0 || !!selectedDate;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-base-200 text-base-content">
      {/* Header */}
      <header className="shrink-0 border-b border-base-content/8 bg-base-200/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-4 py-3">
          <IconButton ariaLabel="Close search" onClick={handleClose}>
            <ArrowLeft size={19} />
          </IconButton>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight">
              Search messages
            </p>

            <p className="mt-0.5 text-[11px] text-base-content/35">
              Search this conversation
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={handleClearQuery}
              className="
                flex items-center gap-1.5
                rounded-lg
                px-2 py-1.5
                text-[11px] font-medium
                text-base-content/40
                transition-colors
                hover:bg-base-content/5
                hover:text-base-content/70
                cursor-pointer
              "
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>

        {/* Search controls */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              strokeWidth={1.8}
              className="
                pointer-events-none
                absolute left-3
                top-1/2
                -translate-y-1/2
                text-base-content/35
              "
            />

            <SearchInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages..."
              autoFocus
            />
          </div>

          <DateFilter value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* Active date filter */}
        {selectedDate && (
          <div className="flex items-center gap-2 px-4 pb-3">
            <div
              className="
                inline-flex items-center gap-1.5
                rounded-full
                border border-violet-500/15
                bg-violet-500/8
                px-2.5 py-1
                text-[11px]
                text-violet-400
              "
            >
              <CalendarDays size={12} />

              <span>{selectedDate.format("MMM D, YYYY")}</span>

              <button
                type="button"
                onClick={() => {
                  setSelectedDate(null);
                  dispatch(clearMessageSearch());
                }}
                className="
                  ml-0.5
                  rounded-full
                  p-0.5
                  transition-colors
                  hover:bg-violet-500/15
                "
                aria-label="Clear date filter"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {/* Initial state */}
        {!hasFilters && (
          <div className="flex flex-col items-center px-6 pt-16 text-center">
            <div
              className="
                mb-4
                flex h-12 w-12
                items-center justify-center
                rounded-2xl
                bg-violet-500/8
                text-violet-400
              "
            >
              <Search size={21} strokeWidth={1.6} />
            </div>

            <p className="text-sm font-medium text-base-content/70">
              Search this conversation
            </p>

            <p className="mt-1.5 max-w-[220px] text-xs leading-relaxed text-base-content/35">
              Find messages by keyword or narrow your search by date.
            </p>
          </div>
        )}

        {/* Loading */}
        {searchLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="
                  rounded-xl
                  border border-base-content/5
                  bg-base-100/30
                  px-3 py-3
                "
              >
                <div className="mb-2 h-3 w-24 animate-pulse rounded bg-base-content/8" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-base-content/8" />
                <div className="mt-2 h-2.5 w-28 animate-pulse rounded bg-base-content/6" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!searchLoading && hasFilters && searchMessages.length === 0 && (
          <div className="flex flex-col items-center px-6 pt-16 text-center">
            <div
              className="
                  mb-4
                  flex h-12 w-12
                  items-center justify-center
                  rounded-2xl
                  bg-base-content/5
                  text-base-content/25
                "
            >
              <Search size={20} strokeWidth={1.5} />
            </div>

            <p className="text-sm font-medium text-base-content/60">
              No messages found
            </p>

            <p className="mt-1 text-xs text-base-content/30">
              Try another keyword or date.
            </p>
          </div>
        )}

        {/* Results */}
        {!searchLoading && searchMessages.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="px-2 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-widest text-base-content/25">
              {searchMessages.length}{" "}
              {searchMessages.length === 1 ? "result" : "results"}
            </div>

            {searchMessages.map((msg) => (
              <button
                key={msg._id}
                type="button"
                onClick={() => onSelectMessage(msg._id)}
                className="
                  group
                  w-full
                  rounded-xl
                  border border-transparent
                  bg-base-100/30
                  px-3 py-2.5
                  text-left
                  transition-all
                  duration-150
                  hover:border-violet-500/10
                  hover:bg-violet-500/5
                  active:scale-[0.995]
                  cursor-pointer
                "
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="
                      min-w-0
                      truncate
                      text-xs
                      font-semibold
                      text-base-content/60
                      transition-colors
                      group-hover:text-violet-400
                    "
                  >
                    {getSenderLabel(msg)}
                  </span>

                  <span className="shrink-0 text-[10px] text-base-content/25">
                    {new Date(msg.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <p
                  className="
                    mt-1
                    line-clamp-2
                    text-xs
                    leading-relaxed
                    text-base-content/55
                  "
                >
                  {msg.content}
                </p>

                <p className="mt-1.5 text-[10px] text-base-content/25">
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
