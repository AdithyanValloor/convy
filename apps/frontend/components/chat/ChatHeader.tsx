import { ArrowLeft } from "lucide-react";
import ProfilePicture from "../ProfilePicture/ProfilePicture";
import { IoSearch } from "react-icons/io5";
import IconButton from "../GlobalComponents/IconButtons";

type SidebarMode = "profile" | "search" | null;

interface ChatHeaderProps {
  isMobile: boolean;
  displayName?: string;
  displayStatus:  "online" | "offline";
  displayPic: string;
  onBack: () => void;
  onProfileClick: () => void;
  setSidebarMode: (mode: SidebarMode) => void;
}

export function ChatHeader({
  isMobile,
  displayName,
  displayStatus,
  displayPic,
  onBack,
  onProfileClick,
  setSidebarMode,
}: ChatHeaderProps) {
  return (
    <header className={`flex-shrink-0 ${!isMobile && "rounded-2xl" } py-2 border border-base-content/10 bg-base-200 shadow-lg shadow-black/10 px-3 md:px-4 flex justify-between items-center`}>
      <div className="flex items-center gap-3 min-w-0">
        {isMobile && (
          <IconButton
            ariaLabel="Back button"
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </IconButton>
        )}
        <div onClick={onProfileClick} className="flex items-center gap-3 cursor-pointer">
          <ProfilePicture src={displayPic} status={displayStatus} size="md" />
          <div>
            <h1 className="font-semibold text-lg text-base-content truncate">{displayName}</h1>
            <p className="text-xs opacity-50 text-base-content">{displayStatus}</p>
          </div>
        </div>
      </div>

     <div className="flex gap-5 items-center">
        {/* <IconButton
          ariaLabel="Voice call"
          className="w-8 h-8"
        >
          <IoCall size={16} />
        </IconButton>
        <IconButton ariaLabel="Video call">
          <IoVideocam size={20} />
        </IconButton> */}

        <IconButton
          ariaLabel="Search messages"
          onClick={() => setSidebarMode("search")}
        >
          <IoSearch size={20} />
        </IconButton>
      </div>
    </header>
  );
}