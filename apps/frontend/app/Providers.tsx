"use client";

import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/redux/store";

import ThemeProvider from "@/app/ThemeProvider";
import MuiThemeBridge from "@/app/MuiThemeBridge";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ToastProvider } from "@/components/Notification/Toast/ToastProvider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <MuiThemeBridge>
          <ToastProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {children}
            </LocalizationProvider>
          </ToastProvider>
        </MuiThemeBridge>
      </ThemeProvider>
    </ReduxProvider>
  );
}
