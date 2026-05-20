"use client";

import { BrainCircuit, Sun, Moon, User, LayoutGrid, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { signOut } from "firebase/auth";
import { getAuthService } from "@/lib/firebase";
import vkBridge from "@vkontakte/vk-bridge";

export function Navbar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchVkAvatar() {
      try {
        const userInfo = await vkBridge.send("VKWebAppGetUserInfo");
        if (userInfo && userInfo.photo_200) {
          setAvatarUrl(userInfo.photo_200);
        }
      } catch (e) {
        console.log("No VK Bridge user avatar, fallback to default");
      }
    }
    if (user) {
      fetchVkAvatar();
    } else {
      setAvatarUrl(null);
    }
  }, [user]);

  if (!mounted) return null;

  const navLinks = (
    <>
      <Link href="/#courses" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
        <LayoutGrid size={16} />
        Курсы
      </Link>
    </>
  );

  return (
    <>
      {/* Top Navbar for Desktop/Tablet */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
              <BrainCircuit className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
              CourseFlow
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1.5">
            {navLinks}
            {user ? (
              <>
                <Link href="/profile" className="p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <User size={18} />
                  )}
                </Link>
                <button 
                  onClick={() => signOut(getAuthService())}
                  className="p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Выйти"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link href="/profile" className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors">
                Войти
              </Link>
            )}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          {/* Simple header theme toggle on mobile */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
            >
              {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-xl shadow-indigo-500/5 transition-all duration-300 pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-14 items-center justify-around px-2">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform">
            <LayoutGrid size={20} className="text-zinc-600 dark:text-zinc-300" />
            <span className="text-[10px] font-semibold">Главная</span>
          </Link>

          <Link href="/profile" className="flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" />
            ) : (
              <User size={20} className="text-zinc-600 dark:text-zinc-300" />
            )}
            <span className="text-[10px] font-semibold">Профиль</span>
          </Link>

          {user && (
            <button
              onClick={() => signOut(getAuthService())}
              className="flex flex-col items-center justify-center gap-1 py-1.5 px-4 rounded-xl text-zinc-600 dark:text-zinc-300 active:scale-90 transition-transform"
            >
              <LogOut size={20} className="text-zinc-600 dark:text-zinc-300" />
              <span className="text-[10px] font-semibold">Выйти</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
