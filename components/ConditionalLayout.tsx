"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Onboarding } from "@/components/Onboarding";
import { useTheme } from "next-themes";
import { vkBridgeManager } from "@/lib/vkBridge";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    let unsubscribeHandler: ((event: any) => void) | null = null;

    const initializeVK = async () => {
      try {
        // Initialize VK Bridge
        await vkBridgeManager.init();

        // Define and subscribe to VK events
        const handleVkEvent = (e: any) => {
          if (e.detail?.type === "VKWebAppUpdateConfig") {
            const appearance = e.detail.data?.appearance;
            if (appearance === "dark") {
              setTheme("dark");
            } else if (appearance === "light") {
              setTheme("light");
            }
          }
        };

        unsubscribeHandler = handleVkEvent;
        vkBridgeManager.subscribe(handleVkEvent);
      } catch (error) {
        console.error("Failed to initialize VK Bridge:", error);
        // App continues to work without VK Bridge
      }
    };

    initializeVK();

    // Cleanup
    return () => {
      if (unsubscribeHandler) {
        vkBridgeManager.unsubscribe(unsubscribeHandler);
      }
    };
  }, [setTheme]);

  if (loading) return null;

  return (
    <>
      <Navbar />
      {!user && <Onboarding />}
      {children}
    </>
  );
}
