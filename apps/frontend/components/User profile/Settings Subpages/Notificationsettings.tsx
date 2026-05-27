// "use client";

// import { useState, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { ChevronRight } from "lucide-react";
// import {
//   LuMessageSquare,
//   LuUsers,
//   LuBellOff,
//   LuBell,
// } from "react-icons/lu";
// import { useSelector } from "react-redux";
// import { RootState } from "@/redux/store";
// import { useAppDispatch } from "@/redux/hooks";
// import {
//   fetchNotificationSettings,
//   updateNotificationSettings,
// } from "@/redux/features/Notificationsettingsslice";

// // ---------------------------------------------------------------------------
// // Shared primitives
// // ---------------------------------------------------------------------------

// function SectionRow({
//   icon: Icon,
//   label,
//   description,
//   badge,
//   onClick,
// }: {
//   icon: React.ElementType;
//   label: string;
//   description: string;
//   badge?: string;
//   onClick: () => void;
// }) {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className="w-full flex items-center justify-between gap-3 p-3 py-4 rounded-lg hover:bg-base-content/10 transition-colors cursor-pointer group text-left"
//     >
//       <div className="flex items-center gap-3">
//         <Icon size={18} className="text-base-content/60 shrink-0" />
//         <div>
//           <p className="text-sm font-medium text-base-content">{label}</p>
//           <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
//         </div>
//       </div>
//       <div className="flex items-center gap-2 shrink-0">
//         {badge && (
//           <span className="text-xs text-base-content/40 font-medium">
//             {badge}
//           </span>
//         )}
//         <ChevronRight
//           size={15}
//           className="text-base-content/30 group-hover:translate-x-0.5 transition-transform"
//         />
//       </div>
//     </button>
//   );
// }

// function ToggleRow({
//   label,
//   description,
//   value,
//   onChange,
//   disabled,
// }: {
//   label: string;
//   description: string;
//   value: boolean;
//   onChange: (v: boolean) => void;
//   disabled?: boolean;
// }) {
//   const id = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;
//   return (
//     <div className="flex items-center justify-between gap-4 py-3 px-1">
//       <div>
//         <label
//           htmlFor={id}
//           className="text-sm font-medium text-base-content cursor-pointer"
//         >
//           {label}
//         </label>
//         <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
//       </div>
//       <label
//         htmlFor={id}
//         className="relative shrink-0 w-10 h-[22px] cursor-pointer"
//       >
//         <input
//           id={id}
//           type="checkbox"
//           checked={value}
//           onChange={(e) => onChange(e.target.checked)}
//           disabled={disabled}
//           className="sr-only"
//           aria-label={label}
//         />
//         <span
//           className={`block w-10 h-[22px] rounded-full transition-colors duration-200 ${
//             value ? "bg-green-700" : "bg-base-content/20"
//           } ${disabled ? "opacity-50" : ""}`}
//         />
//         <motion.span
//           layout
//           transition={{ type: "spring", stiffness: 500, damping: 35 }}
//           className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
//           style={{ left: value ? "22px" : "3px" }}
//         />
//       </label>
//     </div>
//   );
// }

// function GroupLabel({ children }: { children: React.ReactNode }) {
//   return (
//     <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest px-1 pt-2 pb-0.5">
//       {children}
//     </p>
//   );
// }

// function SaveBar({
//   hasChanges,
//   onReset,
//   loading,
// }: {
//   hasChanges: boolean;
//   onReset: () => void;
//   loading?: boolean;
// }) {
//   return (
//     <AnimatePresence>
//       {hasChanges && (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           exit={{ opacity: 0, y: 10 }}
//           transition={{ duration: 0.2 }}
//           className="gap-2 flex flex-col mt-2 bg-base-100 shadow border border-base-content/10 p-2 pl-4 rounded-xl"
//         >
//           <p className="text-sm">You have made changes! Save changes?</p>
//           <div className="flex gap-1 justify-end">
//             <button
//               type="button"
//               onClick={onReset}
//               disabled={loading}
//               className="px-2 py-2 text-blue-400 hover:underline underline-offset-2 transition-all cursor-pointer disabled:opacity-40"
//             >
//               Reset
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="px-4 py-2 cursor-pointer rounded-xl bg-green-700 text-white hover:bg-green-900 transition disabled:opacity-60"
//             >
//               {loading ? (
//                 <span className="loading loading-dots loading-sm" />
//               ) : (
//                 "Save Changes"
//               )}
//             </button>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

// // ---------------------------------------------------------------------------
// // Section: Messages
// // ---------------------------------------------------------------------------

