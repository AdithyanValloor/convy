import { Response } from "express";

/** Maps legacy chat service errors to HTTP responses. */
export const handleChatError = (res: Response, error: Error) => {
  const message = error.message;

  if (message === "Unauthorized") {
    res.status(401).json({ message });
  } else if (message === "Chat not found") {
    res.status(404).json({ message });
  } else if (message === "Group name is required") {
    res.status(400).json({ message });
  } else if (message === "UserId param not sent") {
    res.status(400).json({ message });
  } else if (message === "Only admins can add new members") {
    res.status(403).json({ message });
  } else if (message === "Only admins can remove members") {
    res.status(403).json({ message });
  } else if (message === "Creator can't be removed") {
    res.status(400).json({ message });
  } else if (message === "Only creator can manage admins") {
    res.status(403).json({ message });
  } else {
    // Preserve the original error server-side while returning a generic response.
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
