import { Application } from "express";

import { userRouter } from "./services/user/routes/user.routes.js";
import { profileRouter } from "./services/user/routes/profile.routes.js";

import { chatRouter } from "./services/chat/routes/chat.routes.js";
import { groupChatRouter } from "./services/chat/routes/group.routes.js";
import { messageRouter } from "./services/messages/routes/messages.routes.js";

import { inboxNotificationsRouter } from "./services/notifications/routes/inboxNotification.routes.js";
import { messageRequestRouter } from "./services/messages/routes/messageRequest.routes.js";
import { s3Router } from "./services/media/s3.routes.js";
import { authRouter } from "./services/auth/routes/auth.routes.js";
import { friendRouter } from "./services/social/routes/friend.routes.js";
import { blockRouter } from "./services/social/routes/block.routes.js";

// Central place for attaching feature routers to the app instance.
export const registerRoutes = (app: Application): void => {
  app.use("/api/auth", authRouter)
  app.use("/api/user", userRouter);
  app.use("/api/profile", profileRouter);
  app.use("/api/friends", friendRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/group", groupChatRouter);
  app.use("/api/message", messageRouter);
  app.use("/api/block", blockRouter);
  app.use("/api/notifications", inboxNotificationsRouter);
  app.use("/api/message-request", messageRequestRouter);

  app.use("/api/file", s3Router);
};
