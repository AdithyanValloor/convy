export interface UserDTO {
  id: string;

  username: string;
  displayName: string;

  pronouns?: string | null;
  status?: string | null;
  bio?: string | null;

  dateOfBirth?: Date | null;

  profilePicture: {
    key: string | null;
  };

  isBanned: boolean;
  isActive: boolean;

  banExpiry: Date | null;
  banType: "temporary" | "permanent" | null;

  isDeleted: boolean;
  deletedAt: Date | null;
  scheduledDeletionAt: Date | null;
  deletionWarningEmailSentAt: Date | null;
  deactivatedAt: Date | null;

  privacy: {
    friendRequests: "everyone" | "friends" | "nobody";
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

  createdAt: Date;
  updatedAt: Date;
}
