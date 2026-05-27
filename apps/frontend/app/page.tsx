"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCurrentUser } from "@/redux/features/authSlice";

export default function RootPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const initialized = useRef(false);

  const { user, sessionLoading } = useAppSelector((state) => state.auth);

  /**
   * Fetch the current user session when the app loads.
   */
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    dispatch(fetchCurrentUser())
      .unwrap()
      .catch((err) => {
        console.log("Session restoration failed:", err);
      });
  }, [dispatch]);

  /**
   * Redirect once the authentication state has been resolved.
   */
  useEffect(() => {
    if (sessionLoading) return;

    if (user) {
      console.log("✅ User authenticated, redirecting to chat");
      window.location.replace("/chat");

      // router.replace('/chat');
    } else {
      console.log("❌ No user session, redirecting to login");
      window.location.replace("/login");
    }
  }, [sessionLoading, user, router]);

  useEffect(() => {
    const suppress = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", suppress);
    return () => document.removeEventListener("contextmenu", suppress);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-base-200">
      <span className="loading loading-spinner loading-xl text-base-content" />
    </div>
  );
}
