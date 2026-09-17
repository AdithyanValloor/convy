"use client";

import { Settings, CalendarDays, SquarePen } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import { useAppSelector } from "@/redux/hooks";
import IconButton from "../GlobalComponents/IconButtons";
import { motion, type Variants } from "framer-motion";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface UserProfileProps {
  openSettings: (page?: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

export default function UserProfile({
  openSettings,
}: UserProfileProps) {
  const user = useAppSelector((state) => state.profile.profile);
  const url = useSignedUrl(user?.profilePicture?.key);

  if (!user) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-base-200">
        {/* Settings */}
        <div className="absolute right-4 top-4">
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>

        {/* Profile */}
        <div className="px-5 pt-24">
          <div className="flex items-center gap-4 rounded-2xl border border-base-content/[0.08] bg-base-100 p-4">
            <div className="skeleton h-14 w-14 shrink-0 rounded-full" />

            <div className="flex flex-1 flex-col gap-2">
              <div className="skeleton h-5 w-32 rounded" />
              <div className="skeleton h-3.5 w-24 rounded" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mx-5 mt-4 rounded-2xl border border-base-content/[0.08] bg-base-100 p-4">
          <div className="skeleton mb-3 h-3 w-12 rounded" />

          <div className="flex flex-col gap-1.5">
            <div className="skeleton h-3.5 w-full rounded" />
            <div className="skeleton h-3.5 w-4/5 rounded" />
          </div>
        </div>

        {/* Member */}
        <div className="mx-5 mt-4 flex items-center justify-between rounded-2xl border border-base-content/[0.08] bg-base-100 p-4">
          <div className="skeleton h-3.5 w-28 rounded" />
          <div className="skeleton h-3 w-14 rounded" />
        </div>

        {/* Melo accent */}
        <div
          className="
            absolute bottom-0 left-0 h-[2px] w-full
            bg-gradient-to-r
            from-[#17A6E8]
            via-[#7029F7]
            to-[#F73EC9]
          "
        />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="
        relative flex h-full w-full
        flex-col overflow-hidden
        bg-base-200
      "
    >
      {/* ───────────── Header ───────────── */}

      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-base-content/35">
            Profile
          </p>
        </div>

        <IconButton
          onClick={() => openSettings()}
          ariaLabel="Open settings"
        >
          <Settings size={18} strokeWidth={1.7} />
        </IconButton>
      </div>

      {/* ───────────── Profile Card ───────────── */}

      <motion.div
        variants={itemVariants}
        className="relative mx-5 mt-6"
      >
        <div
          onClick={() => openSettings("Profile")}
          className="
            group relative flex w-full
            cursor-pointer items-center
            gap-4 overflow-hidden
            rounded-2xl
            border border-base-content/[0.08]
            bg-base-100
            p-4
            text-left
            transition-all duration-200
            hover:border-base-content/[0.16]
            hover:bg-base-100
          "
        >
          {/* Subtle brand glow */}
          <div
            className="
              pointer-events-none
              absolute -right-12 -top-12
              h-28 w-28
              rounded-full
              bg-[#7029F7]/[0.08]
              blur-3xl
              transition-opacity duration-300
              group-hover:opacity-100
            "
          />

          <ProfilePicture
            src={url || ""}
            size="lg"
            status="online"
          />

          <div className="relative min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold leading-tight text-base-content">
              {user.displayName || user.username}
            </h2>

            <div className="mt-1 flex items-center gap-2 text-sm text-base-content/50">
              <p className="truncate">@{user.username}</p>

              {user.pronouns && (
                <>
                  <span className="text-base-content/25">•</span>
                  <span>{user.pronouns}</span>
                </>
              )}
            </div>
          </div>

          {/* Edit */}
          <div
            className="
              relative
              opacity-40
              transition-all duration-200
              group-hover:opacity-100
            "
          >
            <IconButton ariaLabel="Edit profile">
              <SquarePen size={16} strokeWidth={1.8} />
            </IconButton>
          </div>
        </div>
      </motion.div>

      {/* ───────────── About ───────────── */}

      <motion.div
        variants={itemVariants}
        className="
          mx-5 mt-4
          rounded-2xl
          border border-base-content/[0.08]
          bg-base-100
          p-4
        "
      >
        <p
          className="
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.16em]
            text-base-content/35
          "
        >
          About
        </p>

        <p className="mt-2 text-sm leading-relaxed text-base-content/75">
          {user.bio || "This user hasn't added a bio yet."}
        </p>
      </motion.div>

      {/* ───────────── Member Info ───────────── */}

      <motion.div
        variants={itemVariants}
        className="
          mx-5 mt-4
          flex items-center justify-between
          rounded-2xl
          border border-base-content/[0.08]
          bg-base-100
          px-4 py-3.5
        "
      >
        <div className="flex items-center gap-2.5 text-xs text-base-content/55">
          <CalendarDays
            size={15}
            strokeWidth={1.7}
            className="text-base-content/40"
          />

          <span>
            Joined{" "}
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  },
                )
              : "—"}
          </span>
        </div>

        <span
          className="
            rounded-full
            bg-gradient-to-r
            from-[#17A6E8]/15
            via-[#7029F7]/15
            to-[#F73EC9]/15
            px-2.5 py-1
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.12em]
            text-[#7029F7]
          "
        >
          Member
        </span>
      </motion.div>

      {/* Melo accent */}
      <div
        className="
          absolute bottom-0 left-0
          h-[3px] w-full
          bg-gradient-to-r
          from-[#17A6E8]
          via-[#7029F7]
          to-[#F73EC9]
        "
      />
    </motion.div>
  );
}