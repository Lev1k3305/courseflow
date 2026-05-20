"use client";

import { useParams } from "next/navigation";
import { courses } from "@/lib/data";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import * as motion from "motion/react-client";

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-zinc-900 dark:text-zinc-100">
        Курс не найден.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-8 hover:text-indigo-600 transition">
          <ArrowLeft size={20} /> К списку курсов
        </Link>
        <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">{course.title}</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{course.description}</p>
        </div>
        
        <motion.div 
          className="space-y-3"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {course.lessons.map((lesson) => (
            <motion.div
              key={lesson.id}
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.95 },
                show: { 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: { type: "spring", stiffness: 200, damping: 20 }
                },
              }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400">
                {lesson.id}
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{lesson.title}</h3>
                <p className="text-xs text-zinc-500 truncate max-w-[200px] sm:max-w-none">{lesson.description}</p>
              </div>
              <Link href={`/course/${course.id}/lesson/${lesson.id}`} className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                Открыть
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}
