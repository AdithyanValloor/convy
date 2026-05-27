"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check } from "lucide-react";
import { LuUserCheck, LuMessageSquare } from "react-icons/lu";
import { BsShieldLock } from "react-icons/bs";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useAppDispatch } from "@/redux/hooks";
import {
  fetchPrivacySettings,
  updatePrivacySettings,
} from "@/redux/features/privacySlice";

import type { PrivacySettings } from "@/redux/features/privacySlice";

type Section = "interactions" | "messaging" | null;
type VisibilityOption = "everyone" | "friends" | "nobody";

// ---------------------------------------------------------------------------
// Shared sub-components (unchanged from original)
// ---------------------------------------------------------------------------

function SectionRow({
  icon: Icon, label, description, badge, onClick,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 p-3 py-4 rounded-lg hover:bg-base-content/10 transition-colors cursor-pointer group text-left"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-base-content/60 shrink-0" />
        <div>
          <p className="text-sm font-medium text-base-content">{label}</p>
          <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && <span className="text-xs text-base-content/40 font-medium">{badge}</span>}
        <ChevronRight size={15} className="text-base-content/30 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
}

function ToggleRow({
  label, description, value, onChange, disabled,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-1">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-base-content cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
      </div>
      <label htmlFor={id} className="relative shrink-0 w-10 h-[22px] cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          aria-label={label}
        />
        <span className={`block w-10 h-[22px] rounded-full transition-colors duration-200 ${value ? "bg-green-700" : "bg-base-content/20"} ${disabled ? "opacity-50" : ""}`} />
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
          style={{ left: value ? "22px" : "3px" }}
        />
      </label>
    </div>
  );
}

