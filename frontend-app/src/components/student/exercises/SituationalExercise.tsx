import React, { useState } from 'react';
import { SituationalContent } from '../../../api/types';
import { SpeechSpeakerButton } from '../../common/SpeechSpeakerButton';
import { Badge } from '../../common/Badge';
import { Compass, ArrowRight, Loader2, Lightbulb, CheckSquare } from 'lucide-react';

interface SituationalExerciseProps {
  content: SituationalContent;
  isSubmitting: boolean;
  onSubmit: (submissionData: Record<string, any>) => void;
  previousResult?: any;
}

export const SituationalExercise: React.FC<SituationalExerciseProps> = ({
  content,
  isSubmitting,
  onSubmit,
  previousResult,
}) => {
  const [response, setResponse] = useState<string>(
    previousResult?.submission?.student_response || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) return;
    onSubmit({
      student_response: response.trim(),
      expected_skills: content.expected_skills,
    });
  };

  return (
    <div className="space-y-6">
      {/* Situation Banner */}
      <div className="p-5 md:p-6 bg-emerald-50/70 dark:bg-emerald-950/40 rounded-3xl border border-emerald-200/80 dark:border-emerald-800/60 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Real-Life Situational Challenge</span>
            </span>
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {content.situation}
            </h3>
          </div>
          <SpeechSpeakerButton
            text={content.situation}
            size="lg"
            variant="filled"
            className="shrink-0 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200"
          />
        </div>

        {/* Context description */}
        {content.context && (
          <div className="p-3.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-200/70 dark:border-emerald-800 text-xs md:text-sm text-emerald-950 dark:text-emerald-200">
            <strong>Context:</strong> {content.context}
          </div>
        )}

        {/* Expected Skills Badges */}
        {content.expected_skills && content.expected_skills.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Focus Skills:
            </span>
            {content.expected_skills.map((skill, i) => (
              <Badge key={i} variant="secondary" size="sm">
                <CheckSquare className="w-3 h-3" />
                <span>{skill}</span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty Hint */}
      {content.difficulty_hint && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-xs md:text-sm text-amber-900 dark:text-amber-300 flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span><strong>Helpful Clue:</strong> {content.difficulty_hint}</span>
        </div>
      )}

      {/* Student Solution Area */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          What would you do or say in this situation?
        </label>
        <textarea
          rows={4}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Explain your approach, steps you would take, or how you would solve this problem..."
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm md:text-base focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!response.trim() || isSubmitting}
          className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-emerald-300 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Decision...</span>
            </>
          ) : (
            <>
              <span>Submit My Solution</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
