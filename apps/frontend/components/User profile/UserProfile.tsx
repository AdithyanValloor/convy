"use client";

import UserProfile from "./UserProfileContent";
import UserSettings from "./UserSettings";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProfile } from "@/redux/features/profileSlice";

interface ProfileDropdownProps {
  isOpen: boolean;
  initialView: "profile" | "settings";
  setActiveTab: (tab: string) => void;
}

export default function ProfileDropdown({
  isOpen,
  initialView,
  setActiveTab,
}: ProfileDropdownProps) {
  const dispatch = useAppDispatch();
  const { fetched, loading } = useAppSelector((state) => state.profile);

  const [view, setView] = useState<"profile" | "settings">(initialView);
  const [activePage, setActivePage] = useState<string | null>(null);

  useEffect(() => {
  if (!isOpen) return;

  setView(initialView);

  if (!fetched && !loading) {
    dispatch(fetchProfile());
  }
}, [isOpen, initialView, fetched, loading, dispatch]);

  const openSettings = (page?: string) => {
    setView("settings");
    if (page) setActivePage(page);
  };

  const handleBackToProfile = () => {
    setView("profile");
    setActivePage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-full">
      {view === "settings" ? (
        <UserSettings
          onBack={() => {
            handleBackToProfile();
            setActiveTab("User profile");
          }}
          activePage={activePage}
          setActivePage={setActivePage}
        />
      ) : (
        <UserProfile
          openSettings={(page?: string) => {
            openSettings(page);
            setActiveTab("Settings");
          }}
        />
      )}
    </div>
  );
}
