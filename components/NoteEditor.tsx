"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { PenLine, Save, Loader2, CheckCircle2 } from "lucide-react";
import { getNote, saveNote } from "@/lib/firebase";
import * as motion from "motion/react-client";

interface NoteEditorProps {
  courseId: string;
  lessonId: number;
}

export const NoteEditor = memo(({ courseId, lessonId }: NoteEditorProps) => {
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadNote = async () => {
      const savedNote = await getNote(courseId, lessonId);
      if (savedNote) {
        setNoteText(savedNote);
      }
    };
    loadNote();
  }, [courseId, lessonId]);

  // Debounced save
  useEffect(() => {
    if (!mounted) return;

    const timeoutId = setTimeout(async () => {
      if (saveStatus === "saving") {
        try {
          await saveNote(courseId, lessonId, noteText);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch (error) {
          console.error("Failed to save note:", error);
          setSaveStatus("idle");
        }
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [noteText, courseId, lessonId, saveStatus, mounted]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteText(e.target.value);
    setSaveStatus("saving");
  };

  if (!mounted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-16 p-8 md:p-10 rounded-[3rem] bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 shadow-xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <PenLine size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PenLine size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-white">Твой конспект</h3>
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Записывай важные мысли урока</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: saveStatus !== "idle" ? 1 : 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700"
            >
              {saveStatus === "saving" && (
                <>
                  <Loader2 size={14} className="animate-spin text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Сохранение...</span>
                </>
              )}
              {saveStatus === "saved" && (
                <>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Сохранено</span>
                </>
              )}
            </motion.div>
          </div>
        </div>

        <div className="relative group">
          <textarea
            value={noteText}
            onChange={handleChange}
            placeholder="Начни конспектировать здесь..."
            className="w-full min-h-[200px] p-6 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-lg font-medium text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
          />

          <div className="absolute bottom-4 right-6 flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-tighter opacity-0 group-focus-within:opacity-100 transition-opacity">
            <Save size={12} /> Автосохранение включено
          </div>
        </div>
      </div>
    </motion.div>
  );
});

NoteEditor.displayName = "NoteEditor";
