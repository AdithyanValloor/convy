"use client";

import { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  acceptMessageRequestThunk,
  rejectMessageRequestThunk,
  MessageRequest,
} from "@/redux/features/requestSlice";
import Image from "next/image";
import IconButton from "../GlobalComponents/IconButtons";
import SearchInput from "../GlobalComponents/SearchInput";
import { useIsMobile } from "@/utils/screenSize";
import AppButton from "../GlobalComponents/AppButton";
import { useSignedUrl } from "@/hooks/useSignedUrl";

/* ------------------------------------------------------------------ */
/* Request card                                                         */
/* ------------------------------------------------------------------ */

interface RequestCardProps {
  request: MessageRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
}

function RequestCard({
  request,
  onAccept,
  onReject,
  actionLoading,
}: RequestCardProps) {
  const person = request.from;
  const isBusy = actionLoading === request._id;
  
  const url = useSignedUrl(person?.profilePicture?.key)

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-base-content/2 hover:bg-base-content/5 cursor-pointer transition-colors duration-150">
      <div className="w-11 h-11 rounded-full overflow-hidden bg-base-300 ring-2 ring-base-100 flex-shrink-0">
        {person?.profilePicture?.key ? (
          <Image
            src={url || "/default-pfp.png"}
            alt={person.displayName || person.username}
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-semibold text-base">
            {(person?.displayName || person?.username || "?")[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-base-content truncate">
              {person?.displayName || person?.username}
            </p>
            <p className="text-xs text-base-content/50 truncate">
              @{person?.username}
            </p>
          </div>
          <span className="text-xs text-base-content/40 flex-shrink-0 mt-0.5">
            {new Date(request.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <p className="mt-1.5 text-sm text-base-content/70 line-clamp-2 leading-snug">
          {request.firstMessage}
        </p>

        <div className="flex gap-2 mt-2.5">
          <button
            type="button"
            onClick={() => onAccept(request._id)}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg
                bg-green-700 text-white hover:bg-green-800 transition-colors cursor-pointer"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onReject(request._id)}
            className="flex-1 py-1.5 text-xs font-medium rounded-lg
                bg-base-300 text-base-content/60 hover:bg-red-900/40 hover:text-red-400
                transition-colors cursor-pointer"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

interface MessageRequestsProps {
  onClose: () => void;
}

export default function MessageRequests({ onClose }: MessageRequestsProps) {
  const dispatch = useAppDispatch();
  const { incoming, loading } = useAppSelector((state) => state.requests);
  const { sessionLoading } = useAppSelector((state) => state.auth);
  const isMobile = useIsMobile();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAccept = useCallback(
    async (requestId: string) => {
      setActionLoading(requestId);
      try {
        await dispatch(acceptMessageRequestThunk(requestId)).unwrap();
      } catch {
        // handled by slice
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch],
  );

  const handleReject = useCallback(
    async (requestId: string) => {
      setActionLoading(requestId);
      try {
        await dispatch(rejectMessageRequestThunk(requestId)).unwrap();
      } catch {
        // handled by slice
      } finally {
        setActionLoading(null);
      }
    },
    [dispatch],
  );

  const isLoading = sessionLoading || loading;

  return (
    <div className="fixed inset-0 flex pb-3 items-center justify-center z-50 overflow-hidden">
      <div
        className={`bg-base-200 p-3 overflow-visible ${
          !isMobile && "rounded-2xl"
        } flex flex-col border border-base-content/10 gap-3 w-full h-full`}
      >
        {/* Header — mirrors NewChat exactly */}
        <div className="flex items-center gap-2">
          <IconButton ariaLabel="Back" onClick={onClose}>
            <ArrowLeft />
          </IconButton>
          <div className="relative">
            <h1 className="text-2xl relative font-semibold p-1 flex-1">
              Message Requests
            </h1>
            {incoming.length > 0 && (
              <span className="absolute top-1 -right-3 bg-red-600 text-white text-xs leading-none rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                {incoming.length > 99 ? "99+" : incoming.length}
              </span>
            )}
          </div>
        </div>

        {/* Search — same component as NewChat */}
        <SearchInput />

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl bg-base-100 animate-pulse"
                >
                  <div className="w-11 h-11 rounded-full bg-base-300 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-base-300 rounded w-1/3" />
                    <div className="h-2 bg-base-300 rounded w-1/4" />
                    <div className="h-2 bg-base-300 rounded w-3/4 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : incoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-base-content/40">
              <svg
                className="w-10 h-10 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <p className="text-sm">No message requests</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {incoming.map((request) => (
                <RequestCard
                  key={request._id}
                  request={request}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  actionLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
