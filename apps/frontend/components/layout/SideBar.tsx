"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Inbox,
  MessageCircleMore,
  Phone,
  Settings,
  UsersRound,
} from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BiSolidMessageSquareDots } from "react-icons/bi";
import defaultPFP from "@/public/default-pfp.png";
import { useAppSelector } from "@/redux/hooks";
import { selectActiveUnreadTotal } from "@/redux/selectors/unreadSelectors";
import { useIsMobile } from "@/utils/screenSize";
import { UnreadCountBadge } from "../Notification/UnreadCountBadge";
import { useSignedUrl } from "@/hooks/useSignedUrl";

import { AiFillMessage } from "react-icons/ai";
import { IoCall } from "react-icons/io5";

import { FaInbox } from "react-icons/fa";
import { FaArchive } from "react-icons/fa";
import { FaUserFriends } from "react-icons/fa";

interface SideBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface ButtonType {
  title: string;
  icon: React.ReactNode;
  notificationCount?: number;
}

export default function SideBar({ activeTab, setActiveTab }: SideBarProps) {
  const [indicatorTop, setIndicatorTop] = useState(0);
  const [indicatorVisible, setIndicatorVisible] = useState(false);

  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sidebarRef = useRef<HTMLDivElement>(null);

  const totalUnread = useAppSelector(selectActiveUnreadTotal);
  const { requests } = useAppSelector((state) => state.friends);
  const notificationUnread = useAppSelector(
    (state) => state.notifications.unreadCount,
  );
  const user = useAppSelector((state) => state.profile.profile);

  const url = useSignedUrl(user?.profilePicture?.key);

  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isChatOpen = pathname.startsWith("/chat/");
  const pendingCount = requests.incoming.length;

  useEffect(() => {
    const activeBtn = buttonRefs.current[activeTab];
    const sidebar = sidebarRef.current;

    if (!activeBtn || !sidebar) return;

    const btnRect = activeBtn.getBoundingClientRect();
    const sidebarRect = sidebar.getBoundingClientRect();

    // Keep the active rail aligned with the currently selected desktop button.
    setIndicatorTop(btnRect.top - sidebarRect.top + btnRect.height / 2 - 12);
    setIndicatorVisible(true);
  }, [activeTab]);

  const buttons: ButtonType[] = [
    {
      title: "Chats",
      icon: <AiFillMessage size={22} />,
      notificationCount: totalUnread,
    },
    {
      title: "Friends",
      icon: <FaUserFriends size={20} />,
      notificationCount: pendingCount,
    },
    { title: "Call history", icon: <IoCall size={20} /> },
  ];

  const bottomButtons: ButtonType[] = [
    {
      title: "Inbox",
      icon: <FaInbox size={20} />,
      notificationCount: notificationUnread,
    },
    { title: "Archived chats", icon: <FaArchive size={20} /> },
    { title: "Settings", icon: <Settings size={20} /> },
    {
      title: "User profile",
      icon: (
        <Image
          src={url ?? defaultPFP}
          unoptimized
          alt="profile"
          width={35}
          height={35}
          className="cursor-pointer rounded-full border object-cover"
        />
      ),
    },
  ];

  const mobileButtons: ButtonType[] = [
    {
      title: "Chats",
      icon: <MessageCircleMore strokeWidth={1.5} size={22} />,
      notificationCount: totalUnread,
    },
    {
      title: "Friends",
      icon: <UsersRound strokeWidth={1.5} size={22} />,
      notificationCount: pendingCount,
    },
    { title: "Call history", icon: <Phone strokeWidth={1.5} size={22} /> },
    {
      title: "Inbox",
      icon: <Inbox size={20} />,
      notificationCount: notificationUnread,
    },
    {
      title: "User profile",
      icon: (
        <Image
          src={url ?? defaultPFP}
          unoptimized
          alt="profile"
          width={35}
          height={35}
          className="cursor-pointer rounded-full border object-cover"
        />
      ),
    },
  ];

  const renderDesktopButton = (btn: ButtonType) => {
    const isActive = activeTab === btn.title;

    return (
      <button
        key={btn.title}
        ref={(el) => {
          buttonRefs.current[btn.title] = el;
        }}
        onClick={() => setActiveTab(btn.title)}
        className={`
            relative
            flex h-11 w-11
            cursor-pointer
            items-center justify-center
            rounded-2xl
            transition-all duration-200
            bg-base-content/5
          ${
            isActive
              ? "text-white scale-105"
              : "text-base-content/55 hover:bg-base-content/[0.1] hover:scale-105 hover:text-base-content/90"
          }
          `}
        style={
          isActive
            ? {
                background:
                  "linear-gradient(135deg, #17A6E8 5%, #7029F7 50%, #F73EC9 90%)",
              }
            : undefined
        }
      >
        <div className="relative">
          {btn.icon}

          {!!btn.notificationCount && btn.notificationCount > 0 && (
            <UnreadCountBadge
              position="-top-3.5 left-3.5"
              count={btn.notificationCount}
            />
          )}
        </div>
      </button>
    );
  };

  const renderMobileButton = (btn: ButtonType) => {
    const isActive = activeTab === btn.title;
    const label =
      btn.title === "Call history"
        ? "Calls"
        : btn.title === "User profile"
          ? "Profile"
          : btn.title;

    return (
      <div key={btn.title} className="relative flex-1">
        <button
          onClick={() => setActiveTab(btn.title)}
          className={`
            relative flex w-full flex-col items-center justify-center gap-1 rounded-xl h-13
            transition-all duration-200
            ${
              isActive
                ? "text-white"
                : "text-base-content/55 hover:bg-base-content/[0.06] hover:text-base-content/90"
            }
          `}
          style={
            isActive
              ? {
                  background:
                    "linear-gradient(135deg, rgba(23,166,232,0.25) 0%, rgba(112,41,247,0.25) 55%, rgba(247,62,201,0.25) 100%)",
                }
              : undefined
          }
        >
          <div className="relative">
            {btn.icon}
            {!!btn.notificationCount && btn.notificationCount > 0 && (
              <UnreadCountBadge
                position="-top-1 -right-2"
                count={btn.notificationCount}
              />
            )}
          </div>

          {isActive && (
            <motion.div
              layoutId="mobileActiveIndicator"
              className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full"
              style={{
                background: "linear-gradient(90deg, #17A6E8, #7029F7, #F73EC9)",
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      </div>
    );
  };

  if (isMobile) {
    if (isChatOpen) return null;

    return (
      <div
        ref={sidebarRef}
        className="absolute bottom-0 left-0 w-full py-2 pt-1"
      >
        <div className=" flex w-full items-center justify-around gap-2 bg-base-100 p-2 shadow">
          {mobileButtons.map(renderMobileButton)}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-50 h-full flex-shrink-0">
      <div
        ref={sidebarRef}
        className="
        absolute inset-0 mb-3
        flex w-[60px] flex-col
        justify-between
        overflow-hidden
        rounded-xl
        py-3
        backdrop-blur-xl
      "
      >
        {/* Active indicator */}
        <motion.div
          className="
            pointer-events-none
            absolute left-0 z-10
            h-6 w-[4px]
            rounded-r-full
          "
          style={{
            background:
              "linear-gradient(180deg, #FFB347 0%, #FF7A59 50%, #F73EC9 100%)",
          }}
          animate={{
            top: indicatorTop,
            opacity: indicatorVisible ? 1 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />

        {/* Primary navigation */}
        <div className="flex flex-col gap-2 px-2">
          {buttons.map(renderDesktopButton)}
        </div>

        {/* Secondary navigation */}
        <div className="flex flex-col gap-2 px-2">
          {bottomButtons.map(renderDesktopButton)}
        </div>
      </div>
    </div>
  );
}
