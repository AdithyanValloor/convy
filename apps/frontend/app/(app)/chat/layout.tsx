"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

import SideBar from "@/components/layout/SideBar";
import MainSection from "@/components/layout/MainSection";

import { bootstrapApp } from "@/redux/features/bootstrapSlice";
import { getSocket, disconnectSocket, joinGroupRoom } from "@/utils/socket";
import type { Socket } from "socket.io-client";
import { useIsMobile } from "@/utils/screenSize";
import { SocketContext } from "@/context/SocketContext";
import {
  CallHistoryPage,
  FriendsPage,
  InboxPage,
  SettingsPage,
  UserProfilePage,
} from "./Pages";
import { Logo } from "@/app/Logo";
import { Glows, MinimalGlow } from "@/components/Glows/Glows";

const CHILDREN_TABS = new Set(["Chats", "Archived chats"]);

function renderTabPage(activeTab: string) {
  switch (activeTab) {
    case "Call history":
      return <CallHistoryPage />;
    case "Inbox":
      return <InboxPage />;
    case "Settings":
      return <SettingsPage />;
    case "User profile":
      return <UserProfilePage />;
    case "Friends":
      return <FriendsPage />;
    default:
      return null;
  }
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();

  const { user, sessionLoading } = useAppSelector((state) => state.auth);


  const socketRef = useRef<Socket | null>(null);
  const allChatIdsRef = useRef<string[]>([]);

  const [bootstrapDone, setBootstrapDone] = useState(false);

  const [activeTab, setActiveTab] = useState("Chats");

  const isChatOpen = pathname !== "/chat";

  useEffect(() => {
    const suppress = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", suppress);
    return () => document.removeEventListener("contextmenu", suppress);
  }, []);

  const isMobile = useIsMobile();

  const chats = useAppSelector((state) => state.chat.chats);

  useEffect(() => {
    if (!bootstrapDone) return;

    chats.forEach((chat) => {
      if (!allChatIdsRef.current.includes(chat._id)) {
        allChatIdsRef.current.push(chat._id);
        joinGroupRoom(chat._id);
      }
    });
  }, [chats, bootstrapDone]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!user) {
      setBootstrapDone(false);
      return;
    }

    dispatch(bootstrapApp())
      .unwrap()
      .then((res) => {
        allChatIdsRef.current = res.chats.map((c) => c._id);
        console.log("ALL CHATS : ", allChatIdsRef.current);
        
        setBootstrapDone(true);
      })
      .catch((err) => {
        console.error("❌ Bootstrap failed", err);
        setBootstrapDone(true);
      });
  }, [user, sessionLoading, dispatch]);

  useEffect(() => {
    if (!user || !bootstrapDone) return;
    socketRef.current = getSocket(user._id, allChatIdsRef.current);
    return () => disconnectSocket();
  }, [user?._id, bootstrapDone]);


  if (!user || !bootstrapDone) {
    return (
      <div className="h-screen flex items-center justify-center text-base-content bg-base-200">
        <span className="loading loading-spinner loading-xl" />
      </div>
    );
  }

  return (
    <SocketContext.Provider value={socketRef.current}>
      <div className="relative  flex flex-col bg-base-300 h-screen transition-all ease-in-out duration-300 bg-gradient-to-br from-base-300 via-base-200 to-base-100 overflow-y-hidden">
        {/* <Glows/> */}
        {/* <MinimalGlow /> */}

        {/* Desktop top bar */}
    
        <Logo/>

        {/* Main body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Desktop sidebar (icon strip, 60px) */}
          <div className="hidden md:block w-[60px] shrink-0">
            <SideBar setActiveTab={setActiveTab} activeTab={activeTab} />
          </div>

          {/* Chat list panel —
              Desktop: always rendered, fixed width.
              Mobile:  only rendered when NO chat is open — unmounting it removes
                      all its <input> elements from the DOM so Chrome on Android
                      cannot auto-focus them and open the keyboard. */}
          {(!isMobile || !isChatOpen) && (
            <div
              className={`
                transition-all duration-300
                ${isMobile ? "flex-1 w-full" : "w-[350px] shrink-0 mr-2"}
              `}
            >
              <MainSection setActiveTab={setActiveTab} activeTab={activeTab} />
            </div>
          )}

          {/* Chat content panel */}
          <div
            className={`
              transition-all duration-300
              ${
                isMobile
                  ? isChatOpen
                    ? "flex-1 w-full flex flex-col"
                    : "hidden"
                  : "flex-1"
              }
            `}
          >
            <div className={CHILDREN_TABS.has(activeTab) ? "h-full" : "hidden"}>
              {children}
            </div>
            {!CHILDREN_TABS.has(activeTab) && renderTabPage(activeTab)}
          </div>
        </div>

        {/* Mobile bottom navigation bar */}
        <div className="md:hidden shrink-0 border-t border-base-content/10 bg-base-300">
          <SideBar setActiveTab={setActiveTab} activeTab={activeTab} />
        </div>
      </div>
    </SocketContext.Provider>
  );
}