// function MessagesSection() {
//   const dispatch = useAppDispatch();
//   const { settings, saving, error, fetched, loading } = useSelector(
//     (s: RootState) => s.notificationSettings,
//   );

//   const [local, setLocal] = useState({
//     newMessages: settings.newMessages,
//     mentions: settings.mentions,
//   });

//   useEffect(() => {
//     if (fetched) {
//       setLocal({
//         newMessages: settings.newMessages,
//         mentions: settings.mentions,
//       });
//     }
//   }, [fetched, settings.newMessages, settings.mentions]);

//   const hasChanges =
//     local.newMessages !== settings.newMessages ||
//     local.mentions !== settings.mentions;

//   const handleReset = () =>
//     setLocal({
//       newMessages: settings.newMessages,
//       mentions: settings.mentions,
//     });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const result = await dispatch(updateNotificationSettings(local));
//     if (updateNotificationSettings.rejected.match(result)) handleReset();
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center py-8">
//         <span className="loading loading-spinner loading-sm text-base-content/40" />
//       </div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} className="flex flex-col gap-2">
//       <GroupLabel>Message alerts</GroupLabel>
//       <ToggleRow
//         label="New messages"
//         description="Notify when you receive a new DM or group message"
//         value={local.newMessages}
//         onChange={(v) => setLocal((p) => ({ ...p, newMessages: v }))}
//         disabled={saving}
//       />
//       <ToggleRow
//         label="Mentions"
//         description="Notify when someone @mentions you in a group"
//         value={local.mentions}
//         onChange={(v) => setLocal((p) => ({ ...p, mentions: v }))}
//         disabled={saving}
//       />
    
//       {error && <p className="text-xs text-red-400 px-1">{error}</p>}
//       <SaveBar hasChanges={hasChanges} onReset={handleReset} loading={saving} />
//     </form>
//   );
// }

// // ---------------------------------------------------------------------------
// // Section: Social
// // ---------------------------------------------------------------------------

// function SocialSection() {
//   const dispatch = useAppDispatch();
//   const { settings, saving, error, fetched, loading } = useSelector(
//     (s: RootState) => s.notificationSettings,
//   );

//   const [local, setLocal] = useState({
//     friendRequests: settings.friendRequests,
//     friendRequestAccepted: settings.friendRequestAccepted,
//     groupAdded: settings.groupAdded,
//   });

//   useEffect(() => {
//     if (fetched) {
//       setLocal({
//         friendRequests: settings.friendRequests,
//         friendRequestAccepted: settings.friendRequestAccepted,
//         groupAdded: settings.groupAdded,
//       });
//     }
//   }, [
//     fetched,
//     settings.friendRequests,
//     settings.friendRequestAccepted,
//     settings.groupAdded,
//   ]);

//   const hasChanges =
//     local.friendRequests !== settings.friendRequests ||
//     local.friendRequestAccepted !== settings.friendRequestAccepted ||
//     local.groupAdded !== settings.groupAdded;

//   const handleReset = () =>
//     setLocal({
//       friendRequests: settings.friendRequests,
//       friendRequestAccepted: settings.friendRequestAccepted,
//       groupAdded: settings.groupAdded,
//     });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const result = await dispatch(updateNotificationSettings(local));
//     if (updateNotificationSettings.rejected.match(result)) handleReset();
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center py-8">
//         <span className="loading loading-spinner loading-sm text-base-content/40" />
//       </div>
//     );
//   }

//   return (
//     <form onSubmit={handleSubmit} className="flex flex-col gap-2">
//       <GroupLabel>Social alerts</GroupLabel>
//       <ToggleRow
//         label="Friend requests"
//         description="Notify when someone sends you a friend request"
//         value={local.friendRequests}
//         onChange={(v) => setLocal((p) => ({ ...p, friendRequests: v }))}
//         disabled={saving}
//       />
//       <ToggleRow
//         label="Friend request accepted"
//         description="Notify when someone accepts your friend request"
//         value={local.friendRequestAccepted}
//         onChange={(v) => setLocal((p) => ({ ...p, friendRequestAccepted: v }))}
//         disabled={saving}
//       />
//       <ToggleRow
//         label="Added to group"
//         description="Notify when you are added to a new group"
//         value={local.groupAdded}
//         onChange={(v) => setLocal((p) => ({ ...p, groupAdded: v }))}
//         disabled={saving}
//       />

//       {error && <p className="text-xs text-red-400 px-1">{error}</p>}
//       <SaveBar hasChanges={hasChanges} onReset={handleReset} loading={saving} />
//     </form>
//   );
// }

// // ---------------------------------------------------------------------------
// // Section registry
// // ---------------------------------------------------------------------------

// type Section = "messages" | "social" | null;

