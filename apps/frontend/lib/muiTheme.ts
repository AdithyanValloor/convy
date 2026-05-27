import { createTheme } from "@mui/material/styles";
import "@mui/x-date-pickers/themeAugmentation";

export const createMuiTheme = () => {
  return createTheme({
    shape: { borderRadius: 12 },

    typography: {
      fontFamily: 'var(--font-inter)',
    },

    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: "var(--color-base-200)",
            color: "var(--color-base-content)",
            border:
              "1px solid color-mix(in oklab, var(--color-base-content) 10%, transparent)",
          },
        },
      },

      MuiPickersDay: {
        styleOverrides: {
          root: {
            color: "var(--color-base-content)",
            backgroundColor: "transparent",

            "&.MuiPickersDay-root.Mui-disabled": {
              color: "var(--color-base-content)",
              opacity: 0.5,
            },
            "&.Mui-selected": {
              backgroundColor: "var(--color-cyan-800) !important",
              color: "white",
            },

            "&.Mui-selected:hover": {
              backgroundColor: "var(--color-cyan-800) !important",
            },

            "&.Mui-selected:focus": {
              backgroundColor: "var(--color-cyan-800) !important",
            },
            "&:hover": {
              backgroundColor:
                "color-mix(in oklab, var(--color-base-content) 10%, transparent)",
            },
            "&.MuiPickersDay-today": {
              border: "2px solid var(--color-base-content)",
            },

            "&.MuiPickersDay-today:not(.Mui-selected)": {
              border: "2px solid var(--color-base-content)",
            },

            "&.MuiPickersDay-today.Mui-selected": {
              border: "2px solid white",
            },
          },
        },
      },

      MuiDayCalendar: {
        styleOverrides: {
          weekDayLabel: {
            color: "var(--color-base-content)",
            fontWeight: 600,
          },
        },
      },

      MuiPickersCalendarHeader: {
        styleOverrides: {
          label: {
            color: "var(--color-base-content)",
            fontWeight: 600,
          },
          switchViewButton: {
            color: "var(--color-base-content)",
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            color: "var(--color-base-content)",
            "&:hover": {
              backgroundColor:
                "color-mix(in oklab, var(--color-base-content) 10%, transparent)",
            },
          },
        },
      },
    },
  });
};
