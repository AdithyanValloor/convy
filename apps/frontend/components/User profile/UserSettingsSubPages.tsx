"use client";

import { ArrowLeft } from "lucide-react";
import IconButton from "../GlobalComponents/IconButtons";

interface SubPageProps {
  onBack: () => void;
  title: string;
  children?: React.ReactNode;
}

export function SubPage({ onBack, title, children }: SubPageProps) {
  return (
    <div className="w-full h-full relative overflow-auto">
      {/* Header with back */}
      <div className="flex items-center gap-2 p-3 border-b border-base-300">
          <IconButton
            onClick={onBack}
            ariaLabel="Go back"
          >
            <ArrowLeft size={18} />
          </IconButton>
          <h2 className="text-lg font-semibold text-base-content">{title}</h2>
        </div>
      {/* Content */}
      <div className="p-4">{children || <p className="opacity-70">Coming soon…</p>}</div>
    </div>
  );
}
