import React, { useState } from 'react';
import { EmotionalContent } from '../../../api/types';
import { SpeechSpeakerButton } from '../../common/SpeechSpeakerButton';
import { Heart, ArrowRight, Loader2, Sparkles, MessageCircleHeart } from 'lucide-react';
import { clsx } from 'clsx';

interface EmotionalExerciseProps {
  content: EmotionalContent;
  isSubmitting: boolean;
  onSubmit: (submissionData: Record<string, any>) => void;
  previousResult?: any;
}

export const EmotionalExercise: React.FC<EmotionalExerciseProps> = ({
  content,
  isSubmitting,
  onSubmit,
  previousResult,
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string>(
    previousResult?.submission?.selected_emotion || ''
  );
  const [response, setResponse] = useState<string>(
    previousResult?.submission?.student_response || ''
  );

  const emotionTags = [
    { label: 'Confident', emoji: '🌟' },
    { label: 'Calm', emoji: '🧘' },
    { label: 'Curious', emoji: '💡' },
    { label: 'Anxious', emoji: '😟' },
    { label: 'Frustrated', emoji: '😤' },
    { label: 'Proud', emoji: '😊' },
    { label: 'Overwhelmed', emoji: '🌀' },
    { label: 'Determined', emoji: '🚀' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim() && !selectedEmotion) return;

    const fullResponse = selectedEmotion
      ? `Feeling ${selectedEmotion}: ${response.trim()}`
      : response.trim();

    onSubmit({
      student_response: fullResponse,
      selected_emotion: selectedEmotion,
      raw_notes: response.trim(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Scenario Banner */}
      <div className="p-5 md:p-6 bg-purple-50/70 dark:bg-purple-950/40 rounded-3xl border border-purple-200/80 dark:border-purple-800/60 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" />
              <span>Emotional & Social Awareness</span>
            </span>
            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
              {content.scenario_description}
            </h3>
          </div>
          <SpeechSpeakerButton
            text={content.scenario_description}
            size="lg"
            variant="filled"
            className="shrink-0 bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200"
          />
        </div>

        {/* Emotion Context */}
        {content.emotion_context && (
          <div className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-purple-200/70 dark:border-purple-800 text-xs md:text-sm text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <MessageCircleHeart className="w-4 h-4 text-purple-600 shrink-0" />
            <span><strong>Emotional Context:</strong> {content.emotion_context}</span>
          </div>
        )}
      </div>

      {/* Emotion Feelings Picker */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>How does this scenario make you feel? (Pick an emotion)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {emotionTags.map((emo) => {
            const isSelected = selectedEmotion === emo.label;
            return (
              <button
                key={emo.label}
                type="button"
                onClick={() => setSelectedEmotion(isSelected ? '' : emo.label)}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold border transition-all cursor-pointer select-none',
                  isSelected
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-400 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-slate-750'
                )}
              >
                <span>{emo.emoji}</span>
                <span>{emo.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guiding Questions */}
      {content.guiding_questions && content.guiding_questions.length > 0 && (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Guiding Questions to Think About:
          </span>
          <ul className="list-disc list-inside text-xs md:text-sm text-slate-700 dark:text-slate-300 space-y-1">
            {content.guiding_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Reflective Response Area */}
      <div className="space-y-2">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Your Thoughts & Reaction
        </label>
        <textarea
          rows={3}
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Share your thoughts on what you would do or how you would handle this feeling..."
          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm md:text-base focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={(!response.trim() && !selectedEmotion) || isSubmitting}
          className="flex items-center gap-2 px-6 py-3.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-purple-300 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Reflecting with AI...</span>
            </>
          ) : (
            <>
              <span>Share Reflection</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
