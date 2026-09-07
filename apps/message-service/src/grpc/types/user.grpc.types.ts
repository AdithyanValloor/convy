
export interface Timestamp {
  seconds: string;
  nanos: number;
}

export interface UserDTOResponse {
  id: string;
  username: string;
  displayName: string;

  pronouns?: string;
  status?: string;
  bio?: string;

  dateOfBirth?: Timestamp;
  profilePicture: {
    key?: string;
  };
  isBanned: boolean;
  isActive: boolean;
  banExpiry?: Timestamp;
  banType?: string;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  scheduledDeletionAt?: Timestamp;
  deletionWarningEmailSentAt?: Timestamp;
  deactivatedAt?: Timestamp;
  privacy: {
    friendRequests: string;
    readReceipts: boolean;
    typingIndicators: boolean;
  };
  notificationSettings: {
    allNotifications: boolean;
    newMessages: boolean;
    mentions: boolean;
    replies: boolean;
    friendRequests: boolean;
    friendRequestAccepted: boolean;
    groupAdded: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface FetchUsersRequest {
  userIds: string[];
}

export interface UserTargetRequest {
  userId: string;
}

export interface ProtoPrivacy {
  friendRequests?: string;
  readReceipts: boolean;
  typingIndicators: boolean;
}

export interface ProtoGetUserPrivacyResponse {
  privacy?: ProtoPrivacy;
}

export interface UserPrivacy {
  friendRequests: "everyone" | "friends" | "nobody";
  readReceipts: boolean;
  typingIndicators: boolean;
}