// const notificationSections: {
//   key: Section;
//   icon: React.ElementType;
//   label: string;
//   description: string;
// }[] = [
//   {
//     key: "messages",
//     icon: LuMessageSquare,
//     label: "Messages",
//     description: "New messages, mentions, and replies",
//   },
//   {
//     key: "social",
//     icon: LuUsers,
//     label: "Social",
//     description: "Friend requests and group activity",
//   },
// ];

// // ---------------------------------------------------------------------------
// // Main NotificationSettings
// // ---------------------------------------------------------------------------

// export default function NotificationSettings() {
//   const dispatch = useAppDispatch();
//   const [activeSection, setActiveSection] = useState<Section>(null);
//   const { settings, fetched } = useSelector(
//     (s: RootState) => s.notificationSettings,
//   );

//   useEffect(() => {
//     if (!fetched) {
//       dispatch(fetchNotificationSettings());
//     }
//   }, [fetched, dispatch]);

//   const messageBadge = (() => {
//     const on = [settings.newMessages, settings.mentions].filter(Boolean).length;
//     if (on === 2) return "All on";
//     if (on === 0) return "All off";
//     return `${on} / 2`;
//   })();

//   const socialBadge = (() => {
//     const on = [
//       settings.friendRequests,
//       settings.friendRequestAccepted,
//       settings.groupAdded,
//     ].filter(Boolean).length;
//     if (on === 3) return "All on";
//     if (on === 0) return "All off";
//     return `${on} / 3`;
//   })();

//   const sectionBadges: Record<string, string> = {
//     messages: messageBadge,
//     social: socialBadge,
//   };

//   if (activeSection) {
//     const meta = notificationSections.find((s) => s.key === activeSection)!;

//     return (
//       <div className="flex flex-col gap-4 p-1">
//         <div className="flex items-center gap-2 pb-3 border-b border-base-content/10">
//           <button
//             type="button"
//             onClick={() => setActiveSection(null)}
//             className="text-xs text-blue-400 hover:underline underline-offset-2 cursor-pointer transition"
//           >
//             ← Notifications
//           </button>
//           <span className="text-base-content/30 text-xs">/</span>
//           <p className="text-sm font-semibold text-base-content">
//             {meta.label}
//           </p>
//         </div>

//         <motion.div
//           key={activeSection}
//           initial={{ opacity: 0, y: 8 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.18 }}
//         >
//           {activeSection === "messages" && <MessagesSection />}
//           {activeSection === "social" && <SocialSection />}
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col gap-1 p-1">
//       <div className="flex items-start gap-3 bg-base-300 rounded-xl p-3 mb-2">
//         <LuBell size={16} className="text-base-content/50 mt-0.5 shrink-0" />
//         <p className="text-xs text-base-content/50 leading-relaxed">
//           Control which events notify you and when they are delivered.
//         </p>
//       </div>

//       {notificationSections.map((s) => (
//         <SectionRow
//           key={s.key}
//           icon={s.icon}
//           label={s.label}
//           description={s.description}
//           badge={sectionBadges[s.key!]}
//           onClick={() => setActiveSection(s.key)}
//         />
//       ))}

