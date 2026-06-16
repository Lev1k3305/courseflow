"use client";

import { useEffect, useState, memo, forwardRef, useImperativeHandle, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesMap, lessonsMap } from "@/lib/data";
import { ArrowLeft, CheckCircle2, XCircle, Check, BookOpen, Lightbulb, Trophy, ChevronRight, MessageSquare, Target, PenLine, Save, Loader2, CopyPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { saveProgress, getProgress, saveNote, getNote } from "@/lib/firebase";
import * as motion from "motion/react-client";

/**
 * Isolated Notes Editor component to prevent full-page re-renders on every keystroke.
 * Uses forwardRef to allow the parent to append content (from "Copy to notes" buttons).
 */
const NotesEditor = memo(forwardRef(({ courseId, lessonId }: { courseId: string; lessonId: number }, ref) => {
  const [noteText, setNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    async function loadNote() {
      const savedNote = await getNote(courseId, lessonId);
      setNoteText(savedNote);
    }
    loadNote();
  }, [courseId, lessonId]);

  useImperativeHandle(ref, () => ({
    appendNote: (text: string) => {
      setNoteText(prev => prev ? `${prev}\n\n${text}` : text);
    }
  }));

  // Debounced auto-save for notes
  useEffect(() => {
    if (!mounted) return;

    const timeoutId = setTimeout(async () => {
      if (noteText.trim()) {
        setIsSavingNote(true);
        try {
          await saveNote(courseId, lessonId, noteText);
        } finally {
          setIsSavingNote(false);
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [noteText, courseId, lessonId, mounted]);

  return (
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

      <div className="relative group">
        <div className="absolute -left-3 top-8 bottom-8 w-6 flex flex-col justify-around z-20 pointer-events-none opacity-40">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-zinc-300 dark:bg-zinc-700 border-4 border-zinc-200 dark:border-zinc-800 shadow-inner" />
          ))}
        </div>

        <div className="glass-card p-1 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-500/5 relative">
          <div className="absolute top-0 left-0 w-12 h-full bg-indigo-50/50 dark:bg-indigo-950/10 border-r border-indigo-100/50 dark:border-indigo-900/20 pointer-events-none" />
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Записывай здесь важные мысли из урока..."
            className="w-full p-8 pl-16 bg-transparent focus:outline-none min-h-[300px] text-lg leading-relaxed resize-none font-medium text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 selection:bg-indigo-100 dark:selection:bg-indigo-900/30"
            style={{
              backgroundImage: 'linear-gradient(transparent, transparent 31px, #e5e7eb 31px, #e5e7eb 32px)',
              backgroundSize: '100% 32px',
              lineHeight: '32px'
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}));

NotesEditor.displayName = "NotesEditor";

/**
 * Isolated Final Task section to prevent full-page re-renders when typing the answer.
 */
const FinalTaskSection = memo(({ lesson, allQuizzesAnswered, handleComplete, onCopyToNotes }: { lesson: any, allQuizzesAnswered: boolean, handleComplete: () => Promise<void>, onCopyToNotes: (text: string) => void }) => {
  const [answerText, setAnswerText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyToNotes(`### Финальное задание к уроку "${lesson.title}":\n${lesson.task}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white">
              <Lightbulb size={24} />
            </div>
            <h3 className="font-black text-2xl text-white dark:text-zinc-900">Финальное задание</h3>
          </div>
          <button
            onClick={handleCopy}
            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all vk-active shadow-sm border ${
              copied
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-zinc-800 dark:bg-zinc-100 text-zinc-400 dark:text-zinc-500 border-zinc-700 dark:border-zinc-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-500"
            }`}
          >
            {copied ? <Check size={14} /> : <CopyPlus size={14} />}
            {copied ? "В конспекте" : "Задание в конспект"}
          </button>
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

const LessonHeader = memo(({ lesson, courseTitle, onCopyToNotes }: { lesson: any, courseTitle?: string, onCopyToNotes: (text: string) => void }) => {
  const [copied, setCopied] = useState(false);
  const [allCopied, setAllCopied] = useState(false);

  const handleCopy = () => {
    onCopyToNotes(`**${lesson.title}**\n${lesson.description}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    let fullTheory = `## ${lesson.title}\n${lesson.description}\n\n`;

    if (lesson.keyTakeaways && lesson.keyTakeaways.length > 0) {
      fullTheory += `### Главное из урока:\n` + lesson.keyTakeaways.map((t: string) => `• ${t}`).join('\n') + `\n\n`;
    }

    if (lesson.sections && lesson.sections.length > 0) {
      lesson.sections.forEach((s: any) => {
        fullTheory += `### ${s.title}\n${s.content}\n\n`;
      });
    }

    onCopyToNotes(fullTheory.trim());
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <header className="mb-12">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs">
          {lesson.id}
        </span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">Урок курса {courseTitle}</span>
      </div>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex-grow">
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-white leading-tight mb-4">{lesson.title}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg font-medium max-w-2xl">{lesson.description}</p>
        </div>
        <div className="shrink-0 flex flex-col gap-2">
          <button
            onClick={handleCopy}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all vk-active shadow-sm border w-full ${
              copied
                ? "bg-emerald-500 text-white border-emerald-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-indigo-600 hover:text-white"
            }`}
          >
            {copied ? <Check size={16} /> : <CopyPlus size={16} />}
            {copied ? "Добавлено" : "Описание"}
          </button>
          <button
            onClick={handleCopyAll}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] transition-all vk-active shadow-md border w-full ${
              allCopied
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700"
            }`}
          >
            {allCopied ? <Check size={14} /> : <Sparkles size={14} />}
            {allCopied ? "Весь контент добавлен" : "Весь урок в конспект"}
          </button>
        </div>
      </div>
    </header>
  );
});

LessonHeader.displayName = "LessonHeader";

const KeyTakeaways = memo(({ lesson, onCopyToNotes }: { lesson: any, onCopyToNotes: (text: string) => void }) => {
  const [copied, setCopied] = useState(false);

  const copyTakeaways = () => {
    if (!lesson?.keyTakeaways) return;
    const takeawaysText = `### Ключевые моменты из урока "${lesson.title}":\n` +
      lesson.keyTakeaways.map((t: string) => `• ${t}`).join('\n');
    onCopyToNotes(takeawaysText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!lesson.keyTakeaways) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="mb-12 p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Lightbulb size={20} />
          </div>
          <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 m-0">Главное из урока</h3>
        </div>
        <button
          onClick={copyTakeaways}
          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all vk-active shadow-sm border ${
            copied
              ? "bg-emerald-500 text-white border-emerald-400"
              : "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-600 hover:text-white"
          }`}
        >
          {copied ? "Добавлено" : "В конспект"}
        </button>
      </div>

      <ul className="space-y-3 m-0 p-0 list-none relative z-10">
        {lesson.keyTakeaways.map((takeaway: string, i: number) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3 text-indigo-800/80 dark:text-indigo-300/80 font-medium"
          >
            <Check className="mt-1 shrink-0 text-indigo-500" size={16} />
            <span>{takeaway}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
});

KeyTakeaways.displayName = "KeyTakeaways";

const LessonSections = memo(({ sections, onCopyToNotes }: { sections?: any[], onCopyToNotes: (text: string) => void }) => {
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});

  const handleCopy = (idx: number, title: string, content: string) => {
    onCopyToNotes(`**${title}**\n${content}`);
    setCopiedStates(prev => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [idx]: false }));
    }, 2000);
  };

  return (
    <div className="space-y-10">
      {sections?.map((section, idx) => (
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
            <div className="flex-grow">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{section.title}</h3>
                <button
                  onClick={() => handleCopy(idx, section.title, section.content)}
                  className={`p-2 rounded-lg transition-all vk-active shrink-0 ${
                    copiedStates[idx]
                      ? "bg-emerald-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600"
                  }`}
                  title="Добавить в конспект"
                >
                  {copiedStates[idx] ? <Check size={16} /> : <CopyPlus size={16} />}
                </button>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg whitespace-pre-line">{section.content}</p>
            </div>
          </div>
        </motion.section>
      ))}
    </div>
  );
});

LessonSections.displayName = "LessonSections";

export default function LessonPage() {
  const [copiedQuizStates, setCopiedQuizStates] = useState<Record<number, boolean>>({});

  const handleQuizCopy = (idx: number, question: string, explanation: string) => {
    copyToNotes(`Вопрос: ${question}\nПояснение: ${explanation}`);
    setCopiedQuizStates(prev => ({ ...prev, [idx]: true }));
    setTimeout(() => {
      setCopiedQuizStates(prev => ({ ...prev, [idx]: false }));
    }, 2000);
  };
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const lessonId = parseInt(params.lessonId as string);

  const course = coursesMap[courseId];
  const lesson = lessonsMap[`${courseId}_${lessonId}`];
  const nextLesson = lessonsMap[`${courseId}_${lessonId + 1}`];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showFAB, setShowFAB] = useState(false);

  const notesEditorRef = useRef<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowFAB(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const copyToNotes = useCallback((text: string) => {
    notesEditorRef.current?.appendNote(text);
  }, []);

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
        
        <LessonHeader lesson={lesson} courseTitle={course?.title} onCopyToNotes={copyToNotes} />
        
        <div className="prose prose-zinc dark:prose-invert max-w-none mb-12">
          <KeyTakeaways lesson={lesson} onCopyToNotes={copyToNotes} />
          <LessonSections sections={lesson.sections} onCopyToNotes={copyToNotes} />
        </div>

        <div id="notes-section">
          <NotesEditor ref={notesEditorRef} courseId={courseId} lessonId={lessonId} />
        </div>

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

                    {isAnswered && q.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-6 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                        <div className="flex items-start gap-3">
                          <MessageSquare size={16} className="text-indigo-500 mt-1 shrink-0" />
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic">
                              {q.explanation}
                            </p>
                            <button
                              onClick={() => handleQuizCopy(idx, q.question, q.explanation!)}
                              className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                copiedQuizStates[idx]
                                  ? "text-emerald-500"
                                  : "text-indigo-600 dark:text-indigo-400 hover:underline"
                              }`}
                            >
                              {copiedQuizStates[idx] ? <Check size={12} /> : <CopyPlus size={12} />}
                              {copiedQuizStates[idx] ? "Добавлено в конспект" : "Добавить в конспект"}
                            </button>
                          </div>
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
          <FinalTaskSection
            lesson={lesson}
            allQuizzesAnswered={allQuizzesAnswered}
            handleComplete={handleComplete}
            onCopyToNotes={copyToNotes}
          />
        )}
      </div>

      {/* Floating Action Button for quick access to Notes */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{
          opacity: showFAB ? 1 : 0,
          scale: showFAB ? 1 : 0.8,
          y: showFAB ? 0 : 20
        }}
        onClick={() => {
          const notesSection = document.getElementById('notes-section');
          notesSection?.scrollIntoView({ behavior: 'smooth' });
        }}
        className={`fixed bottom-24 right-6 z-[70] p-5 rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 vk-active md:bottom-8 ${!showFAB ? 'pointer-events-none' : ''}`}
      >
        <PenLine size={24} />
      </motion.button>
    </main>
  );
}
