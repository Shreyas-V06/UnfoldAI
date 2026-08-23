import React, { useState, useEffect, useCallback } from 'react';
import {
  Lesson,
  LessonDetail,
  Exercise,
  ExerciseCreate,
  ExerciseUpdate,
  ExerciseType,
} from '../../api/types';
import { lessonsApi, adminApi } from '../../api/client';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Volume2,
  Heart,
  Compass,
  Loader2,
  AlertCircle,
  X,
  HelpCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface ExerciseManagerProps {
  initialLessonId?: string;
}

export const ExerciseManager: React.FC<ExerciseManagerProps> = ({ initialLessonId }) => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(initialLessonId || '');
  const [currentLessonDetail, setCurrentLessonDetail] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  // Form State
  const [exerciseType, setExerciseType] = useState<ExerciseType>('mcq');
  const [title, setTitle] = useState('');
  const [order, setOrder] = useState(1);

  // MCQ Content Form
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqOptions, setMcqOptions] = useState<string[]>(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
  const [mcqCorrectIndex, setMcqCorrectIndex] = useState(0);
  const [mcqExplanation, setMcqExplanation] = useState('');

  // Audio Content Form
  const [audioDescription, setAudioDescription] = useState('');
  const [audioTargetText, setAudioTargetText] = useState('');
  const [audioPronunciationGuide, setAudioPronunciationGuide] = useState('');

  // Emotional Content Form
  const [emoScenario, setEmoScenario] = useState('');
  const [emoContext, setEmoContext] = useState('');
  const [emoQuestions, setEmoQuestions] = useState<string[]>(['How would you express yourself?']);

  // Situational Content Form
  const [sitSituation, setSitSituation] = useState('');
  const [sitContext, setSitContext] = useState('');
  const [sitSkills, setSitSkills] = useState('Active Listening, Empathy, Problem Solving');
  const [sitHint, setSitHint] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all lessons for dropdown
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const list = await lessonsApi.list(0, 100);
        setLessons(list);
        if (list.length > 0 && !selectedLessonId) {
          setSelectedLessonId(list[0]._id);
        }
      } catch (err) {
        console.error('Failed to load lessons list:', err);
      }
    };
    fetchLessons();
  }, [selectedLessonId]);

  // Fetch lesson detail with exercises
  const fetchLessonDetail = useCallback(async () => {
    if (!selectedLessonId) return;
    try {
      setLoading(true);
      const detail = await lessonsApi.getDetail(selectedLessonId);
      setCurrentLessonDetail(detail);
    } catch (err) {
      console.error('Failed to load lesson detail:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedLessonId]);

  useEffect(() => {
    fetchLessonDetail();
  }, [fetchLessonDetail]);

  const handleOpenCreate = () => {
    setEditingExercise(null);
    setTitle('');
    setExerciseType('mcq');
    setOrder((currentLessonDetail?.exercises?.length || 0) + 1);

    // Reset MCQ
    setMcqQuestion('');
    setMcqOptions(['Option 1', 'Option 2', 'Option 3', 'Option 4']);
    setMcqCorrectIndex(0);
    setMcqExplanation('');

    // Reset Audio
    setAudioDescription('Read the following target word clearly:');
    setAudioTargetText('');
    setAudioPronunciationGuide('');

    // Reset Emotional
    setEmoScenario('');
    setEmoContext('');
    setEmoQuestions(['How would you express your feelings here?']);

    // Reset Situational
    setSitSituation('');
    setSitContext('');
    setSitSkills('Problem Solving, Reflection');
    setSitHint('');

    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setTitle(exercise.title);
    setExerciseType(exercise.type);
    setOrder(exercise.order);
    setError(null);

    const c: any = exercise.content || {};

    if (exercise.type === 'mcq') {
      setMcqQuestion(c.question || '');
      setMcqOptions(c.options || ['Option 1', 'Option 2']);
      setMcqCorrectIndex(c.correct_answer_index ?? 0);
      setMcqExplanation(c.explanation || '');
    } else if (exercise.type === 'audio') {
      setAudioDescription(c.audio_description || '');
      setAudioTargetText(c.target_text || '');
      setAudioPronunciationGuide(c.pronunciation_guide || '');
    } else if (exercise.type === 'emotional') {
      setEmoScenario(c.scenario_description || '');
      setEmoContext(c.emotion_context || '');
      setEmoQuestions(c.guiding_questions || ['How would you respond?']);
    } else if (exercise.type === 'situational') {
      setSitSituation(c.situation || '');
      setSitContext(c.context || '');
      setSitSkills(Array.isArray(c.expected_skills) ? c.expected_skills.join(', ') : '');
      setSitHint(c.difficulty_hint || '');
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedLessonId) {
      setError('Please provide a title');
      return;
    }

    let builtContent: Record<string, any> = {};

    if (exerciseType === 'mcq') {
      if (!mcqQuestion.trim() || mcqOptions.filter((o) => o.trim()).length < 2) {
        setError('MCQ requires a question and at least 2 valid options');
        return;
      }
      builtContent = {
        question: mcqQuestion.trim(),
        options: mcqOptions.map((o) => o.trim()).filter(Boolean),
        correct_answer_index: mcqCorrectIndex,
        explanation: mcqExplanation.trim() || 'Correct answer selected.',
      };
    } else if (exerciseType === 'audio') {
      if (!audioTargetText.trim()) {
        setError('Audio exercise requires target text');
        return;
      }
      builtContent = {
        audio_description: audioDescription.trim() || 'Read the target text aloud:',
        target_text: audioTargetText.trim(),
        pronunciation_guide: audioPronunciationGuide.trim() || undefined,
      };
    } else if (exerciseType === 'emotional') {
      if (!emoScenario.trim()) {
        setError('Emotional exercise requires a scenario description');
        return;
      }
      builtContent = {
        scenario_description: emoScenario.trim(),
        emotion_context: emoContext.trim() || 'Reflect on this feeling',
        expected_response_type: 'text',
        guiding_questions: emoQuestions.filter((q) => q.trim()),
      };
    } else if (exerciseType === 'situational') {
      if (!sitSituation.trim()) {
        setError('Situational exercise requires a situation description');
        return;
      }
      builtContent = {
        situation: sitSituation.trim(),
        context: sitContext.trim() || 'Real-world practical context',
        expected_skills: sitSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        difficulty_hint: sitHint.trim() || undefined,
      };
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (editingExercise) {
        await adminApi.updateExercise(editingExercise._id, {
          title: title.trim(),
          type: exerciseType,
          order: Number(order),
          content: builtContent,
        });
      } else {
        await adminApi.addExercise(selectedLessonId, {
          lesson_id: selectedLessonId,
          type: exerciseType,
          title: title.trim(),
          order: Number(order),
          content: builtContent,
        });
      }

      await fetchLessonDetail();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Save exercise failed:', err);
      setError(err?.message || 'Failed to save exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (exerciseId: string) => {
    if (!window.confirm('Delete this exercise?')) return;
    try {
      await adminApi.deleteExercise(exerciseId);
      await fetchLessonDetail();
    } catch (err: any) {
      console.error('Delete exercise failed:', err);
      alert(`Error deleting exercise: ${err?.message}`);
    }
  };

  const exercises = currentLessonDetail?.exercises || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header & Lesson Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Multimodal Exercise Authoring Studio</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Design interactive MCQs, voice reading tests, emotional awareness, and situational problems.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={!selectedLessonId}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs md:text-sm rounded-2xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Exercise</span>
        </button>
      </div>

      {/* Lesson Selector Dropdown */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Selected Lesson:
          </span>
          <select
            value={selectedLessonId}
            onChange={(e) => setSelectedLessonId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            {lessons.map((l) => (
              <option key={l._id} value={l._id}>
                {l.title} ({l.subject} - {l.difficulty_level})
              </option>
            ))}
          </select>
        </div>

        {currentLessonDetail && (
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="sm">
              {currentLessonDetail.subject}
            </Badge>
            <Badge variant="neutral" size="sm">
              {exercises.length} Exercises
            </Badge>
          </div>
        )}
      </div>

      {/* Exercises List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading lesson exercises...</p>
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No exercises created for this lesson yet
          </h3>
          <p className="text-xs text-slate-500">
            Click "New Exercise" to create your first MCQ, Audio, Emotional, or Situational exercise!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.map((ex) => {
            const isMCQ = ex.type === 'mcq';
            const isAudio = ex.type === 'audio';
            const isEmotional = ex.type === 'emotional';
            const isSituational = ex.type === 'situational';

            return (
              <div
                key={ex._id}
                className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{ex.order}
                      </span>
                      <Badge
                        variant={
                          isMCQ
                            ? 'primary'
                            : isAudio
                            ? 'danger'
                            : isEmotional
                            ? 'purple'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {ex.type.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(ex)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Edit Exercise"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ex._id)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                        title="Delete Exercise"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {ex.title}
                    </h3>
                  </div>

                  {/* Summary preview of content */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    {isMCQ && (
                      <>
                        <p className="font-semibold line-clamp-1">Q: {(ex.content as any).question}</p>
                        <p className="text-[11px] text-slate-400">
                          Options: {(ex.content as any).options?.join(', ')}
                        </p>
                      </>
                    )}
                    {isAudio && (
                      <>
                        <p className="font-semibold">Target: "{(ex.content as any).target_text}"</p>
                        {(ex.content as any).pronunciation_guide && (
                          <p className="text-[11px] text-slate-400">
                            Guide: {(ex.content as any).pronunciation_guide}
                          </p>
                        )}
                      </>
                    )}
                    {isEmotional && (
                      <p className="line-clamp-2">{(ex.content as any).scenario_description}</p>
                    )}
                    {isSituational && (
                      <p className="line-clamp-2">{(ex.content as any).situation}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Exercise Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExercise ? 'Edit Exercise' : 'Create New Exercise'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Exercise Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Identify the Blend Sound"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Order
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exercise Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['mcq', 'audio', 'emotional', 'situational'] as ExerciseType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setExerciseType(t)}
                  className={clsx(
                    'py-2 px-1 text-center rounded-xl text-xs font-bold uppercase transition-all cursor-pointer border',
                    exerciseType === t
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Forms by Type */}

          {/* 1. MCQ Form */}
          {exerciseType === 'mcq' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                MCQ Configuration
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Question Text *
                </label>
                <input
                  type="text"
                  required
                  value={mcqQuestion}
                  onChange={(e) => setMcqQuestion(e.target.value)}
                  placeholder="e.g. Which word starts with the 'bl' sound?"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Options & Correct Answer (Select radio button for correct option)
                </label>
                {mcqOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={mcqCorrectIndex === idx}
                      onChange={() => setMcqCorrectIndex(idx)}
                      className="w-4 h-4 text-indigo-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...mcqOptions];
                        newOpts[idx] = e.target.value;
                        setMcqOptions(newOpts);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none"
                    />
                    {mcqOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = mcqOptions.filter((_, i) => i !== idx);
                          setMcqOptions(newOpts);
                          if (mcqCorrectIndex >= newOpts.length) setMcqCorrectIndex(0);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {mcqOptions.length < 6 && (
                  <button
                    type="button"
                    onClick={() => setMcqOptions([...mcqOptions, `Option ${mcqOptions.length + 1}`])}
                    className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    + Add Option
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation / Clue
                </label>
                <input
                  type="text"
                  value={mcqExplanation}
                  onChange={(e) => setMcqExplanation(e.target.value)}
                  placeholder="e.g. 'blue' begins with 'bl'."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 2. Audio Form */}
          {exerciseType === 'audio' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Audio & Speech Configuration
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audio Instruction / Prompt
                </label>
                <input
                  type="text"
                  value={audioDescription}
                  onChange={(e) => setAudioDescription(e.target.value)}
                  placeholder="e.g. Pronounce the target science term clearly"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Text to Read / Speak *
                </label>
                <input
                  type="text"
                  required
                  value={audioTargetText}
                  onChange={(e) => setAudioTargetText(e.target.value)}
                  placeholder="e.g. Chlorophyll or The quick brown fox"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pronunciation Guide / Syllables (Optional)
                </label>
                <input
                  type="text"
                  value={audioPronunciationGuide}
                  onChange={(e) => setAudioPronunciationGuide(e.target.value)}
                  placeholder="e.g. klor-o-fil"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 3. Emotional Form */}
          {exerciseType === 'emotional' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                Emotional Scenario Configuration
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scenario Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={emoScenario}
                  onChange={(e) => setEmoScenario(e.target.value)}
                  placeholder="Describe a relatable learning situation..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Emotion Context
                </label>
                <input
                  type="text"
                  value={emoContext}
                  onChange={(e) => setEmoContext(e.target.value)}
                  placeholder="e.g. Navigating reading frustration during class"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 4. Situational Form */}
          {exerciseType === 'situational' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Situational Challenge Configuration
              </span>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Situation *
                </label>
                <textarea
                  rows={2}
                  required
                  value={sitSituation}
                  onChange={(e) => setSitSituation(e.target.value)}
                  placeholder="Describe a real-world dilemma or challenge..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Skills (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={sitSkills}
                    onChange={(e) => setSitSkills(e.target.value)}
                    placeholder="Problem Solving, Empathy"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty Clue (Optional)
                  </label>
                  <input
                    type="text"
                    value={sitHint}
                    onChange={(e) => setSitHint(e.target.value)}
                    placeholder="Consider asking a teammate for help"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
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
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingExercise ? 'Update Exercise' : 'Add Exercise'}</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