//       <div className="mt-2 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-base-300/50">
//         <LuBellOff size={14} className="text-base-content/30 shrink-0" />
//         <p className="text-xs text-base-content/40">
//           You can also mute individual chats from the chat header.
//         </p>
//       </div>
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuMessageSquare, LuUsers, LuBell, LuBellOff } from "react-icons/lu";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useAppDispatch } from "@/redux/hooks";
import {
  fetchNotificationSettings,
  updateNotificationSettings,
} from "@/redux/features/Notificationsettingsslice";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function ToggleRow({
  label,
  description,
  value,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const id = `toggle-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div
      className={`flex items-center justify-between gap-4 py-3 px-1 transition-opacity duration-200 ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div>
        <label
          htmlFor={id}
          className="text-sm font-medium text-base-content cursor-pointer"
        >
          {label}
        </label>
        <p className="text-xs text-base-content/50 mt-0.5">{description}</p>
      </div>
      <label
        htmlFor={id}
        className="relative shrink-0 w-10 h-[22px] cursor-pointer"
      >
        <input
          id={id}
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          aria-label={label}
        />
        <span
          className={`block w-10 h-[22px] rounded-full transition-colors duration-200 ${
            value ? "bg-green-700" : "bg-base-content/20"
          }`}
        />
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

function GroupLabel({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1 px-1">
      <Icon size={14} className="text-base-content/40 shrink-0" />
      <p className="text-xs font-semibold text-base-content/40 uppercase tracking-widest">
        {children}
      </p>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-base-content/8 my-1" />;
}

function SaveBar({
  hasChanges,
  onReset,
  loading,
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
              {loading ? (
                <span className="loading loading-dots loading-sm" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main NotificationSettings
// ---------------------------------------------------------------------------

export default function NotificationSettings() {
  const dispatch = useAppDispatch();
  const { settings, saving, error, fetched, loading } = useSelector(
    (s: RootState) => s.notificationSettings,
  );

  const [local, setLocal] = useState({
    allNotifications: settings.allNotifications,
    newMessages: settings.newMessages,
    mentions: settings.mentions,
    friendRequests: settings.friendRequests,
    friendRequestAccepted: settings.friendRequestAccepted,
    groupAdded: settings.groupAdded,
  });

  useEffect(() => {
    if (!fetched) dispatch(fetchNotificationSettings());
  }, [fetched, dispatch]);

  useEffect(() => {
    if (fetched) {
      setLocal({
        allNotifications: settings.allNotifications,
        newMessages: settings.newMessages,
        mentions: settings.mentions,
        friendRequests: settings.friendRequests,
        friendRequestAccepted: settings.friendRequestAccepted,
        groupAdded: settings.groupAdded,
      });
    }
  }, [fetched, settings]);

  const hasChanges =
    local.allNotifications !== settings.allNotifications ||
    local.newMessages !== settings.newMessages ||
    local.mentions !== settings.mentions ||
    local.friendRequests !== settings.friendRequests ||
    local.friendRequestAccepted !== settings.friendRequestAccepted ||
    local.groupAdded !== settings.groupAdded;

  const handleReset = () =>
    setLocal({
      allNotifications: settings.allNotifications,
      newMessages: settings.newMessages,
      mentions: settings.mentions,
      friendRequests: settings.friendRequests,
      friendRequestAccepted: settings.friendRequestAccepted,
      groupAdded: settings.groupAdded,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(updateNotificationSettings(local));
    if (updateNotificationSettings.rejected.match(result)) handleReset();
  };

  // Whether individual toggles should be grayed out
  const subsDisabled = saving || !local.allNotifications;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-sm text-base-content/40" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1 p-1">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-base-300 rounded-xl p-3 mb-2">
        <LuBell size={16} className="text-base-content/50 mt-0.5 shrink-0" />
        <p className="text-xs text-base-content/50 leading-relaxed">
          Control which events notify you and when they are delivered.
        </p>
      </div>

      {/* Master toggle */}
      <ToggleRow
        label="Allow notifications"
        description="Enable or disable all notifications at once"
        value={local.allNotifications}
        onChange={(v) => setLocal((p) => ({ ...p, allNotifications: v }))}
        disabled={saving}
      />

      <Divider />

      {/* ── Messages ── */}
      <GroupLabel icon={LuMessageSquare}>Messages</GroupLabel>
      <ToggleRow
        label="New messages"
        description="Notify when you receive a new DM or group message"
        value={local.newMessages}
        onChange={(v) => setLocal((p) => ({ ...p, newMessages: v }))}
        disabled={subsDisabled}
      />
      <ToggleRow
        label="Mentions"
        description="Notify when someone @mentions you in a group"
        value={local.mentions}
        onChange={(v) => setLocal((p) => ({ ...p, mentions: v }))}
        disabled={subsDisabled}
      />

      <Divider />

      {/* ── Social ── */}
      <GroupLabel icon={LuUsers}>Social</GroupLabel>
      <ToggleRow
        label="Friend requests"
        description="Notify when someone sends you a friend request"
        value={local.friendRequests}
        onChange={(v) => setLocal((p) => ({ ...p, friendRequests: v }))}
        disabled={subsDisabled}
      />
      <ToggleRow
        label="Friend request accepted"
        description="Notify when someone accepts your friend request"
        value={local.friendRequestAccepted}
        onChange={(v) => setLocal((p) => ({ ...p, friendRequestAccepted: v }))}
        disabled={subsDisabled}
      />
      <ToggleRow
        label="Added to group"
        description="Notify when you are added to a new group"
        value={local.groupAdded}
        onChange={(v) => setLocal((p) => ({ ...p, groupAdded: v }))}
        disabled={subsDisabled}
      />

      {/* Mute tip */}
      <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-base-300/50">
        <LuBellOff size={14} className="text-base-content/30 shrink-0" />
        <p className="text-xs text-base-content/40">
          You can also mute individual chats from the chat header.
        </p>
      </div>

      {error && <p className="text-xs text-red-400 px-1 mt-1">{error}</p>}
      <SaveBar hasChanges={hasChanges} onReset={handleReset} loading={saving} />
    </form>
  );
}