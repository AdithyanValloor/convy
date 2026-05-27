import { Router } from "express";
import {
  getMessageRequestsController,
  acceptMessageRequestController,
  rejectMessageRequestController,
} from "../controllers/messageRequest.controller.js";
import { protect } from "../../auth/auth.middleware.js";

const router = Router();

/** Message request routes for authenticated users. */

// Inbox and review actions for pending message requests.
router.get("/", protect, getMessageRequestsController);
router.post("/:requestId/accept", protect, acceptMessageRequestController);
router.post("/:requestId/reject", protect, rejectMessageRequestController);

export { router as messageRequestRouter };
