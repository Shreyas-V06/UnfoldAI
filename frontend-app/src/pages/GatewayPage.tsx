import React from 'react';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Brain,
  Mic,
  BookOpen,
  Volume2,
  Heart,
  Video,
  Activity,
  Layers,
} from 'lucide-react';
import { SpeechSpeakerButton } from '../components/common/SpeechSpeakerButton';

interface GatewayPageProps {
  onSelectPortal: (portal: 'student' | 'admin') => void;
}

export const GatewayPage: React.FC<GatewayPageProps> = ({ onSelectPortal }) => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-10 px-4 max-w-5xl mx-auto space-y-12 animate-fadeIn">
      {/* Brand Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-100 dark:bg-brand-950/80 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 rounded-full text-xs md:text-sm font-bold shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Next-Generation Dyslexia Learning Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Unfold Your Learning Potential.
        </h1>

        <p className="text-sm md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An adaptive, multi-sensory educational experience blending AI cognitive memory, real-time speech acoustic analysis, and dyslexia-friendly typography.
        </p>

        <div className="pt-1 flex justify-center">
          <SpeechSpeakerButton
            text="Welcome to Unfold. Please choose whether you want to enter the Student Portal or the Admin and Educator Studio."
            label="Listen to Welcome"
            variant="pill"
            size="sm"
          />
        </div>
      </div>

      {/* 2 Portal Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Student Portal Card */}
        <div
          onClick={() => onSelectPortal('student')}
          className="group relative p-8 bg-gradient-to-br from-white via-brand-50/30 to-brand-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-brand-950/40 rounded-3xl border-2 border-brand-200 dark:border-brand-800 hover:border-brand-500 dark:hover:border-brand-500 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 hover:-translate-y-1"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <GraduationCap className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Learner Experience
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                Student Portal
              </h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Personalized lessons, voice pronunciation grading, multiple-choice phonics drills, emotional scenario reflections, and interactive doubt-clearing AI tutor.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-brand-500" />
                <span>Speech & voice acoustic analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-brand-500" />
                <span>Adaptive AI lesson plans & cognitive memory</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-brand-500" />
                <span>Dyslexia typography & Text-to-Speech</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-brand-100 dark:border-brand-900/60 flex items-center justify-between">
            <span className="text-sm font-extrabold text-brand-600 dark:text-brand-400">
              Enter Student Space
            </span>
            <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center shadow group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Admin & Educator Studio Card */}
        <div
          onClick={() => onSelectPortal('admin')}
          className="group relative p-8 bg-gradient-to-br from-white via-indigo-50/30 to-indigo-100/20 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-6 hover:-translate-y-1"
        >
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Educator & Clinician Space
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                Admin Studio
              </h2>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Curriculum authoring, multi-type exercise design (MCQ, Audio, Emotional, Situational), AI YouTube course curation, and learner diagnostic monitoring.
              </p>
            </div>

            {/* Feature bullets */}
            <div className="space-y-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 pt-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Multimodal exercise authoring studio</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-500" />
                <span>AI YouTube video curriculum curator</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Comprehensive student diagnostic overseer</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              Enter Admin Studio
            </span>
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Feature Badges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full pt-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <BookOpen className="w-5 h-5 text-brand-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">OpenDyslexic Fonts</h4>
          <p className="text-[11px] text-slate-400">Weighted gravity glyphs</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <Mic className="w-5 h-5 text-rose-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Acoustic Speech AI</h4>
          <p className="text-[11px] text-slate-400">Speaker-centric analysis</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <Brain className="w-5 h-5 text-indigo-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Adaptive Memory</h4>
          <p className="text-[11px] text-slate-400">Continuous learner growth</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-1">
          <Heart className="w-5 h-5 text-purple-600 mx-auto" />
          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Emotional Support</h4>
          <p className="text-[11px] text-slate-400">Empathy & coping strategies</p>
        </div>
      </div>
    </div>
  );
};
