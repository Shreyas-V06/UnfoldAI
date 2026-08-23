import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LessonDetail, Exercise, SubmitExerciseResponse, ExerciseResult } from '../../api/types';
import { lessonsApi, exercisesApi } from '../../api/client';
import { useStudent } from '../../context/StudentContext';
import { Badge } from '../common/Badge';
import { SpeechSpeakerButton } from '../common/SpeechSpeakerButton';
import { MCQExercise } from './exercises/MCQExercise';
import { AudioExercise } from './exercises/AudioExercise';
import { EmotionalExercise } from './exercises/EmotionalExercise';
import { SituationalExercise } from './exercises/SituationalExercise';
import { FeedbackModal } from './FeedbackModal';
import { LessonChatbot } from './LessonChatbot';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  Trophy,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LessonPlayerProps {
  lessonId: string;
  onBack: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({ lessonId, onBack }) => {
  const { currentStudent, refreshCurrentStudentData } = useStudent();
  const studentId = currentStudent?._id;

  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [results, setResults] = useState<Record<string, ExerciseResult>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestFeedback, setLatestFeedback] = useState<SubmitExerciseResponse | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const isInitialLoadRef = useRef(true);

  const loadLessonData = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setLoading(true);
      }
      setError(null);
      const lessonData = await lessonsApi.getDetail(lessonId);
      setLesson(lessonData);

      if (studentId) {
        try {
          const pastResults = await exercisesApi.getResultsForLesson(studentId, lessonId);
          const map: Record<string, ExerciseResult> = {};
          pastResults.forEach((res) => {
            map[res.exercise_id] = res;
          });
          setResults(map);
        } catch {
          // Ignored
        }
      }
    } catch (err: any) {
      console.error('Failed to load lesson:', err);
      setError(err?.message || 'Failed to load lesson');
    } finally {
      setLoading(false);
      isInitialLoadRef.current = false;
    }
  }, [lessonId, studentId]);

  useEffect(() => {
    isInitialLoadRef.current = true;
    loadLessonData();
  }, [loadLessonData]);

  const handleExerciseSubmit = async (
    submissionData: Record<string, any>,
    audioBlob?: Blob | File
  ) => {
    if (!studentId || !currentExercise) return;
    try {
      setIsSubmitting(true);
      let response: SubmitExerciseResponse;

      if (audioBlob) {
        response = await exercisesApi.submitAudio(
          currentExercise._id,
          studentId,
          audioBlob
        );
      } else {
        response = await exercisesApi.submit(
          currentExercise._id,
          studentId,
          submissionData
        );
      }

      // Update local results map
      setResults((prev) => ({
        ...prev,
        [currentExercise._id]: response.exercise_result,
      }));

      // Refresh student's cognitive memory and lesson plan
      refreshCurrentStudentData();

      // Show feedback modal
      setLatestFeedback(response);
      setIsFeedbackOpen(true);
    } catch (err: any) {
      console.error('Submission failed:', err);
      alert(`Submission error: ${err?.message || 'Failed to grade exercise'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextExercise = () => {
    setIsFeedbackOpen(false);
    if (lesson && currentIndex < lesson.exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Lesson completed
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });
    }
  };

  if (loading && !lesson) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
        <p className="text-sm font-medium text-slate-500">Preparing interactive lesson...</p>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lesson Not Found</h3>
        <p className="text-sm text-slate-500">{error || 'Could not load lesson details.'}</p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl shadow cursor-pointer"
        >
          Return to Lessons
        </button>
      </div>
    );
  }

  const exercises = lesson.exercises || [];
  const currentExercise: Exercise | undefined = exercises[currentIndex];
  const completedCount = exercises.filter((ex) => results[ex._id]).length;
  const progressPercent = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;
  const isLessonFinished = exercises.length > 0 && completedCount === exercises.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Lessons</span>
        </button>

        <div className="flex items-center gap-3">
          <Badge variant="primary" size="md">
            <span>{lesson.subject}</span>
          </Badge>
          <Badge
            variant={
              lesson.difficulty_level === 'BEGINNER'
                ? 'success'
                : lesson.difficulty_level === 'INTERMEDIATE'
                ? 'warning'
                : 'danger'
            }
            size="md"
          >
            <span>{lesson.difficulty_level}</span>
          </Badge>

          {/* AI Doubt Clearing Chatbot Toggle */}
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs md:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI Tutor</span>
          </button>
        </div>
      </div>

      {/* Lesson Title & Overview Card */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
              {lesson.title}
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
              {lesson.description}
            </p>
          </div>
          <SpeechSpeakerButton
            text={`${lesson.title}. ${lesson.description}`}
            size="lg"
            variant="filled"
          />
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>
              Lesson Progress: {completedCount} / {exercises.length} Completed
            </span>
            <span className="font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Exercise Step Tabs */}
        {exercises.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 no-scrollbar">
            {exercises.map((ex, idx) => {
              const isDone = Boolean(results[ex._id]);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={ex._id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border',
                    isCurrent
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm scale-105'
                      : isDone
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <span>#{idx + 1}</span>
                  )}
                  <span className="capitalize">{ex.type}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Interactive Exercise Container */}
      {exercises.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            No Exercises in This Lesson Yet
          </h3>
          <p className="text-xs md:text-sm text-slate-500">
            Educators can add MCQ, Audio, Emotional, and Situational exercises via the Admin Studio!
          </p>
        </div>
      ) : currentExercise ? (
        <div className="p-6 md:p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          {/* Exercise Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 rounded-full font-bold text-xs">
                Exercise {currentIndex + 1} of {exercises.length}
              </span>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                {currentExercise.title}
              </h2>
            </div>

            {results[currentExercise._id] && (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                <span>Score: {Math.round(results[currentExercise._id].score)}%</span>
              </Badge>
            )}
          </div>

          {/* Exercise Type Component Switcher */}
          {currentExercise.type === 'mcq' && (
            <MCQExercise
              content={currentExercise.content as any}
              isSubmitting={isSubmitting}
              onSubmit={handleExerciseSubmit}
              previousResult={results[currentExercise._id]}
            />
          )}

          {currentExercise.type === 'audio' && (
            <AudioExercise
              content={currentExercise.content as any}
              isSubmitting={isSubmitting}
              onSubmit={handleExerciseSubmit}
              previousResult={results[currentExercise._id]}
            />
          )}

          {currentExercise.type === 'emotional' && (
            <EmotionalExercise
              content={currentExercise.content as any}
              isSubmitting={isSubmitting}
              onSubmit={handleExerciseSubmit}
              previousResult={results[currentExercise._id]}
            />
          )}

          {currentExercise.type === 'situational' && (
            <SituationalExercise
              content={currentExercise.content as any}
              isSubmitting={isSubmitting}
              onSubmit={handleExerciseSubmit}
              previousResult={results[currentExercise._id]}
            />
          )}

          {/* Exercise Navigation Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400 font-medium">
              {currentIndex + 1} / {exercises.length}
            </span>

            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => Math.min(exercises.length - 1, prev + 1))}
              disabled={currentIndex === exercises.length - 1}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Lesson Complete Celebration Box */}
      {isLessonFinished && (
        <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-purple-500/10 rounded-3xl border-2 border-emerald-300 dark:border-emerald-800 text-center space-y-3 animate-fadeIn">
          <Trophy className="w-12 h-12 text-amber-500 mx-auto animate-bounce-soft" />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            🎉 Congratulations! You have completed all exercises in this lesson!
          </h3>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
            Your progress has been analyzed by the AI memory agent. You can view your updated AI Lesson Plan and generate a Progress Report on your dashboard!
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Explore Next Lessons
          </button>
        </div>
      )}

      {/* Instant AI Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        resultData={latestFeedback}
        onNext={handleNextExercise}
        hasNext={currentIndex < exercises.length - 1}
      />

      {/* Lesson Chatbot */}
      <LessonChatbot
        lessonId={lessonId}
        lessonTitle={lesson.title}
        currentExercise={currentExercise}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
};
