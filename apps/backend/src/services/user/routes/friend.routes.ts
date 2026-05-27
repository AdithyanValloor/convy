import { Router } from "express";
import { protect } from "../../auth/auth.middleware.js";
import {
  acceptReq,
  addFriend,
  cancelReq,
  getAllFriends,
  getAllRequests,
  rejectReq,
  removeFriend,
} from "../controllers/friends.controller.js";

const router = Router();

/** Friend routes for authenticated friendship actions. */

// Friend list and request management for authenticated users.
router.get("/", protect, getAllFriends);

// Friend request lifecycle routes.
router.post("/", protect, addFriend);
router.get("/requests", protect, getAllRequests);
router.post("/accept", protect, acceptReq);
router.post("/reject", protect, rejectReq);
router.post("/cancel", protect, cancelReq);

// Friend removal route.
router.post("/remove", protect, removeFriend);

export { router as friendRouter };
