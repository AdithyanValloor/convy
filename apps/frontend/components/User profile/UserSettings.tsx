"use client";

import { useState } from "react";
import { logoutUser } from "@/redux/features/authSlice";
import { Bell, Palette, ChevronRight } from "lucide-react";
import { SubPage } from "./UserSettingsSubPages";
import EditProfileForm from "./Settings Subpages/EditProfilePage";
import ThemeSettings from "./Settings Subpages/ThemeSettings";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import ConfirmModal from "../GlobalComponents/ConfirmModal";
import Image from "next/image";
import defaultPFP from "@/public/default-pfp.png";
import { LuLogOut, LuUserRoundCog, LuUserRoundPen } from "react-icons/lu";
import { BsShieldLock } from "react-icons/bs";
import AccountSettings from "./Settings Subpages/AccountSettings";
import PrivacySettings from "./Settings Subpages/PrivacySettings";
import NotificationSettings from "./Settings Subpages/Notificationsettings";
import { useSignedUrl } from "@/hooks/useSignedUrl";

interface UserSettingsProps {
  onBack: () => void;
  activePage: string | null;
  setActivePage: (page: string | null) => void;
}

interface SettingsItem {
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  danger?: boolean;
}

export default function UserSettings({
  onBack,
  activePage,
  setActivePage,
}: UserSettingsProps) {
  const [showLogout, setShowLogout] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.profile.profile);
  const url = useSignedUrl(user?.profilePicture?.key) || defaultPFP;


  const handleLogout = async () => {
    await dispatch(logoutUser());
    window.location.replace('/login');
  };

  const settingsItems: SettingsItem[] = [
    {
      label: "Profile",
      description: "Display name, bio, pronouns",
      icon: LuUserRoundPen,
      action: () => setActivePage("Profile"),
    },
    {
      label: "Account",
      description: "Email, password, account actions",
      icon: LuUserRoundCog,
      action: () => setActivePage("Account"),
    },
    {
      label: "Privacy",
      description: "Visibility, messaging, discoverability",
      icon: BsShieldLock,
      action: () => setActivePage("Privacy"),
    },
    {
      label: "Notifications",
      description: "Alerts, sounds, and preferences",
      icon: Bell,
      action: () => setActivePage("Notifications"),
    },
    {
      label: "Theme",
      description: "Appearance and color scheme",
      icon: Palette,
      action: () => setActivePage("Theme"),
    },
    {
      label: "Logout",
      description: "Sign out of your account",
      icon: LuLogOut,
      action: () => setShowLogout(true),
      danger: true,
    },
  ];

  if (activePage) {
    return (
      <SubPage title={activePage} onBack={() => setActivePage(null)}>
        {activePage === "Profile" && (
          <EditProfileForm onBack={() => setActivePage(null)} />
        )}
        {activePage === "Account" && <AccountSettings />}
        {activePage === "Theme" && <ThemeSettings />}
        {activePage === "Notifications" && <NotificationSettings />}
        {activePage === "Privacy" && <PrivacySettings />}
      </SubPage>
    );
  }

  const generalItems = settingsItems.filter((i) => !i.danger);
  const dangerItems = settingsItems.filter((i) => i.danger);

  return (
    <>
      <div className="w-full h-full relative">
        {/* Header */}
        <div className="flex items-center gap-2 p-3 justify-between border-b border-base-content/10">
          <h2 className="text-2xl font-semibold text-base-content p-1">
            Settings
          </h2>
          <div className="bg-base-content/10 hover:bg-base-content/80 transition-colors rounded-full">
            <Image
              src={url}
              alt="profile"
              width={40}
              height={40}
              onClick={onBack}
              className="rounded-full object-cover border cursor-pointer"
            />
          </div>
        </div>

        {/* General items */}
        <div className="p-3 flex flex-col gap-1">
          {generalItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full flex items-center justify-between gap-3 p-3 py-4 rounded-lg
                  hover:bg-base-content/10 transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-base-content/60 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-base-content">
                      {item.label}
                    </p>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className="text-base-content/30 group-hover:translate-x-0.5 transition-transform shrink-0"
                />
              </button>
            );
          })}

          {/* Divider */}
          <div className="my-2 border-t border-base-content/10" />

          {/* Danger items */}
          {dangerItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full flex items-center justify-between gap-3 p-3 py-4 rounded-lg
                  hover:bg-base-content/10 transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className="text-red-400 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-400">
                      {item.label}
                    </p>
                    <p className="text-xs text-base-content/50 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className="text-red-400/40 group-hover:translate-x-0.5 transition-transform shrink-0"
                />
              </button>
            );
          })}
        </div>
      </div>

      {showLogout && (
        <ConfirmModal
          open
          title="Confirm Logout"
          description="Are you sure you want to log out?"
          confirmText="Logout"
          onCancel={() => setShowLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </>
  );
}