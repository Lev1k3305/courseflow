"use client";

import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Trophy, Clock, BarChart3, GraduationCap, Calendar, NotebookPen, ChevronRight, Loader2, Target, Copy, Check } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { getAllCompletedLessons, getAllNotes } from "@/lib/firebase";
import { courses, coursesMap, lessonsMap } from "@/lib/data";
import Link from "next/link";
import * as motion from "motion/react-client";
import { vkBridgeManager, type VKUserInfo } from "@/lib/vkBridge";

function NoteCard({ note, course, lesson, index }: { note: any, course: any, lesson: any, index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, rotate: index % 2 === 0 ? -1 : 1 }}
      className="glass-card p-8 rounded-[2.5rem] border-zinc-200/50 dark:border-zinc-800/50 transition-all relative group flex flex-col h-full shadow-xl shadow-zinc-200/50 dark:shadow-none"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
             {course?.title || "Курс"}
           </span>
        </div>
        <button
          onClick={handleCopy}
          className={`p-2.5 rounded-xl transition-all vk-active ${
            copied ? "bg-emerald-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-indigo-500 shadow-sm"
          }`}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      <Link href={`/course/${note.courseId}/lesson/${note.lessonId}`} className="flex-grow group/link">
        <h4 className="font-black text-xl leading-tight mb-4 group-hover/link:text-indigo-500 transition-colors">
          {lesson?.title || `Урок ${note.lessonId}`}
        </h4>

        <div className="relative mb-6 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-white dark:bg-zinc-800/50 pointer-events-none"
               style={{
                 backgroundImage: 'repeating-linear-gradient(transparent, transparent 23px, rgba(99, 102, 241, 0.1) 23px, rgba(99, 102, 241, 0.1) 24px)',
                 backgroundSize: '100% 24px'
               }} />
          <p className="relative z-10 p-4 text-sm font-medium text-zinc-700 dark:text-zinc-300 line-clamp-6 leading-[24px] whitespace-pre-line italic">
            «{note.content}»
          </p>
        </div>
      </Link>

      <div className="pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50 mt-auto">
        <div className="flex items-center gap-2">
           <GraduationCap size={12} className="text-zinc-400" />
           <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">
             Урок {note.lessonId}
           </span>
        </div>
        <div className="flex items-center gap-2">
           <Calendar size={12} className="text-zinc-400" />
           <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-400">
             {new Date(note.updatedAt?.seconds * 1000).toLocaleDateString() || 'Недавно'}
           </span>
        </div>
      </div>
    </motion.div>
  );
}

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

  const noteColors = useMemo(() => [
    'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50',
    'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50',
    'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50',
    'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50',
    'bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800/50',
  ], []);

  const categories = useMemo(() => Array.from(new Set(courses.map(c => c.category))), []);

  const totalLessonsCount = useMemo(() => courses.reduce((acc, c) => acc + c.lessons.length, 0), []);

  const skillProgress = useMemo(() => categories.map(cat => {
    const seed = cat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const progress = (seed + completedCount * 7) % 101;
    return { name: cat, progress };
  }), [categories, completedCount]);

  const userLevel = useMemo(() => Math.floor(completedCount / 3) + 1, [completedCount]);

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
                className="relative rounded-[3rem] p-8 md:p-14 overflow-hidden bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/30 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/30 rounded-full blur-[100px] -ml-40 -mb-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center gap-8">
                  <div className="relative shrink-0">
                    <div className="relative p-3">
                      {/* Circular Progress Ring */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                        <circle
                          cx="50" cy="50" r="46"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          className="text-white/10 dark:text-zinc-900/5"
                        />
                        <motion.circle
                          cx="50" cy="50" r="46"
                          fill="none"
                          stroke="url(#avatarGradientPremium)"
                          strokeWidth="3.5"
                          strokeDasharray="289"
                          initial={{ strokeDashoffset: 289 }}
                        animate={{ strokeDashoffset: 289 - (289 * (completedCount / totalLessonsCount)) }}
                          transition={{ duration: 2, ease: "circOut" }}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="avatarGradientPremium" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#818cf8" />
                            <stop offset="100%" stopColor="#c084fc" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <img src={avatarUrl} alt="Avatar" className="w-28 h-28 sm:w-40 sm:h-40 rounded-full border-[6px] border-white/20 dark:border-zinc-900/10 shadow-2xl object-cover relative z-10" />
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute -bottom-1 -right-1 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white p-3 rounded-2xl shadow-[0_8px_16px_rgba(99,102,241,0.4)] z-20"
                    >
                      <Trophy size={20} />
                    </motion.div>
                  </div>

                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 dark:text-indigo-600 mb-2 block italic">Эксперт Платформы</span>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight mb-4">
                      {firstName} {lastName}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-3">
                      <div className="px-5 py-2 bg-white/10 dark:bg-zinc-900/5 backdrop-blur-xl rounded-2xl text-[11px] font-black border border-white/20 dark:border-zinc-900/10 shadow-sm uppercase tracking-widest">
                        Level {userLevel}
                      </div>
                      <div className="px-5 py-2 bg-emerald-500/20 backdrop-blur-xl text-emerald-400 dark:text-emerald-600 rounded-2xl text-[11px] font-black border border-emerald-500/30 shadow-sm uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Dashboard Stats Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-4">
                  <BarChart3 className="text-indigo-500" size={20} />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Статистика обучения</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border-[0.5px] border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap size={32} />
                    </div>
                    <div>
                      <div className="text-4xl font-black tracking-tighter mb-1">{completedCount}</div>
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Уроков</div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border-[0.5px] border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar size={32} />
                    </div>
                    <div>
                      <div className="text-4xl font-black tracking-tighter mb-1">5</div>
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Дней стрик</div>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    className="glass-card bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border-[0.5px] border-zinc-200/50 dark:border-zinc-800/50 flex flex-col items-center text-center gap-4 group"
                  >
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <BarChart3 size={32} />
                    </div>
                    <div>
                      <div className="text-4xl font-black tracking-tighter mb-1">{Math.round((completedCount / totalLessonsCount) * 100)}%</div>
                      <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Прогресс</div>
                    </div>
                  </motion.div>
                </div>
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
                className="glass-card p-8 rounded-[3rem] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

                <h3 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <Target size={16} />
                  </div>
                  Карта навыков
                </h3>

                <div className="space-y-6 relative z-10">
                  {skillProgress.map((skill, i) => {
                    const icons = [
                      <Target key="ai" size={14} />,
                      <GraduationCap key="prog" size={14} />,
                      <BarChart3 key="web" size={14} />,
                      <Trophy key="growth" size={14} />,
                      <Calendar key="design" size={14} />
                    ];

                    return (
                      <div key={i} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                               i === 0 ? 'bg-indigo-500/10 text-indigo-500' :
                               i === 1 ? 'bg-emerald-500/10 text-emerald-500' :
                               i === 2 ? 'bg-amber-500/10 text-amber-500' :
                               i === 3 ? 'bg-rose-500/10 text-rose-500' : 'bg-violet-500/10 text-violet-500'
                             }`}>
                               {icons[i % icons.length]}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{skill.name}</span>
                          </div>
                          <span className="text-[11px] font-black tabular-nums">{skill.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${skill.progress}%` }}
                            transition={{ delay: i * 0.1, duration: 1.5, ease: "circOut" }}
                            className={`h-full rounded-full shadow-[0_0_12px_rgba(99,102,241,0.3)] ${
                              i === 0 ? 'bg-indigo-500' :
                              i === 1 ? 'bg-emerald-500' :
                              i === 2 ? 'bg-amber-500' :
                              i === 3 ? 'bg-rose-500' : 'bg-violet-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
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
                className="p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-zinc-900 to-violet-900 text-white shadow-2xl relative overflow-hidden border border-white/10"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-24 -mb-24 blur-3xl animate-pulse" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                        <Trophy size={18} className="text-indigo-400" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Mastery Passport</span>
                    </div>
                    <div className="w-12 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                       <div className="w-6 h-4 bg-indigo-500/20 rounded-sm overflow-hidden flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-indigo-400 animate-ping" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Passport ID</div>
                      <div className="font-mono text-xl tracking-[0.2em] font-bold text-white/90">
                        {userId ? `CF-${userId}` : "CF-000000"}
                      </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between">
                       <div>
                          <div className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest mb-0.5">Status</div>
                          <div className="text-xs font-black uppercase tracking-widest">Verified Expert</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[8px] font-black text-indigo-400/60 uppercase tracking-widest mb-0.5">Issue Date</div>
                          <div className="text-xs font-black uppercase tracking-widest">2024-25</div>
                       </div>
                    </div>
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                  {notes.map((note, index) => {
                    const course = coursesMap[note.courseId];
                    const lesson = lessonsMap[`${note.courseId}_${note.lessonId}`];

                    return (
                      <NoteCard
                        key={note.id}
                        note={note}
                        course={course}
                        lesson={lesson}
                        index={index}
                      />
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
