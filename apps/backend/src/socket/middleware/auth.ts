import { ExtendedError, Socket } from "socket.io";
import { verifyAccessToken } from "../../services/auth/utils/jwt.js";
import cookie from "cookie";

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

    socket.data.userId = payload.id;
    
    next();
  } catch (error) {
    next(new Error("Unauthorized"));
  }
};
