"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Trophy, Clock, BarChart3, GraduationCap, Calendar, NotebookPen, ChevronRight, Loader2, Target } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { getAllCompletedLessons, getAllNotes } from "@/lib/firebase";
import { courses } from "@/lib/data";
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

  const noteColors = [
    'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50',
    'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50',
    'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50',
    'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50',
    'bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800/50',
  ];

  const categories = useMemo(() => Array.from(new Set(courses.map(c => c.category))), []);
  const skillProgress = useMemo(() => categories.map(cat => {
    // Determine a deterministic progress based on completedCount or stable indices
    // For now, we'll use a stable hash-like value if we don't have per-category persistence
    const seed = cat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const progress = (seed + completedCount * 7) % 101;
    return { name: cat, progress };
  }), [categories, completedCount]);

  const userLevel = useMemo(() => Math.floor(completedCount / 3) + 1, [completedCount]);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:32px_32px] opacity-20 -z-20" />

      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-8 hover:text-indigo-600 transition-all font-bold text-sm uppercase tracking-widest vk-active">
          <ArrowLeft size={18} /> Назад
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Загрузка профиля...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column: Bento Grid */}
            <div className="md:col-span-8 space-y-6">
              {/* Premium Profile Header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-[3rem] p-8 md:p-12 overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 md:gap-8">
                  <div className="relative shrink-0">
                    <img src={avatarUrl} alt="Avatar" className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] border-4 border-white/20 dark:border-zinc-900/10 shadow-2xl object-cover" />
                    <div className="absolute -bottom-2 -right-2 bg-indigo-500 text-white p-2 rounded-xl shadow-xl">
                      <Trophy size={16} />
                    </div>
                  </div>

                  <div className="text-center sm:text-left flex-grow">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50 mb-1 block italic">Мастер Знаний</span>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-3">
                      {firstName} {lastName}
                    </h1>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                      <div className="px-3 py-1 bg-white/10 dark:bg-zinc-900/5 backdrop-blur-md rounded-lg text-[10px] font-bold border border-white/10 dark:border-zinc-900/10">
                        Level {userLevel}
                      </div>
                      <div className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                        Online
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Bento Grid: Stats & Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                   whileHover={{ y: -5 }}
                   className="glass-card p-6 rounded-[2rem] flex flex-col justify-between"
                >
                  <GraduationCap className="text-indigo-500 mb-4" size={24} />
                  <div>
                    <div className="text-2xl font-black">{completedCount}</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Уроков пройдено</div>
                  </div>
                </motion.div>

                <motion.div
                   whileHover={{ y: -5 }}
                   className="glass-card p-6 rounded-[2rem] flex flex-col justify-between"
                >
                  <Calendar className="text-emerald-500 mb-4" size={24} />
                  <div>
                    <div className="text-2xl font-black">5 дней</div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ударный режим</div>
                  </div>
                </motion.div>

                <motion.div
                   whileHover={{ y: -5 }}
                   className="glass-card p-6 rounded-[2rem] flex flex-col justify-between sm:col-span-2"
                >
                  <BarChart3 className="text-amber-500 mb-4" size={24} />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-grow">
                      <div className="text-2xl font-black">{Math.round((completedCount / (courses.length * 8)) * 100)}%</div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Общий прогресс</div>
                    </div>
                    <div className="w-full max-w-[120px] h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (completedCount / (courses.length * 8)) * 100)}%` }}
                        className="h-full bg-amber-500"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Weekly Activity Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-8 rounded-[3rem] overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <BarChart3 size={120} />
                </div>
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Недельная активность</h3>
                </div>
                <div className="h-64 relative z-10">
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
                        contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '16px', color: '#fff', fontSize: '12px' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="progress" fill="url(#barGradient)" radius={[6, 6, 6, 6]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Skill Map & Info */}
            <div className="md:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-8 rounded-[3rem]"
              >
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Target className="text-rose-500" size={18} /> Карта навыков
                </h3>
                <div className="space-y-5">
                  {skillProgress.map((skill, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-zinc-500">{skill.name}</span>
                        <span className="text-zinc-900 dark:text-white">{skill.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${skill.progress}%` }}
                          transition={{ delay: i * 0.1, duration: 1 }}
                          className={`h-full rounded-full ${
                            i === 0 ? 'bg-indigo-500' :
                            i === 1 ? 'bg-emerald-500' :
                            i === 2 ? 'bg-amber-500' :
                            i === 3 ? 'bg-rose-500' : 'bg-violet-500'
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy className="text-indigo-600 dark:text-indigo-400" size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 dark:text-indigo-400">Спецпредложение</span>
                  </div>
                  <p className="text-[11px] text-indigo-800/70 dark:text-indigo-300/70 leading-relaxed font-medium">
                    Заверши ещё 2 урока по ИИ, чтобы получить значок «Архитектор Промптов»!
                  </p>
                </div>
              </motion.div>

              {/* ID Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 rounded-[2rem] bg-gradient-to-br from-zinc-800 to-black text-white shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <BarChart3 size={14} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Digital Passport</span>
                  </div>
                  <div className="font-mono text-sm tracking-widest mb-1 opacity-80">
                    USER_ID: {userId || "------"}
                  </div>
                  <div className="text-[9px] font-bold opacity-40 uppercase">Verified CourseFlow Learner</div>
                </div>
              </motion.div>
            </div>

            {/* My Notes Section (Full Width Below) */}
            <div className="md:col-span-12 mt-8">
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
                    const course = courses.find(c => c.id === note.courseId);
                    const lesson = course?.lessons.find(l => l.id === note.lessonId);
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
          </div>
        )}
      </div>
    </main>
  );
}
