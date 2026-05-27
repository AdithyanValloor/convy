"use client";

import { Check, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchRequests,
  acceptFriend,
  rejectFriend,
  cancelFriend,
  FriendRequest,
} from "@/redux/features/friendsSlice";
import FriendCard from "../Message/FriendCard";
import IconButton from "../GlobalComponents/IconButtons";
import { accessChat } from "@/redux/features/chatSlice";
import {
  deleteNotification,
  deleteNotificationLocal,
  InboxNotification,
} from "@/redux/features/notificationSlice";

interface RequestsProps {
  searchQuery: string;
}

export default function Requests({ searchQuery }: RequestsProps) {
  const dispatch = useAppDispatch();

  const { requests, requestLoading } = useAppSelector((state) => state.friends);
  const { notifications } = useAppSelector((state) => state.notifications);
  const { incoming, outgoing } = requests;

  const filterRequests = (list: FriendRequest[], type: "incoming" | "outgoing") => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((r) => {
      const user = type === "incoming" ? r.from : r.to;
      return (
        user.username.toLowerCase().includes(q) ||
        (user.displayName ?? "").toLowerCase().includes(q)
      );
    });
  };

  const filteredIncoming = useMemo(
    () => filterRequests(incoming, "incoming"),
    [incoming, searchQuery],
  );

  const filteredOutgoing = useMemo(
    () => filterRequests(outgoing, "outgoing"),
    [outgoing, searchQuery],
  );

  useEffect(() => {
    dispatch(fetchRequests());
  }, [dispatch]);

  const renderRequestCard = (request: FriendRequest, type: "incoming" | "outgoing") => {
    const user = type === "incoming" ? request.from : request.to;
    const notification: InboxNotification | undefined = notifications.find(
      (n) => n.friendRequest === request._id,
    );

    return (
      <FriendCard
        key={request._id}
        msgId={request._id}
        user={{
          name: user.username,
          displayName: user.displayName ?? user.username,
          profilePicture: user.profilePicture,
        }}
        chatType="other"
        hideLastMessage
        rightSlot={
          type === "incoming" ? (
            <div className="flex gap-1">
              <IconButton
                ariaLabel="Accept friend request"
                onClick={() => {
                  dispatch(acceptFriend(request._id));
                  dispatch(accessChat({ userId: request.from._id }));
                  if (notification) {
                    dispatch(deleteNotification(notification._id));
                    dispatch(deleteNotificationLocal(notification._id));
                  }
                }}
              >
                <Check size={20} />
              </IconButton>
              <IconButton
                ariaLabel="Reject friend request"
                onClick={() => {
                  dispatch(rejectFriend(request._id));
                  if (notification) {
                    dispatch(deleteNotification(notification._id));
                    dispatch(deleteNotificationLocal(notification._id));
                  }
                }}
              >
                <X size={20} />
              </IconButton>
            </div>
          ) : (
            <IconButton
              ariaLabel="Cancel friend request"
              onClick={() => dispatch(cancelFriend(request._id))}
            >
              <X size={20} />
            </IconButton>
          )
        }
      />
    );
  };

  if (requestLoading) {
    return (
      <div className="flex justify-center py-6">
        <span className="loading loading-spinner loading-sm" />
      </div>
    );
  }

  const noResults =
    searchQuery.trim() &&
    filteredIncoming.length === 0 &&
    filteredOutgoing.length === 0;

  if (noResults) {
    return (
      <p className="p-3 text-center opacity-70">
        No requests match &ldquo;{searchQuery}&rdquo;
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {filteredIncoming.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-center uppercase opacity-70 mb-2">
            Received
          </h2>
          <hr className="text-base-content/10 pb-2" />
          {filteredIncoming.map((r) => renderRequestCard(r, "incoming"))}
        </section>
      )}

      {filteredOutgoing.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-center uppercase opacity-70 mb-2">
            Sent
          </h2>
          <hr className="text-base-content/10 pb-2" />
          {filteredOutgoing.map((r) => renderRequestCard(r, "outgoing"))}
        </section>
      )}
    </div>
  );
}