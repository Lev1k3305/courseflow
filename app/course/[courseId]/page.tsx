"use client";

import { useParams } from "next/navigation";
import { coursesMap, type Lesson } from "@/lib/data";
import { ArrowLeft, PlayCircle, Lock, CheckCircle2, Clock, BookOpen, GraduationCap } from "lucide-react";
import Link from "next/link";
import * as motion from "motion/react-client";
import { useEffect, useState, useMemo, memo } from "react";
import { getCompletedLessonsForCourse } from "@/lib/firebase";

interface LessonItemProps {
  lesson: Lesson;
  courseId: string;
  isCompleted: boolean;
  isNextToComplete: boolean;
}

/**
 * Performance: Isolated and memoized lesson list item.
 * Prevents full curriculum re-renders when progress updates.
 */
const LessonItem = memo(({ lesson, courseId, isCompleted, isNextToComplete }: LessonItemProps) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, x: -10 },
      show: { opacity: 1, x: 0 }
    }}
    className="relative z-10"
  >
    <Link
      href={`/course/${courseId}/lesson/${lesson.id}`}
      className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 vk-active ${
        isCompleted
          ? "bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30"
          : isNextToComplete
            ? "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5"
            : "bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800/30 opacity-70"
      }`}
    >
      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center font-black text-sm transition-colors shadow-sm ${
        isCompleted
          ? "bg-emerald-500 text-white"
          : isNextToComplete
            ? "bg-indigo-600 text-white"
            : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600"
      }`}>
        {isCompleted ? <CheckCircle2 size={24} /> : lesson.id}
      </div>

      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`font-bold text-base transition-colors ${
            isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
          }`}>
            {lesson.title}
          </h3>
          {!isNextToComplete && !isCompleted && <Lock size={12} className="text-zinc-400" />}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
          {lesson.description}
        </p>

        <div className="mt-3 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
            <BookOpen size={12} /> {lesson.sections?.length || 0} разделов
          </span>
          {lesson.quiz && (
             <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
               <PlayCircle size={12} /> Викторина
             </span>
          )}
        </div>
      </div>

      <div className="shrink-0 self-center">
        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
           isCompleted
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            : isNextToComplete
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
        }`}>
          {isCompleted ? "Готово" : "Начать"}
        </div>
      </div>
    </Link>
  </motion.div>
));

LessonItem.displayName = "LessonItem";

export default function CourseDetailsPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const course = coursesMap[courseId];
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  useEffect(() => {
    async function fetchProgress() {
      if (!course) return;
      const completed = await getCompletedLessonsForCourse(courseId);
      setCompletedLessons(completed);
    }
    fetchProgress();
  }, [courseId, course]);

  /**
   * Performance: Using a Set for O(1) lookups during rendering.
   */
  const completedSet = useMemo(() => new Set(completedLessons), [completedLessons]);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-zinc-900 dark:text-zinc-100">
        Курс не найден.
      </div>
    );
  }

  const progressPercent = Math.round((completedSet.size / course.lessons.length) * 100);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {/* Header section with course info */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          <Link href="/" className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-8 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-bold vk-active">
            <ArrowLeft size={18} /> К списку курсов
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-wider">
                  {course.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                  <Clock size={12} /> 2-4 часа обучения
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black mb-4 text-zinc-900 dark:text-white leading-tight">{course.title}</h1>
              <h2 className="sr-only">Описание курса</h2>
              <p className="text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed text-sm">{course.description}</p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">Ваш прогресс</p>
                  <p className="text-2xl font-black text-zinc-900 dark:text-white">{progressPercent}%</p>
               </div>
               <div className="w-32 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-indigo-600 rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                  />
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum / Roadmap */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 mb-8">
           <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={24} />
           <h2 className="text-xl font-black text-zinc-900 dark:text-white">Программа обучения</h2>
        </div>
        
        <motion.div 
          className="space-y-4 relative"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {/* Vertical path line */}
          <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-zinc-200 dark:bg-zinc-800 z-0 hidden sm:block" />

          {course.lessons.map((lesson, idx) => {
            const isCompleted = completedSet.has(lesson.id);
            const isNextToComplete = idx === 0 || completedSet.has(course.lessons[idx-1]?.id);

            return (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                courseId={course.id}
                isCompleted={isCompleted}
                isNextToComplete={isNextToComplete}
              />
            );
          })}
        </motion.div>
      </div>
    </main>
  );
}
