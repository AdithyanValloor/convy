"use client";

import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { useAppSelector } from "@/redux/hooks";
import { createMuiTheme } from "@/lib/muiTheme";
import { useMemo, useEffect, useState } from "react";

export default function MuiThemeBridge({
  children,
}: {
  children: React.ReactNode;
}) {
  const daisyTheme = useAppSelector((state) => state.theme.current);
  const [mounted, setMounted] = useState(false);

  const muiTheme = useMemo(() => {
    return createMuiTheme();
  }, [daisyTheme]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}