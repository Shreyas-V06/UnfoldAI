import React, { useState } from 'react';
import { MCQContent } from '../../../api/types';
import { SpeechSpeakerButton } from '../../common/SpeechSpeakerButton';
import { CheckCircle2, ArrowRight, Loader2, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface MCQExerciseProps {
  content: MCQContent;
  isSubmitting: boolean;
  onSubmit: (submissionData: Record<string, any>) => void;
  previousResult?: any;
}

export const MCQExercise: React.FC<MCQExerciseProps> = ({
  content,
  isSubmitting,
  onSubmit,
  previousResult,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    previousResult?.submission?.student_answer_index ?? null
  );
  const [showHint, setShowHint] = useState(false);

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex === null) return;
    onSubmit({
      student_answer_index: selectedIndex,
      selected_option_text: content.options[selectedIndex],
    });
  };

  return (
    <div className="space-y-6">
      {/* Question Banner */}
      <div className="p-5 md:p-6 bg-brand-50/70 dark:bg-brand-950/40 rounded-3xl border border-brand-200/80 dark:border-brand-800/60 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-bold text-brand-600 dark:text-brand-400">
              Multiple Choice Question
            </span>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
              {content.question}
            </h3>
          </div>
          <SpeechSpeakerButton
            text={content.question}
            size="lg"
            variant="filled"
            className="shrink-0"
          />
        </div>
      </div>

      {/* Options Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {content.options.map((option, idx) => {
          const isSelected = selectedIndex === idx;
          const letter = optionLetters[idx] || String(idx + 1);

          return (
            <div
              key={idx}
              onClick={() => !isSubmitting && setSelectedIndex(idx)}
              className={clsx(
                'group relative flex items-center justify-between p-4 md:p-5 rounded-2xl border-2 transition-all cursor-pointer select-none text-left',
                isSelected
                  ? 'bg-brand-100/70 dark:bg-brand-900/60 border-brand-600 dark:border-brand-500 shadow-md ring-2 ring-brand-500/30'
                  : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-3.5 flex-1 pr-2">
                <span
                  className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm md:text-base shrink-0 transition-colors shadow-sm',
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 group-hover:bg-brand-50 group-hover:text-brand-600'
                  )}
                >
                  {letter}
                </span>
                <span
                  className={clsx(
                    'text-base md:text-lg font-semibold transition-colors',
                    isSelected
                      ? 'text-brand-950 dark:text-white font-bold'
                      : 'text-slate-800 dark:text-slate-200'
                  )}
                >
                  {option}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <SpeechSpeakerButton
                  text={option}
                  size="sm"
                  variant="ghost"
                  className="opacity-70 group-hover:opacity-100"
                />
                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hint / Explanation Accordion */}
      {content.explanation && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showHint ? 'Hide Hint' : 'Need a hint?'}</span>
          </button>
          {showHint && (
            <div className="mt-2 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs md:text-sm text-amber-900 dark:text-amber-300 animate-fadeIn">
              💡 {content.explanation}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedIndex === null || isSubmitting}
          className="flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-brand-300 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI is Checking...</span>
            </>
          ) : (
            <>
              <span>Check My Answer</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
