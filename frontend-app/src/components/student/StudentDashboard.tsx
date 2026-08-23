import React from 'react';
import { useStudent } from '../../context/StudentContext';
import { Badge } from '../common/Badge';
import { SpeechSpeakerButton } from '../common/SpeechSpeakerButton';
import {
  Sparkles,
  BookOpen,
  Brain,
  Heart,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Mic,
  ArrowRight,
  FileText,
  Smile,
  ShieldAlert,
  Lightbulb,
} from 'lucide-react';
import { clsx } from 'clsx';

interface StudentDashboardProps {
  onSelectLesson: (lessonId: string) => void;
  onNavigateToLessons: () => void;
  onNavigateToReports: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onSelectLesson,
  onNavigateToLessons,
  onNavigateToReports,
}) => {
  const { currentStudent, memory, lessonPlan, loadingMemory } = useStudent();

  if (!currentStudent) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <Sparkles className="w-10 h-10 text-brand-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
          Welcome to Unfold!
        </h3>
        <p className="text-sm text-slate-500">
          Please select or register a learner profile above to begin.
        </p>
      </div>
    );
  }

  const completedCount = memory?.completed_lessons?.length || 0;
  const strengthsCount = memory?.strengths?.length || 0;
  const observationsCount = memory?.ai_observations?.length || 0;

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Welcoming Hero Banner */}
      <div className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white rounded-3xl shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Dyslexia-Optimized AI Learning Space</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Welcome back, {currentStudent.name}! 👋
            </h1>
            <p className="text-xs md:text-sm text-brand-100 max-w-xl leading-relaxed">
              Your personalized AI tutor is ready with multi-sensory exercises, voice feedback, and tailored reading phonics.
            </p>
          </div>

          {/* Quick Stats Pill Cards */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3.5 bg-white/10 backdrop-blur rounded-2xl border border-white/20 text-center min-w-[90px]">
              <span className="text-2xl font-extrabold block">{completedCount}</span>
              <span className="text-[11px] text-brand-100 font-medium">Completed</span>
            </div>
            <div className="p-3.5 bg-white/10 backdrop-blur rounded-2xl border border-white/20 text-center min-w-[90px]">
              <span className="text-2xl font-extrabold block text-amber-300">{strengthsCount}</span>
              <span className="text-[11px] text-brand-100 font-medium">Mastered</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. AI Adaptive Lesson Plan Card */}
      {lessonPlan && (
        <div className="p-6 md:p-7 bg-white dark:bg-slate-900 rounded-3xl border border-brand-200 dark:border-brand-900/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-brand-100 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Your AI Adaptive Lesson Plan
                </h3>
                <span className="text-xs text-slate-400">
                  Updated based on your recent exercise performance
                </span>
              </div>
            </div>

            <SpeechSpeakerButton
              text={`AI Lesson Plan. Rationale: ${lessonPlan.rationale}`}
              size="sm"
              variant="filled"
            />
          </div>

          {/* Rationale Quote */}
          {lessonPlan.rationale && (
            <div className="p-4 bg-brand-50/60 dark:bg-brand-950/40 rounded-2xl border border-brand-150 dark:border-brand-800 text-xs md:text-sm text-brand-950 dark:text-brand-200 italic leading-relaxed">
              "{lessonPlan.rationale}"
            </div>
          )}

          {/* Focus Areas Badges */}
          {lessonPlan.focus_areas && lessonPlan.focus_areas.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Priority Focus Areas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {lessonPlan.focus_areas.map((focus, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs md:text-sm text-slate-800 dark:text-slate-100">
                        {focus.area}
                      </span>
                      <Badge
                        variant={
                          focus.priority === 'high'
                            ? 'danger'
                            : focus.priority === 'medium'
                            ? 'warning'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {focus.priority}
                      </Badge>
                    </div>
                    {focus.suggested_exercises && focus.suggested_exercises.length > 0 && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        Tips: {focus.suggested_exercises.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-mono">
              Difficulty: <strong>{lessonPlan.difficulty_adjustment || 'maintain'}</strong>
            </span>
            <button
              type="button"
              onClick={onNavigateToLessons}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 dark:text-brand-400 cursor-pointer"
            >
              <span>View All Recommended Lessons</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Cognitive & Emotional Memory Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Strengths & Growth Areas */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              AI Mastered Strengths & Skills
            </h3>
          </div>

          {memory?.strengths && memory.strengths.length > 0 ? (
            <div className="space-y-2">
              {memory.strengths.slice(0, 4).map((str, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800 text-xs md:text-sm text-emerald-900 dark:text-emerald-200 flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{str}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-3 italic">
              Complete lessons to unlock your AI-identified learning strengths!
            </p>
          )}

          {/* Pronunciation & Misconceptions */}
          {((memory?.pronunciation_issues && memory.pronunciation_issues.length > 0) ||
            (memory?.misconceptions && memory.misconceptions.length > 0)) && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-500" />
                <span>Speech & Concept Growth Areas:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {memory.pronunciation_issues?.map((p, i) => (
                  <Badge key={i} variant="danger" size="sm">
                    <span>{p}</span>
                  </Badge>
                ))}
                {memory.misconceptions?.map((m, i) => (
                  <Badge key={i} variant="warning" size="sm">
                    <span>{m}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emotional Profile & Coping Strategies */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Emotional State & Mindset
            </h3>
          </div>

          <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/40 rounded-2xl border border-purple-200/80 dark:border-purple-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-purple-600" />
              <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
                Overall Sentiment:
              </span>
            </div>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-full uppercase">
              {memory?.emotional_profile?.overall_sentiment || 'Optimistic'}
            </span>
          </div>

          {/* Coping Strategies */}
          {memory?.emotional_profile?.coping_strategies &&
            memory.emotional_profile.coping_strategies.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Recommended Coping Strategies:
                </span>
                <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  {memory.emotional_profile.coping_strategies.map((strat, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-purple-500 font-bold">✨</span>
                      <span>{strat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* AI Clinical Observations count */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              AI Observations Logged: <strong>{observationsCount}</strong>
            </span>
            <button
              type="button"
              onClick={onNavigateToReports}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 dark:text-purple-400 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate AI Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Quick Bar */}
      <div className="flex flex-wrap items-center justify-between p-5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-600 text-white rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Ready to learn something new?
            </h4>
            <p className="text-xs text-slate-500">
              Jump into your next multi-sensory reading or science lesson.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToLessons}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs md:text-sm rounded-xl shadow transition-all cursor-pointer"
        >
          <span>Browse Lessons Library</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
