/** Friend socket payload types for real-time friendship events. */

/** Describes the user details embedded in friend socket payloads. */
export interface FriendUserPayload {
  _id: string;
  username: string;
  displayName?: string;
  profilePicture?: {
    url?: string | null;
  };
}

/** Describes the normalized payload emitted for friend request events. */
export interface FriendRequestSocketPayload {
  _id: string;
  from: FriendUserPayload;
  to: FriendUserPayload;
  status: "pending" | "accepted" | "rejected";
  createdAt?: string;
}
