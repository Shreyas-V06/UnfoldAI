import React, { useState } from 'react';
import { User, Plus, Check, Sparkles, GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { useStudent } from '../../context/StudentContext';
import { studentsApi } from '../../api/client';
import { Modal } from '../common/Modal';
import { clsx } from 'clsx';

export const StudentSelector: React.FC = () => {
  const {
    students,
    currentStudent,
    selectStudent,
    isStudentModalOpen,
    setIsStudentModalOpen,
    refreshStudentsList,
  } = useStudent();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 10,
    grade: '5th',
    learning_style: 'visual',
    preferred_difficulty: 'BEGINNER',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Please provide both name and email');
      return;
    }

    try {
      setIsSubmitting(true);
      const newStudent = await studentsApi.create({
        name: formData.name.trim(),
        email: formData.email.trim(),
        age: Number(formData.age),
        grade: formData.grade.trim(),
        profile: {
          learning_style: formData.learning_style,
          preferred_difficulty: formData.preferred_difficulty,
          notes: formData.notes.trim() || undefined,
        },
      });

      await refreshStudentsList();
      selectStudent(newStudent);
      setIsCreatingNew(false);
      setIsStudentModalOpen(false);
      setFormData({
        name: '',
        email: '',
        age: 10,
        grade: '5th',
        learning_style: 'visual',
        preferred_difficulty: 'BEGINNER',
        notes: '',
      });
    } catch (err: any) {
      console.error('Failed to create student:', err);
      setFormError(err?.message || 'Failed to create student profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Student Badge / Trigger Button */}
      <button
        type="button"
        onClick={() => setIsStudentModalOpen(true)}
        className="flex items-center gap-2.5 px-3.5 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 border border-brand-200 dark:border-brand-800/80 rounded-full transition-all text-xs md:text-sm font-semibold text-brand-900 dark:text-brand-200 shadow-sm cursor-pointer"
        aria-label="Switch Student Profile"
      >
        <div className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
          {currentStudent?.name ? currentStudent.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
        </div>
        <span className="max-w-[120px] truncate">
          {currentStudent ? currentStudent.name : 'Select Student'}
        </span>
        {currentStudent?.grade && (
          <span className="hidden sm:inline-block text-[11px] bg-brand-200/80 dark:bg-brand-900 text-brand-800 dark:text-brand-300 px-1.5 py-0.5 rounded font-mono">
            {currentStudent.grade}
          </span>
        )}
      </button>

      {/* Modal */}
      <Modal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setIsCreatingNew(false);
          setFormError(null);
        }}
        title={
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span>{isCreatingNew ? 'Create Student Profile' : 'Select Learner Profile'}</span>
          </div>
        }
        maxWidth="md"
      >
        {!isCreatingNew ? (
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
              Each learner has their own personalized AI cognitive memory, adaptive lesson plan, and emotional profile.
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {students.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm">
                  No students registered yet. Create your first profile below!
                </div>
              ) : (
                students.map((student) => {
                  const isSelected = currentStudent?._id === student._id;
                  return (
                    <div
                      key={student._id}
                      onClick={() => {
                        selectStudent(student);
                        setIsStudentModalOpen(false);
                      }}
                      className={clsx(
                        'flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none',
                        isSelected
                          ? 'bg-brand-50/80 dark:bg-brand-950/60 border-brand-500 shadow-sm ring-1 ring-brand-500'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-sm',
                            isSelected
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          )}
                        >
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{student.name}</span>
                            {student.grade && (
                              <span className="text-xs font-normal text-slate-400">
                                (Grade {student.grade})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {student.email} • Age {student.age}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-2xl shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Learner</span>
            </button>
          </div>
        ) : (
          /* Form for creating new student */
          <form onSubmit={handleCreateStudent} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Learner Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Leo Patel"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. leo@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Age (4-18) *
                </label>
                <input
                  type="number"
                  min="4"
                  max="18"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 10 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Grade / Level *
                </label>
                <input
                  type="text"
                  required
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g. 5th / Year 6"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Learning Style
                </label>
                <select
                  value={formData.learning_style}
                  onChange={(e) => setFormData({ ...formData, learning_style: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                >
                  <option value="visual">Visual (Diagrams & Colors)</option>
                  <option value="auditory">Auditory (Voice & Sound)</option>
                  <option value="kinesthetic">Kinesthetic (Interactive)</option>
                  <option value="multimodal">Multimodal (Combined)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Starting Difficulty
                </label>
                <select
                  value={formData.preferred_difficulty}
                  onChange={(e) => setFormData({ ...formData, preferred_difficulty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                >
                  <option value="BEGINNER">Beginner (Gentle)</option>
                  <option value="INTERMEDIATE">Intermediate (Standard)</option>
                  <option value="ADVANCED">Advanced (Challenging)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Learning Notes / Accommodations (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Loves phonics blends, needs extra time for long sentences"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 rounded-xl cursor-pointer"
              >
                Back to List
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
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
};
