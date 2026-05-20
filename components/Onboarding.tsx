"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, BrainCircuit, BookOpen, X, Trophy, Sparkles, ChevronRight, Check } from "lucide-react";

export function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeen) {
      setShow(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    setShow(false);
  };

  const nextStep = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  if (!show) return null;

  const slides = [
    {
      title: "Осваивай ИИ и код",
      description: "Изучай современные LLM, Gemini API, ООП на Python и Java, а также кроссплатформенную разработку на Flutter по четким структурированным урокам.",
      icon: <BrainCircuit size={48} className="text-indigo-500" />,
      colorClass: "from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/5 dark:to-violet-500/5",
      iconBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    },
    {
      title: "Интерактивная практика",
      description: "Проходи увлекательные мини-викторины и выполняй практические задания. Получай моментальный наглядный фидбек при выборе правильных вариантов.",
      icon: <BookOpen size={48} className="text-emerald-500" />,
      colorClass: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/5 dark:to-teal-500/5",
      iconBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    },
    {
      title: "Синхронизация с VK",
      description: "Твой прогресс автоматически синхронизируется с твоим профилем ВКонтакте. Анализируй свои еженедельные результаты на красивых интерактивных графиках.",
      icon: <Trophy size={48} className="text-amber-500" />,
      colorClass: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-500/5",
      iconBg: "bg-amber-500/10 dark:bg-amber-500/20",
    },
  ];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.92, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 15, opacity: 0 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden flex flex-col min-h-[480px]"
          >
            {/* Background Decorative Blob */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl bg-gradient-to-br ${slides[step].colorClass} opacity-60 pointer-events-none transition-all duration-500`} />
            <div className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl bg-gradient-to-tr ${slides[step].colorClass} opacity-40 pointer-events-none transition-all duration-500`} />

            {/* Skip Button */}
            {step < slides.length - 1 && (
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-xs font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 vk-active z-10"
              >
                Пропустить
              </button>
            )}

            {/* Content Area with Slide Animation */}
            <div className="p-8 flex-grow flex flex-col justify-between relative z-10 mt-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ x: 30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -30, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="flex flex-col items-center text-center flex-grow justify-center my-auto"
                >
                  {/* Animated Icon Circle */}
                  <motion.div
                    initial={{ scale: 0.8, rotate: -5 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                    className={`w-24 h-24 rounded-3xl ${slides[step].iconBg} flex items-center justify-center mb-6 shadow-inner relative`}
                  >
                    <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" />
                    {slides[step].icon}
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -inset-1 rounded-3xl border-2 border-current opacity-10 pointer-events-none"
                      style={{ color: "var(--tw-text-opacity)" }}
                    />
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white mb-3">
                    {slides[step].title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-sm">
                    {slides[step].description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Footer */}
              <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                {/* Step Indicators */}
                <div className="flex gap-1.5">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === step
                          ? "w-6 bg-indigo-600 dark:bg-indigo-500"
                          : "w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Next/Get Started Button */}
                <div className="flex gap-2">
                  {step > 0 && (
                    <button
                      onClick={prevStep}
                      className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 vk-active transition"
                    >
                      Назад
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition vk-active flex items-center gap-1 shadow-lg shadow-indigo-500/10"
                  >
                    {step === slides.length - 1 ? (
                      <>
                        Начать <Check size={14} />
                      </>
                    ) : (
                      <>
                        Далее <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
