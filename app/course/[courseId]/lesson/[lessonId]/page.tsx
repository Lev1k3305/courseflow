"use client";

import { useEffect, useState, memo, useCallback } from "react";
import { useParams } from "next/navigation";
import { coursesMap, lessonsMap } from "@/lib/data";
import { ArrowLeft, CheckCircle2, XCircle, Check, BookOpen, Lightbulb, Trophy, ChevronRight, MessageSquare, Target, PenLine, Sparkles, NotebookPen } from "lucide-react";
import Link from "next/link";
import { saveProgress, getProgress, saveNote, getNote } from "@/lib/firebase";
import * as motion from "motion/react-client";

const NoteEditor = memo(({ courseId, lessonId }: { courseId: string, lessonId: number }) => {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    async function loadNote() {
      const savedNote = await getNote(courseId, lessonId);
      setNote(savedNote);
    }
    loadNote();
  }, [courseId, lessonId]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveNote(courseId, lessonId, note);
    setIsSaving(false);
    setLastSaved(new Date());
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="mb-16 p-8 md:p-10 rounded-[3rem] bg-white dark:bg-zinc-900 border-2 border-indigo-100 dark:border-indigo-900/30 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-indigo-500">
        <PenLine size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
              <NotebookPen size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Твой конспект</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Записывай важные мысли</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"
              >
                <Check size={12} /> Сохранено
              </motion.span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all vk-active flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Сохранение...
                </>
              ) : "Сохранить"}
            </button>
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100 min-h-[200px] text-lg font-medium leading-relaxed"
          placeholder="Начни писать свой конспект здесь..."
        />
      </div>
    </motion.div>
  );
});

NoteEditor.displayName = "NoteEditor";

/**
 * Isolated Final Task section to prevent full-page re-renders when typing the answer.
 */
const FinalTaskSection = memo(({ lesson, allQuizzesAnswered, handleComplete }: { lesson: any, allQuizzesAnswered: boolean, handleComplete: () => Promise<void> }) => {
  const [answerText, setAnswerText] = useState("");

  return (
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
  );
});

FinalTaskSection.displayName = "FinalTaskSection";

const LessonHeader = memo(({ lesson, courseTitle }: { lesson: any, courseTitle?: string }) => {
  return (
    <header className="mb-12 text-center flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shadow-sm">
          {lesson.id}
        </span>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Урок курса {courseTitle}</span>
      </div>
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white leading-tight mb-6 text-balance">{lesson.title}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-xl font-medium mx-auto text-balance">{lesson.description}</p>
      </div>
    </header>
  );
});

LessonHeader.displayName = "LessonHeader";

const KeyTakeaways = memo(({ lesson }: { lesson: any }) => {
  if (!lesson.keyTakeaways) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-12 p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Lightbulb size={20} />
        </div>
        <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 m-0">Главное из урока</h3>
      </div>

      <ul className="space-y-4 m-0 p-0 list-none relative z-10">
        {lesson.keyTakeaways.map((takeaway: string, i: number) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-4 text-indigo-800/80 dark:text-indigo-300/80 font-bold text-lg"
          >
            <CheckCircle2 className="mt-1 shrink-0 text-indigo-500" size={20} />
            <span>{takeaway}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
});

KeyTakeaways.displayName = "KeyTakeaways";

const ExpertExplanation = memo(({ expertNote }: { expertNote?: string }) => {
  if (!expertNote) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-12 p-10 rounded-[2.5rem] bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/30 relative overflow-hidden group shadow-xl shadow-amber-500/5"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24" />

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Sparkles size={24} />
        </div>
        <h3 className="text-2xl font-black text-amber-900 dark:text-amber-400 m-0">Инсайт от эксперта</h3>
      </div>

      <p className="text-amber-800/80 dark:text-amber-300/80 font-bold text-xl leading-relaxed relative z-10 m-0 italic text-balance">
        «{expertNote}»
      </p>
    </motion.div>
  );
});

ExpertExplanation.displayName = "ExpertExplanation";

const LessonSections = memo(({ sections }: { sections?: any[] }) => {
  return (
    <div className="space-y-16">
      {sections?.map((section, idx) => (
        <motion.section
          key={idx}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: idx * 0.1 }}
          className="group relative"
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
                <BookOpen size={24} />
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{section.title}</h3>
            </div>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-xl font-medium whitespace-pre-line pl-0 md:pl-16">{section.content}</p>
          </div>
        </motion.section>
      ))}
    </div>
  );
});

LessonSections.displayName = "LessonSections";

