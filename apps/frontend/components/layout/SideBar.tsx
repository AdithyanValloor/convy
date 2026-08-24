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
      icon: <BiSolidMessageSquareDots size={22} />,
      notificationCount: totalUnread,
    },
    {
      title: "Friends",
      icon: <UsersRound size={20} />,
      notificationCount: pendingCount,
    },
    { title: "Call history", icon: <Phone size={20} /> },
  ];

  const bottomButtons: ButtonType[] = [
    {
      title: "Inbox",
      icon: <Inbox size={20} />,
      notificationCount: notificationUnread,
    },
    { title: "Archived chats", icon: <Archive size={20} /> },
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
          relative flex h-11 w-full cursor-pointer items-center justify-center rounded-xl
          transition-all duration-200
          ${
            isActive
              ? "bg-cyan-950/80 text-white"
              : "text-base-content/60 hover:bg-cyan-900/40 hover:text-white"
          }
        `}
      >
        <div className="relative">
          {btn.icon}
          {!!btn.notificationCount && btn.notificationCount > 0 && (
            <UnreadCountBadge
              position="-top-1.5 left-2.5"
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
                ? "bg-cyan-950/80 text-white"
                : "text-base-content/60 hover:bg-cyan-900/40 hover:text-white"
            }
          `}
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
              className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-cyan-400"
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
        className="absolute inset-0 mb-3 flex w-[60px] flex-col justify-between overflow-hidden rounded-2xl bg-transparent py-3"
      >
        {/* Shared active indicator for the desktop navigation stack. */}
        <motion.div
          className="pointer-events-none absolute left-0 z-10 h-6 w-[3px] rounded-r-full bg-cyan-400"
          animate={{
            top: indicatorTop,
            opacity: indicatorVisible ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />

        <div className="flex flex-col gap-2 px-2">
          {buttons.map(renderDesktopButton)}
        </div>

        <div className="flex flex-col gap-2 px-2">
          {bottomButtons.map(renderDesktopButton)}
        </div>
      </div>
    </div>
  );
}
