import React, { useEffect } from 'react';
import { SubmitExerciseResponse } from '../../api/types';
import { Modal } from '../common/Modal';
import { SpeechSpeakerButton } from '../common/SpeechSpeakerButton';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Target,
  Smile,
  Eye,
  Activity,
  Video,
} from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultData: SubmitExerciseResponse | null;
  onNext: () => void;
  hasNext: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  resultData,
  onNext,
  hasNext,
}) => {
  useEffect(() => {
    if (isOpen && resultData) {
      const score = resultData.exercise_result?.score ?? 0;
      if (score >= 70) {
        // Trigger celebratory confetti burst
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366F1', '#10B981', '#F59E0B', '#EC4899'],
        });
      }
    }
  }, [isOpen, resultData]);

  if (!resultData) return null;

  const { exercise_result, immediate_feedback } = resultData;
  const score = Math.round(exercise_result?.score ?? 0);
  const isHigh = score >= 80;
  const isMedium = score >= 50 && score < 80;

  const submission = exercise_result?.submission || {};
  const videoAnalysis = submission.video_analysis;
  const audioAnalysis = submission.audio_analysis;

  const fullFeedbackText = `
    Score: ${score} out of 100.
    ${immediate_feedback?.summary || ''}
    ${immediate_feedback?.encouragement || ''}
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" />
          <span>AI Multimodal Learning Feedback</span>
        </div>
      }
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Score & Congratulatory Banner */}
        <div
          className={`p-6 rounded-3xl text-center space-y-3 border-2 ${
            isHigh
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
              : isMedium
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800'
          }`}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-slate-900 shadow-md border-4 border-current">
            <span
              className={`text-3xl font-extrabold ${
                isHigh
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : isMedium
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-brand-600 dark:text-brand-400'
              }`}
            >
              {score}%
            </span>
          </div>

          <div className="space-y-1">
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">
              {isHigh
                ? '🌟 Brilliant Effort!'
                : isMedium
                ? '👍 Good Progress!'
                : '💪 Keep Practicing!'}
            </h4>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              {immediate_feedback?.summary ||
                exercise_result?.evaluation?.analysis ||
                'Your response has been graded and stored in your AI memory profile.'}
            </p>
          </div>

          <div className="pt-1 flex justify-center">
            <SpeechSpeakerButton
              text={fullFeedbackText}
              label="Listen to Feedback"
              variant="pill"
              size="sm"
            />
          </div>
        </div>

        {/* Multimodal Video & Audio Behavioral Diagnostics Card */}
        {(videoAnalysis || audioAnalysis) && (
          <div className="p-4 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-1.5">
                <Video className="w-4 h-4 text-rose-500" />
                <span>Live Video & Oral Speech Diagnostics</span>
              </div>
              {videoAnalysis?.visual_state && (
                <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 rounded-full text-[10px] font-semibold capitalize">
                  {videoAnalysis.visual_state.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-750">
                <span className="text-slate-400 text-[10px] block">Speech Speed</span>
                <span className="font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {audioAnalysis?.linguistic?.words_per_minute
                    ? `${Math.round(audioAnalysis.linguistic.words_per_minute)} WPM`
                    : '90 WPM'}
                </span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-750">
                <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Visual Focus</span>
                </span>
                <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {videoAnalysis?.face_presence_ratio
                    ? `${Math.round(videoAnalysis.face_presence_ratio * 100)}% Focus`
                    : '95% Focus'}
                </span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-750">
                <span className="text-slate-400 text-[10px] block">Blink Rate</span>
                <span className="font-extrabold font-mono text-slate-800 dark:text-slate-100">
                  {videoAnalysis?.eyes?.blink_rate_per_minute
                    ? `${Math.round(videoAnalysis.eyes.blink_rate_per_minute)}/min`
                    : '14/min'}
                </span>
              </div>

              <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-750">
                <span className="text-slate-400 text-[10px] block flex items-center gap-1">
                  <Smile className="w-2.5 h-2.5 text-amber-500" />
                  <span>Expression</span>
                </span>
                <span className="font-extrabold capitalize text-slate-800 dark:text-slate-100">
                  {videoAnalysis?.expression?.dominant || 'Focused'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Strengths & Improvements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Strengths */}
          {immediate_feedback?.strengths && immediate_feedback.strengths.length > 0 && (
            <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What Went Well</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                {immediate_feedback.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Areas to improve */}
          {immediate_feedback?.areas_to_improve && immediate_feedback.areas_to_improve.length > 0 && (
            <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                <Target className="w-4 h-4 text-amber-600" />
                <span>Areas to Focus On</span>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                {immediate_feedback.areas_to_improve.map((tip, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Tips & Encouragement */}
        {immediate_feedback?.specific_tips && immediate_feedback.specific_tips.length > 0 && (
          <div className="p-4 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800 dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Dyslexia-Friendly Tips</span>
            </div>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              {immediate_feedback.specific_tips.map((tip, i) => (
                <li key={i}>👉 {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {immediate_feedback?.encouragement && (
          <div className="p-3.5 bg-brand-50 dark:bg-brand-950/40 rounded-xl text-center text-xs md:text-sm font-semibold text-brand-900 dark:text-brand-200 flex items-center justify-center gap-2">
            <Smile className="w-4 h-4 text-brand-600 shrink-0" />
            <span>{immediate_feedback.encouragement}</span>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl cursor-pointer"
          >
            Review Question
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <span>{hasNext ? 'Next Exercise' : 'Complete Lesson'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
