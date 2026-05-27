"use client";

import { UserRoundPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addFriend } from "@/redux/features/friendsSlice";
import { AnimatePresence, motion } from "framer-motion";

export default function AddFriendInput() {
  const [username, setUsername] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );

  const dispatch = useAppDispatch();
  const { actionLoading } = useAppSelector((state) => state.friends);

  useEffect(() => {
    if (!statusMsg) return;

    const timer = setTimeout(() => {
      setStatusMsg("");
      setStatusType(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [statusMsg]);

  const handleAddFriend = async () => {
    if (!username.trim() || actionLoading) return;

    const value = username.trim();
    setUsername("");
    setStatusMsg("");
    setStatusType(null);

    try {
      await dispatch(addFriend(value)).unwrap();

      setStatusMsg(`Friend request sent to ${value}`);
      setStatusType("success");
    } catch (err) {
      if (typeof err === "string") {
        setStatusMsg(err);
      } else {
        setStatusMsg("Failed to send request");
      }

      setStatusType("error");
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            if (statusMsg) setStatusMsg("");
          }}
          placeholder="Enter friend's Whisp username"
          className={`w-full h-12 pl-5 text-sm rounded-full bg-base-300 transition-colors
          ${
            statusMsg
              ? statusType === "error"
                ? "outline outline-red-500"
                : "outline outline-green-500"
              : "outline outline-transparent hover:outline-base-content/10"
          }
          focus:outline`}
                  />

        <div className="absolute right-0 top-1/2 -translate-y-1/2 px-2 flex items-center">
          <button
            type="button"
            aria-label="Send friend request"
            onClick={handleAddFriend}
            disabled={!username.trim() || actionLoading}
            className="bg-cyan-950 text-white p-2 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-auto"
          >
            <UserRoundPlus size={20} />
          </button>
        </div>
      </div>
      <AnimatePresence>
        {statusMsg && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`text-sm text-center py-2 ${
              statusType === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {statusMsg}!
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
