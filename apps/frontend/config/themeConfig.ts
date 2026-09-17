
export const AVAILABLE_THEMES = [
  "light",
  "business",
  "nord",
  "dim",
] as const;

export const THEME_LABELS: Record<AppTheme, string> = {
  light: "Light",
  nord: "Melo light",
  business: "Dark",
  dim: "Melo dark",
  system: "System",
};

export type DaisyTheme = typeof AVAILABLE_THEMES[number];

export type AppTheme = DaisyTheme | "system";

export const getSystemTheme = (): AppTheme => {
  if (typeof window !== "undefined") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "business" : "light";
  }
  return "light";
};
