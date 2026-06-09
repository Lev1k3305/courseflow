"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { courses } from "@/lib/data";
import { ArrowLeft, CheckCircle2, XCircle, Check, BookOpen, Lightbulb, Trophy, ChevronRight, MessageSquare, Target, PenLine, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { saveProgress, getProgress, saveNote, getNote } from "@/lib/firebase";
import * as motion from "motion/react-client";

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = parseInt(params.lessonId as string);
  
  const course = courses.find((c) => c.id === courseId);
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  const nextLesson = course?.lessons.find((l) => l.id === lessonId + 1);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answerText, setAnswerText] = useState("");
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function checkProgress() {
      if (await getProgress(courseId, lessonId)) {
        setCompleted(true);
      }
    }
    async function loadNote() {
      const savedNote = await getNote(courseId, lessonId);
      setNoteText(savedNote);
    }
    checkProgress();
    loadNote();
  }, [courseId, lessonId]);

  // Debounced auto-save for notes
  useEffect(() => {
    if (!mounted) return;

    const timeoutId = setTimeout(async () => {
      if (noteText.trim()) {
        setIsSavingNote(true);
        try {
          // lessonId is already parsed as number at the top of the component
          await saveNote(courseId, lessonId, noteText);
        } finally {
          setIsSavingNote(false);
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [noteText, courseId, lessonId, mounted]);

  if (!mounted) return null;

  const handleComplete = async () => {
    await saveProgress(courseId, lessonId);
    setCompleted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950">
        <h2 className="text-xl font-bold mb-4">Урок не найден</h2>
        <Link href={`/course/${courseId}`} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">
          Вернуться к курсу
        </Link>
      </div>
    );
  }

  const allQuizzesAnswered = lesson.quiz
    ? Object.keys(selectedAnswers).length === lesson.quiz.length
    : true;

  const progressPercent = Math.round((lessonId / (course?.lessons.length || 1)) * 100);

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-zinc-200 dark:bg-zinc-800 z-[60]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]"
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 md:py-16 pb-32">
        <Link href={`/course/${courseId}`} className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-8 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs font-bold vk-active uppercase tracking-widest">
          <ArrowLeft size={16} /> Назад к программе
        </Link>

        {completed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex flex-col md:flex-row items-center gap-6 shadow-xl shadow-emerald-500/5"
          >
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
              <Trophy size={32} />
            </div>
            <div className="flex-grow text-center md:text-left">
               <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 mb-1">Урок пройден!</h3>
               <p className="text-sm text-emerald-800/70 dark:text-emerald-400/60 font-medium">Ты отлично справляешься. Твой прогресс сохранен в профиле.</p>
            </div>
            <div className="flex gap-2 shrink-0">
               {nextLesson ? (
                 <Link href={`/course/${courseId}/lesson/${lessonId + 1}`} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition vk-active shadow-lg shadow-indigo-500/20">
                   Далее
                 </Link>
               ) : (
                 <Link href="/" className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition vk-active shadow-lg shadow-indigo-500/20">
                   Все курсы
                 </Link>
               )}
            </div>
          </motion.div>
        )}
        
        <header className="mb-12">
           <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
                {lesson.id}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Урок курса {course?.title}</span>
           </div>
           <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight">{lesson.title}</h1>
        </header>
        
        <div className="prose prose-zinc dark:prose-invert max-w-none mb-12">
          <div className="space-y-10">
            {lesson.sections?.map((section, idx) => (
              <motion.section
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1.5 hidden sm:flex shrink-0 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 items-center justify-center text-zinc-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition-colors">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black mb-4 text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{section.title}</h3>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg whitespace-pre-line">{section.content}</p>
                  </div>
                </div>
              </motion.section>
            ))}
          </div>
        </div>

        {/* Notes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <PenLine className="text-indigo-500" size={24} />
              <h3 className="font-black text-2xl text-zinc-900 dark:text-white">Конспект</h3>
            </div>
            {isSavingNote && (
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                <Loader2 size={14} className="animate-spin" /> Сохранение...
              </div>
            )}
            {!isSavingNote && noteText && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                <Save size={14} /> Сохранено
              </div>
            )}
          </div>

          <div className="glass-card p-1 rounded-[2rem] overflow-hidden">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Записывай здесь важные мысли из урока..."
              className="w-full p-8 bg-transparent focus:outline-none min-h-[200px] text-lg leading-relaxed resize-none"
            />
          </div>
        </motion.div>

        {lesson.quiz && lesson.quiz.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
               <Target className="text-rose-500" size={24} />
               <h3 className="font-black text-2xl text-zinc-900 dark:text-white">Проверь себя</h3>
            </div>

            <div className="grid gap-6">
              {lesson.quiz.map((q, idx) => {
                const selectedIdx = selectedAnswers[idx];
                const isAnswered = selectedIdx !== undefined;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="glass-card p-6 md:p-8 rounded-3xl"
                  >
                    <p className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-6">{q.question}</p>
                    <div className="grid gap-3">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10";
                        let icon = null;

                        if (isAnswered) {
                          if (optIdx === q.correctAnswer) {
                            btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-400 shadow-lg shadow-emerald-500/10";
                            icon = <CheckCircle2 size={18} className="text-emerald-500" />;
                          } else if (selectedIdx === optIdx) {
                            btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-400 shadow-lg shadow-rose-500/10";
                            icon = <XCircle size={18} className="text-rose-500" />;
                          } else {
                            btnStyle = "opacity-40 border-zinc-100 dark:border-zinc-900 text-zinc-400 cursor-not-allowed";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() => setSelectedAnswers({...selectedAnswers, [idx]: optIdx})}
                            className={`w-full p-5 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between vk-active group ${btnStyle}`}
                          >
                            <span className="font-bold text-sm">{opt}</span>
                            {icon}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
        {!completed && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-900 dark:bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
          >
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
                  <Lightbulb size={24} />
                </div>
                <h3 className="font-black text-2xl text-white dark:text-zinc-900">Финальное задание</h3>
              </div>

              <p className="text-zinc-300 dark:text-zinc-600 mb-8 leading-relaxed text-lg font-medium">
                {lesson.task}
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
                   <MessageSquare size={14} /> Твой ответ
                </div>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  className="w-full p-6 rounded-3xl border-2 border-zinc-800 dark:border-zinc-100 bg-zinc-800 dark:bg-zinc-50 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-600 dark:placeholder:text-zinc-400 text-white dark:text-zinc-900 min-h-[160px] text-lg font-medium"
                  placeholder="Опиши свое решение здесь..."
                />

                <button
                  onClick={handleComplete}
                  disabled={!allQuizzesAnswered || answerText.trim().length < 5}
                  className={`mt-6 w-full flex items-center justify-center gap-3 px-8 py-5 rounded-3xl font-black text-lg transition-all duration-300 vk-active shadow-xl ${
                    allQuizzesAnswered && answerText.trim().length >= 5
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                      : "bg-zinc-800 dark:bg-zinc-200 text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-50 shadow-none"
                  }`}
                >
                  Завершить урок <ChevronRight size={20} />
                </button>

                {(!allQuizzesAnswered || answerText.trim().length < 5) && (
                   <p className="text-center text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-tighter mt-4 animate-pulse">
                     {!allQuizzesAnswered ? "Сначала ответь на все вопросы викторины" : "Напиши более развернутый ответ на задание"}
                   </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
