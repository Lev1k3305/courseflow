"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Clock, BarChart3, GraduationCap, Calendar, NotebookPen, ChevronRight, Loader2 } from "lucide-react";
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
    'bg-[#FEF9C3] dark:bg-amber-900/20 border-[#FEF08A] dark:border-amber-800/30',
    'bg-[#DBEAFE] dark:bg-blue-900/20 border-[#BFDBFE] dark:border-blue-800/30',
    'bg-[#D1FAE5] dark:bg-emerald-900/20 border-[#A7F3D0] dark:border-emerald-800/30',
    'bg-[#FFE4E6] dark:bg-rose-900/20 border-[#FECDD3] dark:border-rose-800/30',
    'bg-[#EDE9FE] dark:bg-violet-900/20 border-[#DDD6FE] dark:border-violet-800/30',
  ];

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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-[3.5rem] p-10 md:p-20 overflow-hidden bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-white/5 dark:border-black/5"
            >
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[120px] -mr-48 -mt-48 opacity-60 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/30 rounded-full blur-[100px] -ml-32 -mb-32 opacity-60" />

              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-16">
                <div className="relative group shrink-0">
                  <div className="absolute -inset-6 bg-indigo-500/20 dark:bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative">
                    <div className="w-44 h-44 rounded-[3rem] overflow-hidden border-2 border-white/10 dark:border-black/5 shadow-2xl transform transition-all duration-700 group-hover:scale-105 group-hover:rotate-2">
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700" />
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute -bottom-3 -right-3 bg-gradient-to-br from-indigo-500 to-violet-600 text-white p-4 rounded-2xl shadow-2xl border-4 border-zinc-950 dark:border-zinc-50"
                    >
                      <Trophy size={24} className="animate-bounce" />
                    </motion.div>
                  </div>
                </div>

                <div className="text-center md:text-left space-y-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 dark:bg-black/5 rounded-full border border-white/10 dark:border-black/5 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Студент CourseFlow</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 dark:from-zinc-950 dark:to-zinc-950/60">
                      {firstName}<br />{lastName}
                    </h1>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="px-5 py-2.5 bg-white/5 dark:bg-black/5 backdrop-blur-xl rounded-2xl text-xs font-bold border border-white/10 dark:border-black/10 shadow-sm">
                      <span className="opacity-50">UID:</span> {userId || "------"}
                    </div>
                    <div className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all cursor-default">
                      Premium Member
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: GraduationCap, label: "Уроков пройдено", value: completedCount, color: "indigo" },
                { icon: Calendar, label: "Ударный режим", value: "5 дней", color: "emerald" },
                { icon: BarChart3, label: "Всего курсов", value: courses.length, color: "amber" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="group relative"
                >
                   <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[2.5rem] opacity-0 group-hover:opacity-20 blur transition duration-500" />
                   <div className="glass-card relative p-10 rounded-[2.5rem] flex flex-col items-center text-center transition-all duration-500 h-full">
                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm ${
                      stat.color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' :
                      stat.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                      'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                    }`}>
                      <stat.icon size={28} />
                    </div>
                    <div className="text-4xl font-black mb-2 tracking-tight">{stat.value}</div>
                    <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Weekly Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-card relative p-10 md:p-12 rounded-[3.5rem] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Активность</h3>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Твои успехи за неделю</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest">Неделя</div>
                  <div className="px-4 py-2 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-50">Месяц</div>
                </div>
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyStats}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="8 8" stroke="#e4e4e7" vertical={false} opacity={0.1} />
                    <XAxis
                      dataKey="day"
                      stroke="#a1a1aa"
                      fontSize={11}
                      fontWeight={800}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(79, 70, 229, 0.04)', radius: 12 }}
                      contentStyle={{
                        backgroundColor: '#09090b',
                        borderColor: '#27272a',
                        borderRadius: '20px',
                        color: '#fff',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                      itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}
                    />
                    <Bar
                      dataKey="progress"
                      fill="url(#barGradient)"
                      radius={[12, 12, 12, 12]}
                      barSize={40}
                      animationDuration={1500}
                    />
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
                    const course = courses.find(c => c.id === note.courseId);
                    const lesson = course?.lessons.find(l => l.id === note.lessonId);
                    const colorClass = noteColors[idx % noteColors.length];

                    return (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -8, scale: 1.01 }}
                        className={`p-10 rounded-[3rem] border-b-4 border-r-4 shadow-[12px_12px_0_0_rgba(0,0,0,0.02)] dark:shadow-[12px_12px_0_0_rgba(255,255,255,0.01)] transition-all cursor-pointer relative group overflow-hidden ${colorClass}`}
                      >
                        {/* Interactive Shine */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        <Link href={`/course/${note.courseId}/lesson/${note.lessonId}`} className="block h-full">
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-black/10 dark:bg-white/10" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                                  {course?.title}
                                </span>
                              </div>
                              <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-black/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all duration-500">
                                <ChevronRight size={20} />
                              </div>
                            </div>

                            <h4 className="font-black text-2xl leading-[1.1] tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {lesson?.title}
                            </h4>

                            <p className="text-sm font-bold opacity-60 line-clamp-3 leading-relaxed whitespace-pre-line text-zinc-900 dark:text-white">
                              {note.content}
                            </p>

                            <div className="pt-6 flex items-center justify-between border-t border-black/5 dark:border-white/5">
                              <div className="px-3 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                                  L{note.lessonId}
                                </span>
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest opacity-30">
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
