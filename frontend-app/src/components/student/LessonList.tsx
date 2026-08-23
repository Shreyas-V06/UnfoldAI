import React, { useState, useEffect } from 'react';
import { Lesson, DifficultyLevel } from '../../api/types';
import { lessonsApi } from '../../api/client';
import { Badge } from '../common/Badge';
import { SpeechSpeakerButton } from '../common/SpeechSpeakerButton';
import {
  BookOpen,
  Search,
  Filter,
  Play,
  Loader2,
  Sparkles,
  Award,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LessonListProps {
  onSelectLesson: (lessonId: string) => void;
}

export const LessonList: React.FC<LessonListProps> = ({ onSelectLesson }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true);
        const data = await lessonsApi.list(0, 100);
        setLessons(data);
      } catch (err) {
        console.error('Failed to load lessons:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLessons();
  }, []);

  const subjects = ['all', ...Array.from(new Set(lessons.map((l) => l.subject).filter(Boolean)))];

  const filteredLessons = lessons.filter((lesson) => {
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSubject = selectedSubject === 'all' || lesson.subject === selectedSubject;
    const matchesDifficulty =
      selectedDifficulty === 'all' || lesson.difficulty_level === selectedDifficulty;

    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Interactive Lessons Library</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Explore multimodal lessons with speech, audio, visual phonics, and emotional scenarios.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lessons & topics..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Subject & Difficulty Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Subject Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all cursor-pointer border',
                selectedSubject === sub
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-300'
              )}
            >
              {sub === 'all' ? 'All Subjects' : sub}
            </button>
          ))}
        </div>

        {/* Difficulty Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Difficulties</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
        </div>
      </div>

      {/* Lessons Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading lessons library...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No lessons match your search
          </h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search query or subject filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map((lesson) => {
            const diffVariant =
              lesson.difficulty_level === 'BEGINNER'
                ? 'success'
                : lesson.difficulty_level === 'INTERMEDIATE'
                ? 'warning'
                : 'danger';

            return (
              <div
                key={lesson._id}
                className="group relative p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {lesson.subject}
                      </Badge>
                      <Badge variant={diffVariant} size="sm">
                        {lesson.difficulty_level}
                      </Badge>
                    </div>

                    <SpeechSpeakerButton
                      text={`${lesson.title}. ${lesson.description}`}
                      size="sm"
                      variant="ghost"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {lesson.title}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {lesson.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-400 font-mono">
                    Order #{lesson.order}
                  </span>

                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson._id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow transition-all cursor-pointer group-hover:scale-105"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Lesson</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
