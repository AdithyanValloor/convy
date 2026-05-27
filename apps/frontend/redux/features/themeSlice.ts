import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getSystemTheme, AVAILABLE_THEMES, AppTheme, DaisyTheme } from "@/config/themeConfig";

interface ThemeState {
  current: AppTheme;
}

const getInitialTheme = (): AppTheme => {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem("theme");

  if (!saved) return getSystemTheme();

  if (saved === "system") return "system";

  if (AVAILABLE_THEMES.includes(saved as DaisyTheme)) {
    return saved as DaisyTheme;
  }

  return getSystemTheme();
};
const initialState: ThemeState = {
  current: getInitialTheme(),
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<AppTheme>) {
      state.current = action.payload;
    },
  },
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;