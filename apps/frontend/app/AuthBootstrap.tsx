"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { fetchCurrentUser } from "@/redux/features/authSlice";

export default function AuthBootstrap() {
  const dispatch = useAppDispatch();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return null;
}
