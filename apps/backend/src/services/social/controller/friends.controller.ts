import { Response, NextFunction } from "express";

import {
  acceptFriendRequest,
  cancelFriendRequest,
  fetchRequests,
  getFriendList,
  rejectFriendRequest,
  removeFriend as removeFriendService,
  sendFriendRequest,
} from "../service/friends.service.js";
import {
  BadRequest,
  Unauthorized,
} from "../../../utils/errors/httpErrors.js";
import {
  emitFriendRemoved,
  emitFriendRequestAccepted,
  emitFriendRequestCancelled,
  emitFriendRequestReceived,
  emitFriendRequestRejected,
  emitFriendRequestSent,
} from "../../../socket/emitters/friend.emitter.js";
import { AuthRequest } from "../../auth/types/authRequest.js";

/** Friend controller handlers for authenticated friendship actions. */

/** Returns the current user's friend list. */
export const getAllFriends = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const friendList = await getFriendList(userId);

    res.status(200).json({
      message: "Friend list fetched",
      friendList,
    });
  } catch (err) {
    next(err);
  }
};

/** Sends a friend request by username and emits request events to both users. */
export const addFriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { username }: { username?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!username) throw BadRequest("Username is required");

    const { request, payload, toUserId } = await sendFriendRequest(
      userId,
      username,
    );

    emitFriendRequestReceived(toUserId, payload);
    emitFriendRequestSent(userId, payload);

    res.status(200).json({
      message: "Friend request sent",
      request,
    });
  } catch (err) {
    next(err);
  }
};

/** Returns incoming and outgoing pending friend requests. */
export const getAllRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) throw Unauthorized();

    const { incoming, outgoing } = await fetchRequests(userId);

    res.status(200).json({
      message: "Friend requests fetched",
      incoming,
      outgoing,
    });
  } catch (err) {
    next(err);
  }
};

/** Accepts a friend request and emits the accepted state to both users. */
// !!!!!! TODO implement chat creation on acceptance and emit new chat to both users; 
// Right now client calling chat creation separately on acceptance, but this can lead to race conditions 
// where the chat isn't created by the time the client tries to fetch it. Better to handle chat 
// creation atomically within the acceptFriendRequest service and emit the new chat ID along with the 
// acceptance event.
export const acceptReq = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id }: { id?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!id) throw BadRequest("Request ID is required");

    const { request, payload, fromUserId, toUserId } =
      await acceptFriendRequest(id, userId);

    emitFriendRequestAccepted(fromUserId, payload);
    emitFriendRequestAccepted(toUserId, payload);

    res.status(200).json({
      message: "Friend request accepted",
      request,
    });
  } catch (err) {
    next(err);
  }
};

/** Rejects a friend request and notifies the original sender. */
export const rejectReq = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id }: { id?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!id) throw BadRequest("Request ID is required");

    const { request, fromUserId, requestId } = await rejectFriendRequest(
      id,
      userId,
    );

    emitFriendRequestRejected(fromUserId, requestId);

    res.status(200).json({
      message: "Friend request rejected",
      request,
    });
  } catch (err) {
    next(err);
  }
};

/** Removes a friend relationship and emits the removal to both users. */
export const removeFriend = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id }: { id?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!id) throw BadRequest("Friend ID is required");

    await removeFriendService(userId, id);

    emitFriendRemoved(userId, id);
    emitFriendRemoved(id, userId);

    res.status(200).json({
      message: "Friend removed successfully",
    });
  } catch (err) {
    next(err);
  }
};

/** Cancels a sent friend request and notifies the original recipient. */
export const cancelReq = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id }: { id?: string } = req.body;
    const userId = req.user?.id;

    if (!userId) throw Unauthorized();
    if (!id) throw BadRequest("Request ID is required");

    const { toUserId, requestId } = await cancelFriendRequest(id, userId);

    emitFriendRequestCancelled(toUserId, requestId);

    res.status(200).json({
      message: "Friend request canceled",
    });
  } catch (err) {
    next(err);
  }
};