export default function LessonPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = parseInt(params.lessonId as string);

  const course = coursesMap[courseId];
  const lesson = lessonsMap[`${courseId}_${lessonId}`];
  const nextLesson = lessonsMap[`${courseId}_${lessonId + 1}`];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function checkProgress() {
      if (await getProgress(courseId, lessonId)) {
        setCompleted(true);
      }
    }
    checkProgress();
  }, [courseId, lessonId]);

  const handleComplete = useCallback(async () => {
    await saveProgress(courseId, lessonId);
    setCompleted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [courseId, lessonId]);

  if (!mounted) return null;

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
      <div className="fixed top-0 left-0 right-0 h-2 bg-zinc-200 dark:bg-zinc-800 z-[60]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
        <Link href={`/course/${courseId}`} className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mb-12 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-xs font-black vk-active uppercase tracking-[0.2em] bg-white dark:bg-zinc-900 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <ArrowLeft size={16} /> Программа курса
        </Link>

        {completed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 p-8 rounded-[3rem] bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-200 dark:border-emerald-900/30 flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-emerald-500/5"
          >
            <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 rotate-3">
              <Trophy size={40} />
            </div>
            <div className="flex-grow text-center md:text-left">
               <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-400 mb-2">Урок пройден!</h3>
               <p className="text-lg text-emerald-800/70 dark:text-emerald-400/60 font-bold">Ты отлично справляешься. Твой прогресс сохранен.</p>
            </div>
            <div className="flex gap-3 shrink-0">
               {nextLesson ? (
                 <Link href={`/course/${courseId}/lesson/${lessonId + 1}`} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition vk-active shadow-lg shadow-indigo-500/20">
                   Далее
                 </Link>
               ) : (
                 <Link href="/" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition vk-active shadow-lg shadow-indigo-500/20">
                   Все курсы
                 </Link>
               )}
            </div>
          </motion.div>
        )}
        
        <LessonHeader lesson={lesson} courseTitle={course?.title} />
        
        <div className="mb-20">
          <KeyTakeaways lesson={lesson} />
          <div className="max-w-3xl mx-auto">
            <LessonSections sections={lesson.sections} />
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <ExpertExplanation expertNote={lesson.expertNote} />
        </div>

        <NoteEditor courseId={courseId} lessonId={lessonId} />

        {lesson.quiz && lesson.quiz.length > 0 && (
          <div className="mb-20 max-w-3xl mx-auto">
            <div className="flex flex-col items-center gap-3 mb-12 text-center">
               <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
                 <Target size={32} />
               </div>
               <h3 className="font-black text-3xl text-zinc-900 dark:text-white">Проверь себя</h3>
               <p className="text-zinc-500 font-bold">Ответь на вопросы, чтобы закрепить материал</p>
            </div>

            <div className="grid gap-8">
              {lesson.quiz.map((q, idx) => {
                const selectedIdx = selectedAnswers[idx];
                const isAnswered = selectedIdx !== undefined;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="glass-card p-8 md:p-10 rounded-[3rem] shadow-xl border-zinc-200/50 dark:border-zinc-800/50"
                  >
                    <p className="font-black text-xl text-zinc-900 dark:text-zinc-100 mb-8 leading-tight">{q.question}</p>
                    <div className="grid gap-4">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = "border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-zinc-800";
                        let icon = null;

                        if (isAnswered) {
                          if (optIdx === q.correctAnswer) {
                            btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-400 shadow-lg shadow-emerald-500/10";
                            icon = <CheckCircle2 size={24} className="text-emerald-500" />;
                          } else if (selectedIdx === optIdx) {
                            btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-400 shadow-lg shadow-rose-500/10";
                            icon = <XCircle size={24} className="text-rose-500" />;
                          } else {
                            btnStyle = "opacity-40 border-zinc-50 dark:border-zinc-900 text-zinc-400 cursor-not-allowed";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={isAnswered}
                            onClick={() => setSelectedAnswers({...selectedAnswers, [idx]: optIdx})}
                            className={`w-full p-6 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between vk-active group font-bold text-lg ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {icon}
                          </button>
                        );
                      })}
                    </div>

                    {isAnswered && q.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-8 p-8 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500" />
                        <div className="flex items-start gap-4">
                          <MessageSquare size={20} className="text-indigo-500 mt-1 shrink-0" />
                          <p className="text-lg font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                            {q.explanation}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
        
        {!completed && (
          <div className="max-w-3xl mx-auto">
            <FinalTaskSection
              lesson={lesson}
              allQuizzesAnswered={allQuizzesAnswered}
              handleComplete={handleComplete}
            />
          </div>
        )}
      </div>
    </main>
  );
}
