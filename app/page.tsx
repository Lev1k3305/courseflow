"use client";

import { useEffect, useState, useMemo, memo } from "react";
import { getAuthService } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { courses, type Course } from "@/lib/data";
import { Navbar } from "@/components/Navbar";
import { Bot, Terminal, Code, Smartphone, Sparkles, ArrowRight, Settings, Palette, Monitor, Globe, Layers, BookOpen, Star, Users, Zap } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";

const iconMapRecord: Record<string, any> = {
  "ai-mastery": Bot,
  "oop-python": Terminal,
  "oop-java": Code,
  "flutter-dev": Smartphone,
  "dev-tools": Settings,
  "graphic-design": Palette,
  "web-design": Monitor,
  "web-dev": Globe,
  "fullstack-dev": Layers,
};

const categoryGradients: Record<string, string> = {
  "all": "from-indigo-600 to-violet-600",
  "ai": "from-blue-600 to-cyan-600",
  "programming": "from-emerald-600 to-teal-600",
  "design": "from-rose-600 to-orange-600",
  "web": "from-amber-600 to-orange-600",
};

const categories = [
  { id: "all", label: "Все курсы" },
  { id: "ai", label: "Искусственный интеллект" },
  { id: "programming", label: "Программирование" },
  { id: "design", label: "Дизайн и UX/UI" },
  { id: "web", label: "Веб-разработка" },
];

const ratingStars = [1, 2, 3, 4, 5];
const avatarIndices = [1, 2, 3];

const getRecommendation = (courseId: string) => {
  if (courseId === "web-dev") return "Full-stack разработка";
  if (courseId === "graphic-design") return "Веб-дизайн и UX/UI";
  return null;
};

/**
 * Generates a stable numeric seed from a string identifier.
 * Used to ensure avatar URLs remain consistent across re-renders and filtering.
 */
const getCourseSeed = (courseId: string) => {
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash << 5) - hash + courseId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

interface CourseCardProps {
  course: Course;
  index: number;
}

/**
 * Memoized Course Card component to prevent unnecessary re-renders when filtering categories.
 * Optimized with stable image seeds and explicit dimensions to improve LCP/CLS.
 */
const CourseCard = memo(({ course, index }: CourseCardProps) => {
  const IconComponent = iconMapRecord[course.id] || Sparkles;
  const recommendation = getRecommendation(course.id);
  const stableSeed = getCourseSeed(course.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className={`group glass-card rounded-3xl transition-all duration-300 flex flex-col hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 vk-active cursor-pointer ${recommendation ? "relative" : ""}`}
    >
      {recommendation && (
        <div className="absolute -top-3 -right-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg z-20 flex items-center gap-1.5">
          <Zap size={10} fill="currentColor" />
          Рекомендуем
        </div>
      )}
      <Link href={`/course/${course.id}`} className="p-6 flex flex-col h-full">
        <div className={`mb-6 p-4 rounded-2xl w-14 h-14 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner ${
          course.category === "ai" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" :
          course.category === "programming" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" :
          course.category === "design" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600" :
          "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
        }`}>
          <IconComponent size={28} strokeWidth={2} />
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            {course.lessons.length} уроков
          </span>
          <div className="flex gap-0.5">
            {ratingStars.map((s) => (
              <Star key={s} size={10} className="text-amber-400 fill-amber-400" />
            ))}
          </div>
        </div>

        <h3 className="text-xl font-black mb-3 text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {course.title}
        </h3>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8 flex-grow">
          {course.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50 mt-auto">
          <div className="flex -space-x-2">
             {avatarIndices.map((i) => (
               <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                 {/*
                    Performance: Using a stable seed derived from courseId instead of loop index
                    prevents avatar flickering and redundant network requests when filtering.
                    Added explicit width/height to prevent layout shifts (CLS).
                 */}
                 <img
                    src={`https://i.pravatar.cc/100?img=${(stableSeed + i) % 70}`}
                    alt="User"
                    loading="lazy"
                    width={28}
                    height={28}
                 />
               </div>
             ))}
             <div className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-bold text-zinc-500">
               +12
             </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter group-hover:gap-2 transition-all">
            Начать обучение <ArrowRight size={14} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
});

CourseCard.displayName = "CourseCard";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setMounted(true);
    signInAnonymously(getAuthService()).catch((error) => console.error("Auth error:", error));
  }, []);

  const filteredCourses = useMemo(() =>
    category === "all" ? courses : courses.filter((c) => c.category === category)
  , [category]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-mesh">
      {/* Hero Section */}
      <section className="px-6 pt-20 pb-12 text-center relative overflow-hidden">
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative z-10"
        >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6 border border-indigo-200/50 dark:border-indigo-800/50"
            >
              <Sparkles size={14} />
              <span>Платформа №1 для обучения в VK</span>
            </motion.div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tight mb-6 text-balance leading-tight">
              Твой путь в <span className={`bg-gradient-to-r ${categoryGradients[category]} bg-clip-text text-transparent transition-all duration-500`}>IT-будущее</span> начинается здесь
            </h1>

            <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed text-balance">
              Интерактивные курсы по самым востребованным направлениям. Учись, практикуйся и развивай навыки в формате VK Mini App.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 vk-active shadow-sm ${
                    category === c.id
                      ? `bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none`
                      : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-zinc-500 dark:text-zinc-500 font-medium">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span>10,000+ студентов</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={18} />
                <span>50+ уроков</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" />
                <span>4.9 рейтинг</span>
              </div>
            </div>
        </motion.div>
      </section>

      {/* Course Grid */}
      <section id="courses" className="px-6 pb-20 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredCourses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
