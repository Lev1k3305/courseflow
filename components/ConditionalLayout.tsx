"use client";

import { useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { Navbar } from "@/components/Navbar";
import { Onboarding } from "@/components/Onboarding";
import { useTheme } from "next-themes";
import vkBridge from "@vkontakte/vk-bridge";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { setTheme } = useTheme();

  useEffect(() => {
    // Initialize VK Bridge to tell the VK app that the loader is ready
    vkBridge.send("VKWebAppInit").catch((err) => console.error("VK Bridge Init error:", err));

    // Listen to theme change events from the VK mobile client
    const handleVkEvent = (e: any) => {
      if (e.detail.type === "VKWebAppUpdateConfig") {
        const appearance = e.detail.data.appearance;
        if (appearance === "dark") {
          setTheme("dark");
        } else if (appearance === "light") {
          setTheme("light");
        }
      }
    };

    vkBridge.subscribe(handleVkEvent);
    return () => {
      vkBridge.unsubscribe(handleVkEvent);
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
