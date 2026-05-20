"use client";

import { useEffect, useState } from "react";
import { getAuthService } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { courses } from "@/lib/data";
import { Navbar } from "@/components/Navbar";
import { Bot, Terminal, Code, Smartphone, Sparkles, ArrowRight, Settings, Palette, Monitor, Globe, Layers } from "lucide-react";
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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState("all");

  useEffect(() => {
    setMounted(true);
    signInAnonymously(getAuthService()).catch((error) => console.error("Auth error:", error));
  }, []);

  if (!mounted) return null;

  const categories = [
    { id: "all", label: "Все" },
    { id: "ai", label: "ИИ" },
    { id: "programming", label: "Программирование" },
    { id: "design", label: "Дизайн" },
    { id: "web", label: "Веб-разработка" },
  ];

  const filteredCourses = category === "all" ? courses : courses.filter((c) => c.category === category);

  // Recommendations: for novices in web-dev, recommend fullstack; for design, web-design.
  const getRecommendation = (courseId: string) => {
    if (courseId === "web-dev") return "Full-stack разработка";
    if (courseId === "graphic-design") return "Веб-дизайн и UX/UI";
    return null;
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">

      <section className="px-6 py-16 text-center">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h2 className="text-5xl md:text-6xl font-extrabold tracking-tighter mb-6 bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                Освой современный стек.
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
                Практические курсы по ИИ, разработке и анализу данных.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all vk-active ${
                    category === c.id
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
        </motion.div>
      </section>

      <section id="courses" className="px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {filteredCourses.map((course) => {
            const IconComponent = iconMapRecord[course.id] || Sparkles;
            const recommendation = getRecommendation(course.id);
            return (
              <motion.div 
                key={course.id} 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`group border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col hover:border-indigo-200 dark:hover:border-indigo-900 vk-active cursor-pointer ${recommendation ? "relative" : ""}`}
              >
                {recommendation && (
                  <div className="absolute -top-3 -right-3 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    Рекомендуем: {recommendation}
                  </div>
                )}
                <Link href={`/course/${course.id}`} className="p-5 flex flex-col flex-grow">
                  <div className="mb-6 text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-zinc-800 rounded-2xl w-14 h-14 flex items-center justify-center">
                    <IconComponent size={28} strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold mb-1 text-zinc-900 dark:text-zinc-100">{course.title}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 flex-grow leading-relaxed">{course.description}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
