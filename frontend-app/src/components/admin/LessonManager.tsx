import React, { useState, useEffect } from 'react';
import { Lesson, LessonCreate, LessonUpdate, DifficultyLevel } from '../../api/types';
import { lessonsApi, adminApi } from '../../api/client';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { clsx } from 'clsx';

interface LessonManagerProps {
  onManageExercises?: (lessonId: string) => void;
}

export const LessonManager: React.FC<LessonManagerProps> = ({ onManageExercises }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [formData, setFormData] = useState<LessonCreate>({
    title: '',
    description: '',
    subject: 'Reading',
    difficulty_level: 'BEGINNER',
    order: 1,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const data = await lessonsApi.list(0, 100);
      setLessons(data);
    } catch (err: any) {
      console.error('Failed to load lessons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, []);

  const handleOpenCreate = () => {
    setEditingLesson(null);
    setFormData({
      title: '',
      description: '',
      subject: 'Reading',
      difficulty_level: 'BEGINNER',
      order: lessons.length + 1,
      is_active: true,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description,
      subject: lesson.subject,
      difficulty_level: lesson.difficulty_level,
      order: lesson.order,
      is_active: lesson.is_active,
    });
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide both title and description');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingLesson) {
        await adminApi.updateLesson(editingLesson._id, formData);
      } else {
        await adminApi.createLesson(formData);
      }

      await fetchLessons();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Lesson save failed:', err);
      setError(err?.message || 'Failed to save lesson');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!window.confirm('Are you sure you want to delete this lesson and its exercises?')) {
      return;
    }
    try {
      await adminApi.deleteLesson(lessonId);
      setLessons((prev) => prev.filter((l) => l._id !== lessonId));
    } catch (err: any) {
      console.error('Lesson delete failed:', err);
      alert(`Delete failed: ${err?.message || 'Error deleting lesson'}`);
    }
  };

  const filtered = lessons.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>Curriculum & Lessons Studio</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Create, organize, and publish lessons for dyslexic students.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs md:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Lesson</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter lessons by title or subject..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
        />
      </div>

      {/* Lessons Table / List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading lessons...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No lessons found
          </h3>
          <p className="text-xs text-slate-500">Click "New Lesson" to create your first module.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((lesson) => (
              <div
                key={lesson._id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{lesson.order}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {lesson.title}
                    </h3>
                    <Badge variant="primary" size="sm">
                      {lesson.subject}
                    </Badge>
                    <Badge
                      variant={
                        lesson.difficulty_level === 'BEGINNER'
                          ? 'success'
                          : lesson.difficulty_level === 'INTERMEDIATE'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {lesson.difficulty_level}
                    </Badge>
                    {!lesson.is_active && (
                      <Badge variant="neutral" size="sm">
                        Draft
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                    {lesson.description}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onManageExercises && (
                    <button
                      type="button"
                      onClick={() => onManageExercises(lesson._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Manage Exercises for this lesson"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Exercises</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(lesson)}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Edit Lesson"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(lesson._id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                    title="Delete Lesson"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLesson ? 'Edit Lesson' : 'Create New Lesson'}
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Lesson Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Phoneme Blending: 'bl' and 'cl' Sounds"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief explanation of what the learner will explore..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Reading, Science, Phonics"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Difficulty Level
              </label>
              <select
                value={formData.difficulty_level}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty_level: e.target.value as DifficultyLevel })
                }
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="BEGINNER">BEGINNER</option>
                <option value="INTERMEDIATE">INTERMEDIATE</option>
                <option value="ADVANCED">ADVANCED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Curriculum Order
              </label>
              <input
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Active in Student Portal
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingLesson ? 'Save Changes' : 'Create Lesson'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
