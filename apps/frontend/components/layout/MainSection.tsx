"use client";

import { JSX, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import CallSection from "../calls/CallSection";
import FriendsSection from "../friends/FriendsSection";
import InboxSection from "../inbox/InboxSection";
import StatusSection from "../status/StatusSection";
import ArchivedChats from "../AchievedChats/ArchievedChats";
import ProfileDropdown from "../User profile/UserProfile";
import NotificationInbox from "../InboxNotification/NotificationInbox";
import { useIsMobile } from "@/utils/screenSize";

/**
 * Props for MainSection.
 * Controls which section is currently active.
 */
interface MainSectionProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

/**
 * MainSection
 *
 * Renders the left-side content area (Inbox, Friends, Calls, etc.).
 * Handles mobile slide behavior when a chat view is active.
 */
export default function MainSection({
  activeTab,
  setActiveTab,
}: MainSectionProps) {
  const pathname = usePathname();

  // Detect whether a chat is currently open
  const isChatOpen = pathname.startsWith("/chat/");


  /* ---------- Mobile detection ---------- */

  const isMobile = useIsMobile()

  /* ---------- Sections ---------- */

  /**
   * Map active tab names to their corresponding sections.
   */
  const sections: Record<string, JSX.Element> = {
    Chats: <InboxSection />,
    Friends: <FriendsSection setActiveTab={setActiveTab} />,
    "Call history": <CallSection />,
    Status: <StatusSection />,
    Inbox: <NotificationInbox setActiveTab={setActiveTab}/>,
    "Archived chats": <ArchivedChats />,
    Settings: (
      <ProfileDropdown
        isOpen
        initialView="settings"
        setActiveTab={setActiveTab}
      />
    ),
    "User profile": (
      <ProfileDropdown
        isOpen
        initialView="profile"
        setActiveTab={setActiveTab}
      />
    ),
  };

  return (
    <div
      className={`flex h-full flex-col text-base-content pb-3 transition-transform duration-300 ease-in-out
        ${isMobile && isChatOpen ? "-translate-x-full" : "translate-x-0"}`}
    >
      <div
        className={`flex h-full flex-col bg-base-200 border border-base-content/10 shadow-md
          ${!isMobile && "rounded-2xl"} 
           overflow-hidden`}
      >
        {sections[activeTab] ?? (
          <div className="p-3 text-gray-500">Select a tab</div>
        )}
      </div>
    </div>
  );
}
