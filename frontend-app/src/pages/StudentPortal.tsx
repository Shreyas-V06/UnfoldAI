import React, { useState } from 'react';
import { StudentDashboard } from '../components/student/StudentDashboard';
import { LessonList } from '../components/student/LessonList';
import { LessonPlayer } from '../components/student/LessonPlayer';
import { ReportsView } from '../components/student/ReportsView';
import { StudentSelector } from '../components/student/StudentSelector';
import { AccessibilityToolbar } from '../components/common/AccessibilityToolbar';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  SlidersHorizontal,
} from 'lucide-react';
import { clsx } from 'clsx';

interface StudentPortalProps {
  onBackToGateway: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ onBackToGateway }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lessons' | 'reports'>('dashboard');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const handleSelectLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Portal Top Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand & Gateway Link */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToGateway}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Return to Portal Selection"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                U
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white leading-none">
                  Unfold
                </span>
                <span className="text-[11px] font-bold text-brand-600 block leading-none">
                  Student Space
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs (when not inside active lesson) */}
          {!activeLessonId && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  activeTab === 'dashboard'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lessons')}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  activeTab === 'lessons'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lessons Library</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={clsx(
                  'flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                  activeTab === 'reports'
                    ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>AI Reports</span>
              </button>
            </nav>
          )}

          {/* Right Action Tools: Student Selector & Dyslexia Accessibility Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <StudentSelector />
            <AccessibilityToolbar />
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        {!activeLessonId && (
          <div className="md:hidden flex items-center justify-around border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={clsx(
                'flex items-center gap-1 text-xs font-bold py-1 px-3 rounded-lg',
                activeTab === 'dashboard' ? 'text-brand-600 bg-brand-50' : 'text-slate-500'
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lessons')}
              className={clsx(
                'flex items-center gap-1 text-xs font-bold py-1 px-3 rounded-lg',
                activeTab === 'lessons' ? 'text-brand-600 bg-brand-50' : 'text-slate-500'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lessons</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={clsx(
                'flex items-center gap-1 text-xs font-bold py-1 px-3 rounded-lg',
                activeTab === 'reports' ? 'text-brand-600 bg-brand-50' : 'text-slate-500'
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>
          </div>
        )}
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeLessonId ? (
          <LessonPlayer
            lessonId={activeLessonId}
            onBack={() => setActiveLessonId(null)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <StudentDashboard
                onSelectLesson={handleSelectLesson}
                onNavigateToLessons={() => setActiveTab('lessons')}
                onNavigateToReports={() => setActiveTab('reports')}
              />
            )}
            {activeTab === 'lessons' && (
              <LessonList onSelectLesson={handleSelectLesson} />
            )}
            {activeTab === 'reports' && <ReportsView />}
          </>
        )}
      </main>
    </div>
  );
};
