"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/redux/hooks";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useAppSelector((state) => state.theme.current);

  useEffect(() => {
    if (!theme) return;

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <>{children}</>;
}
