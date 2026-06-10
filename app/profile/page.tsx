"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Clock, BarChart3, GraduationCap, Calendar, NotebookPen, ChevronRight, Loader2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { getAllCompletedLessons, getAllNotes } from "@/lib/firebase";
import { courses, coursesMap, lessonsMap } from "@/lib/data";
import Link from "next/link";
import * as motion from "motion/react-client";
import { vkBridgeManager, type VKUserInfo } from "@/lib/vkBridge";

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

/**
 * Performance: Define static arrays outside the component body
 * to prevent recreation and stable reference for memoization.
 */
const noteColors = [
  'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50',
  'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50',
  'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50',
  'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50',
  'bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800/50',
];

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("Имя");
  const [lastName, setLastName] = useState("Пользователь");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [mounted, setMounted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [notes, setNotes] = useState<{ id: string; courseId: string; lessonId: number; content: string; updatedAt: any }[]>([]);

  useEffect(() => {
    setMounted(true);
    setUserId(Math.floor(Math.random() * 900000) + 100000);

    const initializeProfile = async () => {
      try {
        setIsLoading(true);

        // Fetch notes
        const fetchNotes = async () => {
          try {
            const userNotes = await getAllNotes();
            setNotes(userNotes);
          } catch (error) {
            console.error("[Profile] Failed to fetch notes:", error);
          }
        };

        // Fetch VK user info
        const fetchVkUser = async () => {
          try {
            const userInfo: VKUserInfo | null = await vkBridgeManager.getUserInfo();
            
            if (userInfo) {
              setFirstName(userInfo.first_name || "Имя");
              setLastName(userInfo.last_name || "Пользователь");
              
              if (userInfo.photo_200) {
                setAvatarUrl(userInfo.photo_200);
                console.log("[Profile] VK user info loaded successfully");
              }
            } else {
              console.log("[Profile] No VK user info available");
            }
          } catch (error) {
            console.error("[Profile] Failed to get VK user info:", error);
            // App continues with default values
          }
        };

        // Fetch progress
        const fetchProgress = async () => {
          try {
            const count = await getAllCompletedLessons(courses);
            setCompletedCount(count);
            console.log("[Profile] Completed lessons count:", count);
          } catch (error) {
            console.error("[Profile] Failed to fetch progress:", error);
            setCompletedCount(0);
          }
        };

        // Run in parallel
        await Promise.all([fetchVkUser(), fetchProgress(), fetchNotes()]);
      } catch (error) {
        console.error("[Profile] Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:32px_32px] opacity-20 -z-20" />

      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-8 hover:text-indigo-600 transition-all font-bold text-sm uppercase tracking-widest vk-active">
          <ArrowLeft size={18} /> Назад
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Загрузка профиля...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Premium Profile Header */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-[3rem] p-8 md:p-16 overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -ml-32 -mb-32" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                <div className="relative shrink-0">
                  <div className="absolute -inset-4 bg-white/10 dark:bg-zinc-900/5 rounded-full blur-2xl" />
                  <div className="relative">
                    <img src={avatarUrl} alt="Avatar" className="w-40 h-40 rounded-[2.5rem] border-4 border-white/20 dark:border-zinc-900/10 shadow-2xl object-cover rotate-3 hover:rotate-0 transition-transform duration-500" />
                    <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-3 rounded-2xl shadow-xl">
                      <Trophy size={20} />
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-left space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2 block">Личный кабинет</span>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                      {firstName}<br />{lastName}
                    </h1>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    <div className="px-4 py-2 bg-white/10 dark:bg-zinc-900/5 backdrop-blur-md rounded-xl text-xs font-bold border border-white/10 dark:border-zinc-900/10">
                      ID: {userId || "------"}
                    </div>
                    <div className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                      Pro Аккаунт
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Completed Lessons Card */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-indigo-500/50 transition-all duration-500"
              >
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap size={24} />
                </div>
                <div className="text-3xl font-black mb-1">{completedCount}</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Уроков пройдено</div>
              </motion.div>

              {/* Records Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-emerald-500/50 transition-all duration-500"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar size={24} />
                </div>
                <div className="text-3xl font-black mb-1">5 дней</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ударный режим</div>
              </motion.div>

              {/* Total Courses Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-card p-8 rounded-[2.5rem] flex flex-col items-center text-center group hover:border-amber-500/50 transition-all duration-500"
              >
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 size={24} />
                </div>
                <div className="text-3xl font-black mb-1">{courses.length}</div>
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Всего курсов</div>
              </motion.div>
            </div>

            {/* Weekly Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 md:p-10 rounded-[3rem]"
            >
              <div className="flex items-center gap-3 mb-8">
                <BarChart3 className="text-indigo-500" />
                <h3 className="text-xl font-black uppercase tracking-widest">Активность</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStats}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} opacity={0.1} />
                    <XAxis dataKey="day" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="progress" fill="url(#barGradient)" radius={[8, 8, 8, 8]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* My Notes Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <NotebookPen className="text-indigo-500" />
                  <h3 className="text-xl font-black uppercase tracking-widest">Мои конспекты</h3>
                </div>
                <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {notes.length} записей
                </span>
              </div>

              {notes.length === 0 ? (
                <div className="glass-card p-12 rounded-[3rem] text-center border-dashed border-2">
                  <NotebookPen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <p className="text-zinc-500 font-bold">У тебя пока нет конспектов. Начни учиться и записывать важное!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {notes.map((note, idx) => {
                    /**
                     * Performance: Using O(1) maps for lookups instead of O(N) .find().
                     */
                    const course = coursesMap[note.courseId];
                    const lesson = lessonsMap[`${note.courseId}_${note.lessonId}`];
                    const colorClass = noteColors[idx % noteColors.length];

                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, rotate: idx % 2 === 0 ? -1 : 1 }}
                        whileInView={{ opacity: 1, rotate: idx % 2 === 0 ? -2 : 2 }}
                        whileHover={{ rotate: 0, scale: 1.02, zIndex: 20 }}
                        className={`p-8 rounded-[2.5rem] border-2 shadow-xl shadow-black/5 transition-all cursor-pointer relative group ${colorClass}`}
                      >
                        {/* Tape decoration */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-black/10 rotate-1 z-10" />

                        <Link href={`/course/${note.courseId}/lesson/${note.lessonId}`} className="block h-full">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                {course?.title}
                              </span>
                              <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-black/20 flex items-center justify-center">
                                <ChevronRight size={16} className="opacity-60" />
                              </div>
                            </div>

                            <h4 className="font-black text-xl leading-tight">
                              {lesson?.title}
                            </h4>

                            <p className="text-sm font-medium opacity-70 line-clamp-4 leading-relaxed whitespace-pre-line">
                              {note.content}
                            </p>

                            <div className="pt-4 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                              <span className="text-[9px] font-black uppercase tracking-tighter opacity-40">
                                Урок {note.lessonId}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-tighter opacity-40">
                                {new Date(note.updatedAt?.seconds * 1000).toLocaleDateString() || 'Недавно'}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
