import { logger } from "./logger.js";

export const authServiceLogger = logger.child({
  component: "AuthService",
});