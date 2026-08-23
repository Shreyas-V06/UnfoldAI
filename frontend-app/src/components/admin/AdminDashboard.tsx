import React, { useState, useEffect } from 'react';
import { lessonsApi, studentsApi } from '../../api/client';
import { Lesson, Student } from '../../api/types';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  Video,
  Activity,
  Layers,
  ArrowRight,
  Plus,
  TrendingUp,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (tab: 'lessons' | 'exercises' | 'courses' | 'diagnostics') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [lData, sData] = await Promise.all([
          lessonsApi.list(0, 100).catch(() => []),
          studentsApi.list(0, 100).catch(() => []),
        ]);
        setLessons(lData);
        setStudents(sData);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalLessons = lessons.length;
  const totalStudents = students.length;
  const activeLessons = lessons.filter((l) => l.is_active).length;

  return (
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* Header Banner */}
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-xl space-y-4 border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span>Educator & Clinician Studio</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
          Unfold Platform Management
        </h1>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
          Author multi-sensory lessons and exercises, discover educational video courses with AI, and oversee cognitive diagnostic memories across dyslexic learners.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Lessons
            </span>
            <div className="p-2 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">
            {totalLessons}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {activeLessons} Active in Curriculum
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Registered Learners
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">
            {totalStudents}
          </span>
          <span className="text-[11px] text-indigo-600 font-semibold">
            Personalized AI Memories Active
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Exercise Types
            </span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">4</span>
          <span className="text-[11px] text-purple-600 font-semibold">
            MCQ • Audio • Emotion • Situation
          </span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              AI Multi-Agents
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white block">
            Online
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold">
            LangGraph + Whisper + Groq LLM
          </span>
        </div>
      </div>

      {/* Studio Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Lesson Studio Card */}
        <div
          onClick={() => onNavigate('lessons')}
          className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 rounded-2xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
              Lesson Curriculum Studio
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Create, update, or remove subjects and lesson modules. Set difficulty tiers and ordering.
            </p>
          </div>
        </div>

        {/* Exercise Builder Card */}
        <div
          onClick={() => onNavigate('exercises')}
          className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <Layers className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
              Multimodal Exercise Authoring
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Design phonics MCQs, acoustic reading & pronunciation exercises, emotional empathy scenarios, and situational decision problems.
            </p>
          </div>
        </div>

        {/* AI YouTube Video Curator */}
        <div
          onClick={() => onNavigate('courses')}
          className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl">
              <Video className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
              AI Video Course Curator
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Search any educational topic to find curated YouTube videos tailored for visual dyslexic learners.
            </p>
          </div>
        </div>

        {/* Learner Diagnostics Overseer */}
        <div
          onClick={() => onNavigate('diagnostics')}
          className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-2xl">
              <Activity className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
              Student Diagnostics & Memory Overseer
            </h3>
            <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
              Inspect AI memory states, emotional profiles, speech issues, and clinical reports across learners.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
