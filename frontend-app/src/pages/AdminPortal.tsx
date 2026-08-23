import React, { useState } from 'react';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { LessonManager } from '../components/admin/LessonManager';
import { ExerciseManager } from '../components/admin/ExerciseManager';
import { CourseCurator } from '../components/admin/CourseCurator';
import { StudentDiagnostics } from '../components/admin/StudentDiagnostics';
import { AccessibilityToolbar } from '../components/common/AccessibilityToolbar';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  Video,
  Activity,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

interface AdminPortalProps {
  onBackToGateway: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToGateway }) => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'lessons' | 'exercises' | 'courses' | 'diagnostics'
  >('dashboard');
  const [selectedLessonForExercises, setSelectedLessonForExercises] = useState<string | undefined>(
    undefined
  );

  const handleManageExercisesForLesson = (lessonId: string) => {
    setSelectedLessonForExercises(lessonId);
    setActiveTab('exercises');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Navigation Header */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand & Gateway Back Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToGateway}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Return to Portal Selection"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                ⚡
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white leading-none">
                  Unfold
                </span>
                <span className="text-[11px] font-bold text-indigo-400 block leading-none">
                  Admin & Educator Studio
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('lessons')}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeTab === 'lessons'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lessons</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('exercises')}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeTab === 'exercises'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Exercises</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('courses')}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeTab === 'courses'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Video className="w-3.5 h-3.5" />
              <span>AI Video Curator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                activeTab === 'diagnostics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Learner Diagnostics</span>
            </button>
          </nav>

          {/* Right Tools */}
          <div className="flex items-center gap-2">
            <AccessibilityToolbar />
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        <div className="lg:hidden flex items-center justify-around border-t border-slate-800 bg-slate-900/90 py-2 px-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={clsx(
              'text-xs font-bold py-1 px-2.5 rounded-lg whitespace-nowrap',
              activeTab === 'dashboard' ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'
            )}
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('lessons')}
            className={clsx(
              'text-xs font-bold py-1 px-2.5 rounded-lg whitespace-nowrap',
              activeTab === 'lessons' ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'
            )}
          >
            Lessons
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('exercises')}
            className={clsx(
              'text-xs font-bold py-1 px-2.5 rounded-lg whitespace-nowrap',
              activeTab === 'exercises' ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'
            )}
          >
            Exercises
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={clsx(
              'text-xs font-bold py-1 px-2.5 rounded-lg whitespace-nowrap',
              activeTab === 'courses' ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'
            )}
          >
            Video Curator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={clsx(
              'text-xs font-bold py-1 px-2.5 rounded-lg whitespace-nowrap',
              activeTab === 'diagnostics' ? 'text-indigo-400 bg-slate-800' : 'text-slate-400'
            )}
          >
            Diagnostics
          </button>
        </div>
      </header>

      {/* Main Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            onNavigate={(tab) => {
              setActiveTab(tab);
            }}
          />
        )}
        {activeTab === 'lessons' && (
          <LessonManager onManageExercises={handleManageExercisesForLesson} />
        )}
        {activeTab === 'exercises' && (
          <ExerciseManager initialLessonId={selectedLessonForExercises} />
        )}
        {activeTab === 'courses' && <CourseCurator />}
        {activeTab === 'diagnostics' && <StudentDiagnostics />}
      </main>
    </div>
  );
};
