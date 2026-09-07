import { chatRouter } from "./modules/chat/routes/chat.routes.js";
import { groupChatRouter } from "./modules/chat/routes/group.routes.js";
import { messageRouter } from "./modules/messages/routes/messages.routes.js";
import { Application } from "express";

export const registerRoutes = (app: Application): void => {
  app.use("/api/messages", messageRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/group", groupChatRouter);
};
