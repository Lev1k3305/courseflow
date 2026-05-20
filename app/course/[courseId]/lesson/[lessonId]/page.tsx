"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { courses } from "@/lib/data";
import { ArrowLeft, CheckCircle2, XCircle, Check } from "lucide-react";
import Link from "next/link";
import { saveProgress, getProgress } from "@/lib/firebase";

export default function LessonPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const lessonId = parseInt(params.lessonId as string);
  
  const course = courses.find((c) => c.id === courseId);
  const lesson = course?.lessons.find((l) => l.id === lessonId);
  const nextLesson = course?.lessons.find((l) => l.id === lessonId + 1);

  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answerText, setAnswerText] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    async function checkProgress() {
      if (await getProgress(courseId, lessonId)) {
        setCompleted(true);
      }
    }
    checkProgress();
  }, [courseId, lessonId]);

  const handleComplete = async () => {
    await saveProgress(courseId, lessonId);
    setCompleted(true);
  };

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-zinc-900 dark:text-zinc-100">
        Урок не найден.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-12 pb-32 md:pb-16 transition-colors">
      <div className="max-w-2xl mx-auto">
        <Link href={`/course/${courseId}`} className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 mb-8 hover:text-indigo-600 transition vk-active">
          <ArrowLeft size={20} /> Назад к курсу
        </Link>
        
        <h1 className="text-3xl font-extrabold mb-8 text-zinc-900 dark:text-zinc-100">{lesson.title}</h1>
        
        <div className="space-y-6 mb-12">
          {lesson.sections?.map((section, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2 text-zinc-900 dark:text-zinc-100">{section.title}</h3>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        {lesson.quiz && lesson.quiz.length > 0 && (
          <div className="mb-12">
            <h3 className="font-bold text-xl mb-6 text-zinc-900 dark:text-zinc-100">Мини-викторина</h3>
            {lesson.quiz.map((q, idx) => {
              const selectedIdx = selectedAnswers[idx];
              const isAnswered = selectedIdx !== undefined;

              return (
                <div key={idx} className="space-y-4 mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">{q.question}</p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => {
                      let btnStyle = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700";
                      let icon = null;

                      if (isAnswered) {
                        if (optIdx === q.correctAnswer) {
                          btnStyle = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-semibold";
                          icon = <Check size={16} className="text-emerald-500 inline-block mr-2 shrink-0" />;
                        } else if (selectedIdx === optIdx) {
                          btnStyle = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 font-semibold";
                          icon = <XCircle size={16} className="text-rose-500 inline-block mr-2 shrink-0" />;
                        } else {
                          btnStyle = "border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/10 text-zinc-400 dark:text-zinc-600 opacity-60";
                        }
                      }

                      return (
                        <button 
                          key={optIdx}
                          disabled={isAnswered}
                          onClick={() => setSelectedAnswers({...selectedAnswers, [idx]: optIdx})}
                          className={`w-full p-4 rounded-xl border text-left transition flex items-center justify-between vk-active ${btnStyle}`}
                        >
                          <span className="flex items-center">
                            {icon}
                            {opt}
                          </span>
                          {isAnswered && optIdx === q.correctAnswer && (
                            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">Правильно</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {completed ? (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-200/80 dark:border-emerald-900/50 p-8 rounded-3xl text-center shadow-xl shadow-emerald-500/5 transition-all duration-500 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Отличный результат!</h3>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-md mx-auto mb-6 text-sm">
              Урок успешно завершен и добавлен в твою еженедельную статистику. Продолжай в том же духе!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/course/${courseId}`} className="px-6 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-bold transition vk-active">
                К списку уроков
              </Link>
              {nextLesson ? (
                <Link href={`/course/${courseId}/lesson/${lessonId + 1}`} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition vk-active flex items-center justify-center gap-1 shadow-lg shadow-indigo-500/10">
                  Следующий урок: {nextLesson.title} →
                </Link>
              ) : (
                <Link href="/" className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition vk-active flex items-center justify-center gap-1 shadow-lg shadow-indigo-500/10">
                  Все курсы
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/50 p-6 rounded-3xl shadow-sm">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center gap-2">💡 Практическое задание:</h3>
            <p className="text-indigo-800 dark:text-indigo-200 mb-5 leading-relaxed text-sm">{lesson.task}</p>
            <textarea 
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              className="w-full p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-sm" 
              rows={4} 
              placeholder="Напишите ваш ответ здесь..." 
            />
            <button 
              onClick={handleComplete}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-bold transition vk-active shadow-lg shadow-indigo-500/10"
            >
              Завершить урок
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
