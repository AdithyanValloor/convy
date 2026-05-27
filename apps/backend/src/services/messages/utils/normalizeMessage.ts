import { MessageSocketPayload } from "../types/message.socket.js";

/** Normalizes populated message documents into the socket payload shape. */
export const toMessageSocketPayload = (doc: any): MessageSocketPayload => {
  return {
    _id: doc._id.toString(),
    // Handles both populated chat documents and raw ObjectId values.
    chat: doc.chat._id?.toString?.() ?? doc.chat.toString(),

    sender: {
      _id: doc.sender._id.toString(),
      username: doc.sender.username,
      displayName: doc.sender.displayName,
      profilePicture: doc.sender.profilePicture,
    },

    content: doc.content,
    edited: doc.edited,
    deleted: doc.deleted,

    reactions: doc.reactions.map((r: any) => ({
      emoji: r.emoji,
      user: {
        _id: r.user._id.toString(),
        username: r.user.username,
        displayName: r.user.displayName,
        profilePicture: r.user.profilePicture,
      },
    })),

    replyTo: doc.replyTo
      ? {
          _id: doc.replyTo._id.toString(),
          content: doc.replyTo.content,
          sender: {
            _id: doc.replyTo.sender._id.toString(),
            username: doc.replyTo.sender.username,
            displayName: doc.replyTo.sender.displayName,
          },
        }
      : null,

    linkPreview: doc.linkPreview ?? null,

    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};
