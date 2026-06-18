"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { ArrowLeft, Trophy, Clock, BarChart3, GraduationCap, Calendar, NotebookPen, ChevronRight, Loader2, Target, Copy, Check, TrendingUp, Sparkles, Star } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from "recharts";
import { getAllCompletedLessons, getAllNotes, type Note } from "@/lib/firebase";
import { courses, coursesMap, lessonsMap, totalLessonsCount, courseCategories, categorySeeds } from "@/lib/data";
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

const noteColors = [
  'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800/50',
  'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50',
  'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/50',
  'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800/50',
  'bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800/50',
];

const achievements = [
  { id: 'note-taker', title: 'Конспектировщик', icon: <NotebookPen size={20} />, description: 'Создал более 5 заметок' },
  { id: 'quiz-master', title: 'Мастер Квизов', icon: <Target size={20} />, description: 'Решил 10 тестов без ошибок' },
  { id: 'course-pioneer', title: 'Первопроходец', icon: <Sparkles size={20} />, description: 'Завершил первый курс' },
  { id: 'streak-king', title: 'Король Стрика', icon: <Calendar size={20} />, description: '7 дней обучения подряд' },
];

const skillIcons = [
  <Target key="ai" size={14} />,
  <GraduationCap key="prog" size={14} />,
  <BarChart3 key="web" size={14} />,
  <Trophy key="growth" size={14} />,
  <Calendar key="design" size={14} />
];

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("Имя");
  const [lastName, setLastName] = useState("Пользователь");
  const [avatarUrl, setAvatarUrl] = useState("https://api.dicebear.com/7.x/avataaars/svg?seed=Felix");
  const [mounted, setMounted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [userNotes, setUserNotes] = useState<Note[]>([]);

  const skillProgress = useMemo(() => courseCategories.map(cat => {
    const seed = categorySeeds[cat] || 0;
    const progress = (seed + completedCount * 7) % 101;
    return { name: cat, progress };
  }), [completedCount]);

  const userLevel = useMemo(() => Math.floor(completedCount / 3) + 1, [completedCount]);

  useEffect(() => {
    setMounted(true);
    setUserId(Math.floor(Math.random() * 900000) + 100000);

    const initializeProfile = async () => {
      try {
        setIsLoading(true);

        // Fetch VK user info with timeout
        const fetchVkUser = async () => {
          try {
            // timeout promise
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            );

            const userInfo: VKUserInfo | null = await Promise.race([
              vkBridgeManager.getUserInfo(),
              timeoutPromise
            ]) as VKUserInfo | null;
            
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

        // Fetch notes
        const fetchNotes = async () => {
          try {
            const notes = await getAllNotes();
            setUserNotes(notes);
            console.log("[Profile] Notes loaded:", notes.length);
          } catch (error) {
            console.error("[Profile] Failed to fetch notes:", error);
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
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 relative overflow-hidden transition-colors">
      {/* Background blobs */}
      <div className="absolute top-0 left-1/4 w-full max-w-lg aspect-square bg-indigo-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-full max-w-lg aspect-square bg-violet-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:32px_32px] opacity-20 -z-20" />

      <div className="max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-8 hover:text-indigo-600 transition-all font-black text-xs uppercase tracking-widest vk-active">
          <ArrowLeft size={16} /> На главную
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Формируем профиль...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Bento Container */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-8">

              {/* Modern Compact Header - Large Span */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[3rem] overflow-hidden relative md:col-span-8 lg:col-span-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent pointer-events-none" />
                <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  <div className="relative group shrink-0">
                    <div className="relative p-2">
                       <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-100 dark:text-zinc-800" />
                        <motion.circle
                          cx="50" cy="50" r="48" fill="none" stroke="url(#headerGrad)" strokeWidth="4" strokeDasharray="301.6"
                          initial={{ strokeDashoffset: 301.6 }}
                          animate={{ strokeDashoffset: 301.6 - (301.6 * (completedCount / totalLessonsCount)) }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#a855f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-zinc-900 shadow-xl relative z-10 object-cover"
                        width={128}
                        height={128}
                        loading="eager"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg z-20 border-2 border-white dark:border-zinc-900">
                      <Trophy size={16} />
                    </div>
                  </div>

                  <div className="text-center md:text-left flex-grow">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                      <h1 className="text-3xl md:text-5xl font-black tracking-tight">{firstName} {lastName}</h1>
                      <div className="flex items-center justify-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full border border-emerald-500/20 self-center md:self-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Active Now</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Level</div>
                        <div className="text-2xl font-black text-indigo-600">{userLevel}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Streak</div>
                        <div className="text-2xl font-black text-indigo-600">5</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-center">
                        <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Rating</div>
                        <div className="text-2xl font-black text-indigo-600">4.9</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ID Card - Sidebar Bento Span */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-8 rounded-[3rem] bg-zinc-900 text-white shadow-2xl relative overflow-hidden border border-white/10 md:col-span-4 flex flex-col min-h-[400px] group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-zinc-900 to-violet-600/40 opacity-90 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full -ml-24 -mb-24 blur-3xl animate-pulse" />

                <div className="relative z-10 h-full flex flex-col justify-between">
                  {/* Holographic shimmer effect */}
                  <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                    <motion.div
                      animate={{
                        x: ["-100%", "200%"]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                    />
                  </div>

                  <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-xl">
                        <Sparkles size={20} className="text-indigo-400 animate-pulse" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-400/80">Digital Credential</span>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Mastery Passport</span>
                      </div>
                    </div>
                    <div className="w-14 h-9 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center shadow-inner overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                       <div className="w-7 h-5 bg-indigo-500/30 rounded-md flex items-center justify-center border border-white/10">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div>
                      <div className="text-[9px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-2 opacity-60">Passport Serial ID</div>
                      <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 group-hover:border-indigo-500/50 transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                        <div className="font-mono text-2xl tracking-[0.3em] font-black text-white/95 group-hover:text-indigo-300 transition-colors">
                          {userId ? `CF-${userId}` : "CF-000000"}
                        </div>
                      </div>
                    </div>
                    <div className="pt-6 flex items-center justify-between border-t border-white/10">
                       <div>
                          <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 opacity-60">Auth Status</div>
                          <div className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-lg border border-indigo-500/30">Verified Expert</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1 opacity-60">Valid Thru</div>
                          <div className="text-[10px] font-black uppercase tracking-widest">PERMANENT</div>
                       </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Achievements Section - Large Bento Span */}
              <div className="md:col-span-12 space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <Sparkles className="text-amber-500" size={20} />
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Достижения</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {achievements.map((achievement, idx) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="glass-card p-6 rounded-[2rem] text-center group cursor-help relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-indigo-500 mx-auto mb-4 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-indigo-500/20 group-hover:rotate-6">
                        {achievement.icon}
                      </div>
                      <h4 className="text-[11px] font-black uppercase tracking-tight mb-1">{achievement.title}</h4>
                      <p className="text-[9px] text-zinc-400 font-bold leading-tight">{achievement.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Dashboard Stats Section - Refined Bento Grid - Inside the main container */}
              <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Large Stats Card */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="md:col-span-8 glass-card bg-gradient-to-br from-indigo-600/5 via-transparent to-violet-600/5 p-8 md:p-10 rounded-[3rem] flex flex-col justify-between group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <GraduationCap size={160} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2">Общий прогресс обучения</div>
                    <div className="flex items-baseline gap-3 mb-auto">
                      <div className="text-7xl font-black tracking-tighter">{completedCount}</div>
                      <div className="text-2xl font-bold text-zinc-400 tracking-tight">/ {totalLessonsCount}</div>
                    </div>
                    <p className="mt-4 text-xs font-bold text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                      Ты прошел уже {Math.round((completedCount / totalLessonsCount) * 100)}% всего материала. Продолжай в том же темпе!
                    </p>
                  </div>
                  <div className="mt-auto pt-10 h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                     <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(completedCount / totalLessonsCount) * 100}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                     />
                  </div>
                </motion.div>

                {/* Skill Map - Bento Span */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-8 rounded-[3rem] relative overflow-hidden md:col-span-4 row-span-2"
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
                                 {skillIcons[i % skillIcons.length]}
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

              {/* My Notes Bento Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="md:col-span-8 glass-card p-8 md:p-10 rounded-[3rem] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                  <NotebookPen size={120} />
                </div>

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <NotebookPen size={20} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-widest">Мои конспекты</h3>
                    </div>
                    <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      Всего: {userNotes.length}
                    </span>
                  </div>

                  {userNotes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userNotes.slice(0, 4).map((note, idx) => {
                        const lessonKey = `${note.courseId}_${note.lessonId}`;
                        const lesson = lessonsMap[lessonKey];
                        const course = coursesMap[note.courseId];
                        const colorClass = noteColors[idx % noteColors.length];

                        return (
                          <Link
                            key={note.id}
                            href={`/course/${note.courseId}/lesson/${note.lessonId}`}
                            className={`p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${colorClass}`}
                          >
                            <div className="text-[8px] font-black text-zinc-500/60 uppercase tracking-widest mb-1 truncate">
                              {course?.title || "Курс"}
                            </div>
                            <h4 className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 mb-2 line-clamp-1">
                              {lesson?.title || `Урок ${note.lessonId}`}
                            </h4>
                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 line-clamp-2 font-medium leading-relaxed">
                              {note.content}
                            </p>
                          </Link>
                        );
                      })}
                      {userNotes.length > 4 && (
                        <div className="sm:col-span-2 text-center mt-2">
                           <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 mx-auto">
                             Смотреть все записи <ChevronRight size={12} />
                           </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center py-10 text-center">
                       <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center text-zinc-300 mb-4">
                          <NotebookPen size={32} />
                       </div>
                       <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">У тебя пока нет конспектов</p>
                       <p className="text-[10px] text-zinc-500 mt-2 max-w-[200px]">Начни изучать уроки и записывай важное!</p>
                    </div>
                  )}
                </div>
              </motion.div>

                {/* Learning Pulse Card */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="md:col-span-4 glass-card p-8 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 group relative overflow-hidden bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10"
                >
                   <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                      <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 text-white flex items-center justify-center relative z-10 shadow-lg shadow-emerald-500/20">
                        <Sparkles size={40} />
                      </div>
                   </div>
                   <div>
                      <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Ударный режим</div>
                      <div className="text-4xl font-black tracking-tighter">5 Дней</div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter mt-2">Ты в огне! 🔥</p>
                   </div>
                </motion.div>

                <div className="md:col-span-4 glass-card p-8 rounded-[3rem] flex flex-col items-center justify-center text-center gap-6 group relative overflow-hidden">
                  <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all shadow-sm">
                    <TrendingUp size={40} />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Рост за месяц</div>
                    <div className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-white">+{Math.round(completedCount * 1.5)}%</div>
                  </div>
                  <div className="px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                    Excellent Progress
                  </div>
                </div>
              </div>

              {/* Weekly Activity Chart - Bento Span */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-8 md:p-10 rounded-[3rem] overflow-hidden relative md:col-span-12"
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

          </div>
        )}
      </div>
    </main>
  );
}
