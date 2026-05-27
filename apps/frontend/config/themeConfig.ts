
export const AVAILABLE_THEMES = [
  "light",
  "lemonade",
  "retro",
  "forest",
  "business",
  "sunset",
  "dracula",
] as const;

export const THEME_LABELS: Record<AppTheme, string> = {
  light: "Light",
  retro: "Sunset",
  forest: "Dark",
  sunset: "Teal",
  business: "Corporate",
  dracula: "Midnight",
  lemonade: "Sage",
  system: "System",
};

export type DaisyTheme = typeof AVAILABLE_THEMES[number];

export type AppTheme = DaisyTheme | "system";

export const getSystemTheme = (): AppTheme => {
  if (typeof window !== "undefined") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "forest" : "light";
  }
  return "light";
};
