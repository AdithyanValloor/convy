"use client";

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setTheme } from "@/redux/features/themeSlice";
import { AVAILABLE_THEMES, AppTheme, THEME_LABELS } from "@/config/themeConfig";
import { Check, Palette } from "lucide-react";
import { motion } from "framer-motion";

// ---------------------------------------------------------------------------
// Base-100 colors for the app's 7 active themes (from daisyUI theme definitions)
// ---------------------------------------------------------------------------
const THEME_BASE: Record<string, string> = {
  light:    "#ffffff",
  forest:   "#171212",
  sunset:   "#121c22",
  business: "#202020",
  dracula:  "#282a36",
  lemonade: "#ffffff",
  retro:    "#e4d8b4",
};

// ---------------------------------------------------------------------------

export default function ThemeSettings() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.current);

  const handleSelect = (t: AppTheme) => {
    dispatch(setTheme(t));
  };

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-base-300 rounded-xl p-3">
        <Palette size={16} className="text-base-content/50 mt-0.5 shrink-0" />
        <p className="text-xs text-base-content/50 leading-relaxed">
          Choose a theme that suits your style. Changes apply instantly across the app.
        </p>
      </div>

      {/* Theme list */}
      <div className="flex flex-col gap-1">
        {AVAILABLE_THEMES.map((t) => {
          const isActive = theme === t;
          const baseColor = THEME_BASE[t];

          return (
            <motion.button
              key={t}
              type="button"
              onClick={() => handleSelect(t)}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center justify-between gap-3 p-3 py-3.5 rounded-lg
                cursor-pointer transition-colors text-left
                ${isActive ? "bg-base-content/10" : "hover:bg-base-content/10"}`}
            >
              <div className="flex items-center gap-3">
                {/* Base color circle */}
                <span
                  className="w-4 h-4 rounded-full border border-base-content/20 shrink-0"
                  style={{ backgroundColor: baseColor }}
                />
                <p
                  className={`text-sm font-medium ${
                    isActive ? "text-base-content" : "text-base-content/70"
                  }`}
                >
                  {THEME_LABELS[t]}
                </p>
              </div>

              {isActive && (
                <Check size={15} className="text-green-500 shrink-0" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}