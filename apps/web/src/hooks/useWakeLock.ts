"use client";

import { useEffect, useRef, useState } from "react";

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const requestLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
        setIsLocked(true);
        wakeLockRef.current.addEventListener("release", () => {
          setIsLocked(false);
        });
      }
    } catch (err) {
      console.warn("[WakeLock] Request failed:", err);
    }
  };

  const releaseLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsLocked(false);
      }
    } catch (err) {
      console.warn("[WakeLock] Release failed:", err);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isLocked) {
        await requestLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      releaseLock();
    };
  }, [isLocked]);

  return { isLocked, requestLock, releaseLock };
}
