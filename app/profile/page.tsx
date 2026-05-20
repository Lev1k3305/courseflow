"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Clock, BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { getAllCompletedLessons } from "@/lib/firebase";
import { courses } from "@/lib/data";
import Link from "next/link";
import vkBridge from "@vkontakte/vk-bridge";

// Mock data for progress
const weeklyStats = [
  { day: "Пн", progress: 45 },
  { day: "Вт", progress: 70 },
  { day: "Ср", progress: 30 },
  { day: "Чт", progress: 90 },
  { day: "Пт", progress: 60 },
  { day: "Сб", progress: 85 },
  { day: "Вс", progress: 50 },
];

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("Имя");
  const [lastName, setLastName] = useState("Пользователь");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [mounted, setMounted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    
    async function fetchVkUser() {
      try {
        const userInfo = await vkBridge.send("VKWebAppGetUserInfo");
        if (userInfo) {
          setFirstName(userInfo.first_name || "Имя");
          setLastName(userInfo.last_name || "Пользователь");
          if (userInfo.photo_200) {
            setAvatarUrl(userInfo.photo_200);
          }
        }
      } catch (error) {
        console.warn("Failed to get VK user info, using mock values:", error);
      }
    }
    
    async function fetchProgress() {
        const count = await getAllCompletedLessons(courses);
        setCompletedCount(count);
    }
    
    fetchVkUser();
    fetchProgress();
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-8 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={20} /> Назад к курсам
        </Link>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 mb-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
                <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-indigo-50 dark:border-zinc-700 shadow-inner bg-zinc-100 dark:bg-zinc-800" />
                <input 
                    type="text" 
                    value={avatarUrl} 
                    onChange={(e) => setAvatarUrl(e.target.value)} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    title="Изменить URL аватара"
                />
            </div>
            <div className="flex-1 w-full text-center sm:text-left">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        className="text-3xl font-bold bg-transparent border-b-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-indigo-500 outline-none w-full"
                    />
                    <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        className="text-3xl font-bold bg-transparent border-b-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:border-indigo-500 outline-none w-full"
                    />
                </div>
                <p className="text-zinc-500 mt-1">студент</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-6 text-zinc-900 dark:text-zinc-100 font-semibold">
                    <Trophy className="text-indigo-500" />
                    <span>Прогресс за неделю</span>
                </div>
                <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                            <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px', color: '#fff' }} />
                            <Bar dataKey="progress" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
                 
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex flex-col justify-between">
               <div className="flex items-center gap-3 mb-6 text-zinc-900 dark:text-zinc-100 font-semibold">
                    <Clock className="text-indigo-500" />
                    <span>Статистика</span>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                        <span className="text-zinc-600 dark:text-zinc-400 text-sm">Всего уроков</span>
                        <span className="font-bold text-lg">24</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl">
                        <span className="text-indigo-700 dark:text-indigo-300 text-sm">Завершено</span>
                        <span className="font-bold text-lg text-indigo-600">{completedCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl">
                        <span className="text-emerald-700 dark:text-emerald-300 text-sm">Рекорд</span>
                        <span className="font-bold text-lg text-emerald-600">5 дней</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
