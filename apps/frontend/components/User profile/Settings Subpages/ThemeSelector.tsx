"use client";

import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setTheme } from "@/redux/features/themeSlice";
import { AVAILABLE_THEMES, AppTheme, THEME_LABELS } from "@/config/themeConfig";
import { Palette } from "lucide-react";

export default function ThemeSelector() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.current);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = (t: AppTheme) => {
    dispatch(setTheme(t));
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center px-2 gap-2 cursor-pointer"
      >
        <Palette size={16} />
        <span className="opacity-70 text-sm">{THEME_LABELS[theme]}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <ul className="absolute right-0 mt-2 z-[100] menu p-2 shadow-lg bg-base-200 border border-base-content/10 rounded-box w-44">
          {AVAILABLE_THEMES.map((t) => (
            <li key={t}>
              <button
                onClick={() => handleSelect(t)}
                className={`capitalize ${
                  theme === t ? "active font-medium" : ""
                }`}
              >
                {THEME_LABELS[t]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