function VisibilityPicker({
  label, value, onChange, options = [
    { key: "everyone" as VisibilityOption, label: "Everyone" },
    { key: "friends" as VisibilityOption, label: "Friends only" },
    { key: "nobody" as VisibilityOption, label: "Nobody" },
  ],
}: {
  label: string;
  value: VisibilityOption;
  onChange: (v: VisibilityOption) => void;
  options?: { key: VisibilityOption; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-base-content/80">{label}</p>
      <div className="flex flex-col gap-1">
        {options.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-colors
              ${value === opt.key
                ? "bg-base-content/15 text-base-content font-medium"
                : "bg-base-300 text-base-content/60 hover:bg-base-content/10"
              }`}
          >
            {opt.label}
            {value === opt.key && <Check size={14} className="text-green-500" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function SaveBar({
  hasChanges, onReset, loading,
}: {
  hasChanges: boolean;
  onReset: () => void;
  loading?: boolean;
}) {
  return (
    <AnimatePresence>
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="gap-2 flex flex-col mt-2 bg-base-100 shadow border border-base-content/10 p-2 pl-4 rounded-xl"
        >
          <p className="text-sm">You have made changes! Save changes?</p>
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              onClick={onReset}
              disabled={loading}
              className="px-2 py-2 text-blue-400 hover:underline underline-offset-2 transition-all cursor-pointer disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 cursor-pointer rounded-xl bg-green-700 text-white hover:bg-green-900 transition disabled:opacity-60"
            >
              {loading ? <span className="loading loading-dots loading-sm" /> : "Save Changes"}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest px-1 pt-2 pb-0.5">
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Section: Interactions
// ---------------------------------------------------------------------------
function InteractionsSection() {
  const dispatch = useAppDispatch();
  const { settings, saving, error, fetched, loading } = useSelector(
    (s: RootState) => s.privacy,
  );

  const [local, setLocal] = useState({
    friendRequests: settings.friendRequests,
  });

  // Sync local state when settings load from server
  useEffect(() => {
    if (fetched) {
      setLocal({ friendRequests: settings.friendRequests });
    }
  }, [fetched, settings.friendRequests]);

  const hasChanges = local.friendRequests !== settings.friendRequests;

  const handleReset = () => {
    setLocal({ friendRequests: settings.friendRequests });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(
      updatePrivacySettings({ friendRequests: local.friendRequests }),
    );
    // local state already matches — nothing to reset on success
    if (updatePrivacySettings.rejected.match(result)) {
      handleReset(); // revert on failure
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-sm text-base-content/40" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <VisibilityPicker
        label="Who can send me friend requests"
        value={local.friendRequests}
        onChange={(v) => setLocal((p) => ({ ...p, friendRequests: v }))}
        options={[
          { key: "everyone", label: "Everyone" },
          { key: "friends", label: "Friends of friends" },
          { key: "nobody", label: "Nobody" },
        ]}
      />

      {error && <p className="text-xs text-red-400 px-1">{error}</p>}

      <SaveBar hasChanges={hasChanges} onReset={handleReset} loading={saving} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Section: Messaging
// ---------------------------------------------------------------------------
function MessagingSection() {
  const dispatch = useAppDispatch();
  const { settings, saving, error, fetched, loading } = useSelector(
    (s: RootState) => s.privacy,
  );

  const [local, setLocal] = useState({
    readReceipts: settings.readReceipts,
    typingIndicators: settings.typingIndicators,
  });

  useEffect(() => {
    if (fetched) {
      setLocal({
        readReceipts: settings.readReceipts,
        typingIndicators: settings.typingIndicators,
      });
    }
  }, [fetched, settings.readReceipts, settings.typingIndicators]);

  const hasChanges =
    local.readReceipts !== settings.readReceipts ||
    local.typingIndicators !== settings.typingIndicators;

  const handleReset = () => {
    setLocal({
      readReceipts: settings.readReceipts,
      typingIndicators: settings.typingIndicators,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(updatePrivacySettings(local));
    if (updatePrivacySettings.rejected.match(result)) {
      handleReset();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-sm text-base-content/40" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="border-t border-base-content/10 pt-4 flex flex-col gap-0">
        <GroupLabel>Message indicators</GroupLabel>
        <ToggleRow
          label="Read receipts"
          description="Let others know when you've read their message"
          value={local.readReceipts}
          onChange={(v) => setLocal((p) => ({ ...p, readReceipts: v }))}
          disabled={saving}
        />
        <ToggleRow
          label="Typing indicators"
          description="Show when you are typing a reply"
          value={local.typingIndicators}
          onChange={(v) => setLocal((p) => ({ ...p, typingIndicators: v }))}
          disabled={saving}
        />
      </div>

      {error && <p className="text-xs text-red-400 px-1">{error}</p>}

      <SaveBar hasChanges={hasChanges} onReset={handleReset} loading={saving} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main PrivacySettings — fetch on mount, pass badge from live state
// ---------------------------------------------------------------------------
const privacySections: {
  key: Section;
  icon: React.ElementType;
  label: string;
  description: string;
}[] = [
  {
    key: "interactions",
    icon: LuUserCheck,
    label: "Interactions",
    description: "Manage friend requests, tags, and reactions",
  },
  {
    key: "messaging",
    icon: LuMessageSquare,
    label: "Messaging",
    description: "Set who can message you and read receipts",
  },
];

export default function PrivacySettings() {
  const dispatch = useAppDispatch();
  const [activeSection, setActiveSection] = useState<Section>(null);
  const { settings, fetched } = useSelector((s: RootState) => s.privacy);

  // Fetch once when the settings panel is first opened
  useEffect(() => {
    if (!fetched) {
      dispatch(fetchPrivacySettings());
    }
  }, [fetched, dispatch]);

  // Live badges reflect current saved settings
  const sectionBadges: Record<string, string> = {
    interactions: settings.friendRequests === "everyone"
      ? "Everyone"
      : settings.friendRequests === "friends"
      ? "Friends"
      : "Nobody",
    messaging: settings.readReceipts && settings.typingIndicators
      ? "All on"
      : !settings.readReceipts && !settings.typingIndicators
      ? "All off"
      : "Custom",
  };

  if (activeSection) {
    const meta = privacySections.find((s) => s.key === activeSection)!;

    return (
      <div className="flex flex-col gap-4 p-1">
        <div className="flex items-center gap-2 pb-3 border-b border-base-content/10">
          <button
            type="button"
            onClick={() => setActiveSection(null)}
            className="text-xs text-blue-400 hover:underline underline-offset-2 cursor-pointer transition"
          >
            ← Privacy
          </button>
          <span className="text-base-content/30 text-xs">/</span>
          <p className="text-sm font-semibold text-base-content">{meta.label}</p>
        </div>

        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
        >
          {activeSection === "interactions" && <InteractionsSection />}
          {activeSection === "messaging" && <MessagingSection />}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="flex items-start gap-3 bg-base-300 rounded-xl p-3 mb-2">
        <BsShieldLock size={16} className="text-base-content/50 mt-0.5 shrink-0" />
        <p className="text-xs text-base-content/50 leading-relaxed">
          Manage who can see your information, interact with you, and find your profile.
        </p>
      </div>

      {privacySections.map((s) => (
        <SectionRow
          key={s.key}
          icon={s.icon}
          label={s.label}
          description={s.description}
          badge={sectionBadges[s.key!]}
          onClick={() => setActiveSection(s.key)}
        />
      ))}
    </div>
  );
}

