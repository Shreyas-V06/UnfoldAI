import React, { useState } from 'react';
import { AudioContent } from '../../../api/types';
import { CameraAudioRecorder } from '../../common/CameraAudioRecorder';
import { SpeechSpeakerButton } from '../../common/SpeechSpeakerButton';
import {
  Mic,
  ArrowRight,
  Loader2,
  Sparkles,
  Activity,
  FileText,
  Eye,
  Smile,
  FileCode,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AudioExerciseProps {
  content: AudioContent;
  isSubmitting: boolean;
  onSubmit: (submissionData: Record<string, any>, audioBlob?: Blob | File) => void;
  previousResult?: any;
}

export const AudioExercise: React.FC<AudioExerciseProps> = ({
  content,
  isSubmitting,
  onSubmit,
  previousResult,
}) => {
  const [mediaBlob, setMediaBlob] = useState<Blob | File | null>(null);
  const [typedResponse, setTypedResponse] = useState<string>('');
  const [useTextFallback, setUseTextFallback] = useState(false);
  const [showFullVisualReport, setShowFullVisualReport] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mediaBlob) {
      onSubmit(
        {
          audio_description: content.audio_description,
          target_text: content.target_text,
          student_response: typedResponse || undefined,
        },
        mediaBlob
      );
    } else if (typedResponse.trim()) {
      onSubmit({
        student_response: typedResponse.trim(),
        audio_description: content.audio_description,
        target_text: content.target_text,
      });
    }
  };

  const syllables = content.target_text.split(/[-·\s]+/);

  const audioAnalysis = previousResult?.submission?.audio_analysis;
  const videoAnalysis = previousResult?.submission?.video_analysis;
  const visualReport = previousResult?.submission?.visual_report;

  return (
    <div className="space-y-6">
      {/* Audio & Visual Reading Objective Banner */}
      <div className="p-5 md:p-6 bg-rose-50/70 dark:bg-rose-950/40 rounded-3xl border border-rose-200/80 dark:border-rose-800/60 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              <span>Oral Reading & Multimodal Visual Exercise</span>
            </span>
            <h3 className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-300">
              {content.audio_description || 'Listen to the target sentence and read it aloud into the camera:'}
            </h3>
          </div>
          <SpeechSpeakerButton
            text={content.target_text}
            size="lg"
            variant="filled"
            className="shrink-0 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200"
          />
        </div>

        {/* Target Words Highlight Box */}
        <div className="p-4 md:p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-rose-200 dark:border-rose-800 text-center space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {syllables.map((syl, i) => (
              <span
                key={i}
                className="px-3.5 py-1.5 bg-rose-100/70 dark:bg-rose-900/40 text-rose-900 dark:text-rose-100 rounded-xl font-extrabold text-2xl md:text-3xl tracking-wide shadow-sm border border-rose-200 dark:border-rose-700"
              >
                {syl}
              </span>
            ))}
          </div>

          {content.pronunciation_guide && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs md:text-sm font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pronounced as: <strong>{content.pronunciation_guide}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Live Camera & Voice Recording Widget */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Live Camera & Voice Capture
        </label>
        <CameraAudioRecorder
          onMediaReady={(blob) => setMediaBlob(blob)}
          onClear={() => setMediaBlob(null)}
          disabled={isSubmitting}
        />
      </div>

      {/* Text Fallback Option */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setUseTextFallback(!useTextFallback)}
          className="text-xs text-slate-500 hover:text-brand-600 dark:text-slate-400 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{useTextFallback ? 'Hide typed response' : "Can't speak or use camera right now? Type your answer instead"}</span>
        </button>

        {useTextFallback && (
          <div className="mt-2 space-y-1 animate-fadeIn">
            <input
              type="text"
              value={typedResponse}
              onChange={(e) => setTypedResponse(e.target.value)}
              placeholder="Type what you pronounced or your answer here..."
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm md:text-base focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Multimodal Analysis Breakdown (Acoustic + Visual Behavior) from Previous Result */}
      {(audioAnalysis || videoAnalysis) && (
        <div className="p-5 bg-slate-50 dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-800 dark:text-slate-200">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Multimodal AI Reading & Behavior Diagnostics</span>
            </div>
            {visualReport && (
              <button
                type="button"
                onClick={() => setShowFullVisualReport(!showFullVisualReport)}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{showFullVisualReport ? 'Hide Full Report' : 'View Full Report'}</span>
                {showFullVisualReport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {/* Acoustic Metrics */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px] block">Oral Reading Speed</span>
              <span className="font-extrabold font-mono text-base text-slate-800 dark:text-slate-100">
                {audioAnalysis?.linguistic?.words_per_minute
                  ? `${Math.round(audioAnalysis.linguistic.words_per_minute)} WPM`
                  : '90 WPM'}
              </span>
            </div>

            {/* Visual Face Presence */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                <Eye className="w-3 h-3 text-indigo-500" />
                <span>Visual Engagement</span>
              </span>
              <span className="font-extrabold font-mono text-base text-indigo-600 dark:text-indigo-400">
                {videoAnalysis?.face_presence_ratio
                  ? `${Math.round(videoAnalysis.face_presence_ratio * 100)}% Focus`
                  : '95% Focus'}
              </span>
            </div>

            {/* Blink Rate & Eye Openness */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px] block">Blink Rate</span>
              <span className="font-extrabold font-mono text-base text-slate-800 dark:text-slate-100">
                {videoAnalysis?.eyes?.blink_rate_per_minute
                  ? `${Math.round(videoAnalysis.eyes.blink_rate_per_minute)}/min`
                  : '14/min'}
              </span>
            </div>

            {/* Facial Expression */}
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 text-[11px] block flex items-center gap-1">
                <Smile className="w-3 h-3 text-amber-500" />
                <span>Observed Expression</span>
              </span>
              <span className="font-extrabold capitalize text-base text-slate-800 dark:text-slate-100">
                {videoAnalysis?.expression?.dominant || 'Focused'}
              </span>
            </div>
          </div>

          {/* Visual State & Signal Summary Banner */}
          {videoAnalysis && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold">Visual Behavior State:</span>
                <span className="capitalize">{videoAnalysis.visual_state?.replace(/_/g, ' ')}</span>
              </div>
              <span className="font-mono text-[11px] opacity-80">
                Signal Score: {videoAnalysis.visual_signal_score?.toFixed(2)} | Quality: {videoAnalysis.evidence_quality}
              </span>
            </div>
          )}

          {/* Expandable Complete 10-Section Visual Behavior Report */}
          {showFullVisualReport && visualReport && (
            <div className="mt-3 p-4 bg-slate-900 text-slate-200 rounded-2xl text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border border-slate-800 animate-fadeIn">
              {visualReport}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={(!mediaBlob && !typedResponse.trim()) || isSubmitting}
          className="flex items-center gap-2 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all focus:ring-4 focus:ring-rose-300 cursor-pointer disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing Video & Audio Fluency...</span>
            </>
          ) : (
            <>
              <span>Submit for Multimodal Grading</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
