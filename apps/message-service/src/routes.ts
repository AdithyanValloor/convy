import { chatRouter } from "./modules/chat/routes/chat.routes.js";
import { groupChatRouter } from "./modules/chat/routes/group.routes.js";
import { messageRequestRouter } from "./modules/messages/routes/messageRequest.routes.js";
import { messageRouter } from "./modules/messages/routes/messages.routes.js";
import { Application } from "express";

export const registerRoutes = (app: Application): void => {
  app.use("/api/message-service/message", messageRouter);
  app.use("/api/message-service/message-request", messageRequestRouter);
  app.use("/api/message-service/chat", chatRouter);
  app.use("/api/message-service/group", groupChatRouter);
};
