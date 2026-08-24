import { ExtendedError, Socket } from "socket.io";
import { verifyAccessToken } from "../../services/auth/utils/jwt.js";
import cookie from "cookie";

import * as UserAPI from "../../../src/services/user/api/user.api.js";

export const socketAuth = async (
  socket: Socket,
  next: (err?: ExtendedError) => void,
): Promise<void> => {
  try {
    const cookies = cookie.parse(socket.handshake.headers.cookie ?? "");

    const accessToken = cookies.accessToken;

    if (!accessToken) {
      return next(new Error("Unauthorized"));
    }

    const payload = verifyAccessToken(accessToken);
    const user = await UserAPI.findUserByAuthUserId(payload.id);

    if (!user) {
      socket.disconnect();
      return;
    }

    console.log("SOCKER USERID ======================== ", user.id);

    socket.data.userId = user.id;

    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
};
