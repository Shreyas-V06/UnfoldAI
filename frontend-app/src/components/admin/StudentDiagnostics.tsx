import React, { useState, useEffect, useCallback } from 'react';
import { Student, StudentMemory, LessonPlan, Report } from '../../api/types';
import { studentsApi, reportsApi } from '../../api/client';
import { Badge } from '../common/Badge';
import {
  Activity,
  Brain,
  Heart,
  Award,
  CheckCircle2,
  Mic,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';

export const StudentDiagnostics: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [memory, setMemory] = useState<StudentMemory | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [, setReports] = useState<Report[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Fetch all students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const data = await studentsApi.list(0, 100);
        setStudents(data);
        setSelectedStudent((prev) => (prev ? prev : data.length > 0 ? data[0] : null));
      } catch (err) {
        console.error('Failed to load students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const selectedStudentId = selectedStudent?._id;

  // Load details when student ID changes
  const fetchStudentData = useCallback(async () => {
    if (!selectedStudentId) return;
    try {
      setLoadingDetails(true);
      const [mem, plan, reps] = await Promise.all([
        studentsApi.getMemory(selectedStudentId).catch(() => null),
        studentsApi.getLessonPlan(selectedStudentId).catch(() => null),
        reportsApi.list(selectedStudentId).catch(() => []),
      ]);
      setMemory(mem);
      setLessonPlan(plan);
      setReports(reps);
    } catch (err) {
      console.error('Failed to fetch student diagnostic details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }, [selectedStudentId]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleGenerateReport = async () => {
    if (!selectedStudentId || isGeneratingReport) return;
    try {
      setIsGeneratingReport(true);
      const rep = await reportsApi.generate(selectedStudentId, 'overall');
      setReports((prev) => [rep, ...prev]);
    } catch (err: any) {
      alert(`Report error: ${err?.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Learner Diagnostics & Cognitive AI Memory</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-500">
          Inspect individualized AI memory vectors, emotional coping patterns, and speech-language diagnostics.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
          <p className="text-xs text-slate-500">Loading student directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">No registered students found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Students Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Students ({students.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {students.map((student) => {
                const isSelected = selectedStudent?._id === student._id;
                return (
                  <div
                    key={student._id}
                    onClick={() => setSelectedStudent(student)}
                    className={clsx(
                      'p-3.5 rounded-2xl border transition-all cursor-pointer select-none space-y-1',
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 shadow-sm ring-1 ring-purple-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {student.name}
                      </span>
                      {student.grade && (
                        <span className="text-[11px] font-mono text-slate-400">
                          {student.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{student.email}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagnostic Details Area */}
          <div className="lg:col-span-3 space-y-6">
            {selectedStudent && (
              <>
                {/* Profile Header */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {selectedStudent.name}
                        </h3>
                        <Badge variant="purple" size="sm">
                          Age {selectedStudent.age} • Grade {selectedStudent.grade}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">
                        {selectedStudent.email} • Learning Style:{' '}
                        <strong>{selectedStudent.profile?.learning_style || 'Multimodal'}</strong>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all shrink-0 cursor-pointer"
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Generate AI Diagnostic Report</span>
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto" />
                    <p className="text-xs text-slate-500">Loading AI memory state...</p>
                  </div>
                ) : (
                  <>
                    {/* Memory Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Strengths & Weaknesses */}
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>Cognitive Strengths ({memory?.strengths?.length || 0})</span>
                        </h4>

                        {memory?.strengths && memory.strengths.length > 0 ? (
                          <div className="space-y-1.5">
                            {memory.strengths.map((str, i) => (
                              <div
                                key={i}
                                className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{str}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No strengths logged yet.</p>
                        )}

                        {/* Speech & Pronunciation Issues */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Mic className="w-3.5 h-3.5 text-rose-500" />
                            <span>Speech & Acoustic Difficulties:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {memory?.pronunciation_issues && memory.pronunciation_issues.length > 0 ? (
                              memory.pronunciation_issues.map((p, i) => (
                                <Badge key={i} variant="danger" size="sm">
                                  {p}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">None detected</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Emotional State & Coping Strategies */}
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Heart className="w-4 h-4 text-purple-600" />
                          <span>Emotional Behavioral Profile</span>
                        </h4>

                        <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
                          <span>Overall Sentiment:</span>
                          <span className="font-bold uppercase">
                            {memory?.emotional_profile?.overall_sentiment || 'Neutral'}
                          </span>
                        </div>

                        {memory?.emotional_profile?.coping_strategies &&
                          memory.emotional_profile.coping_strategies.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Coping Strategies:
                              </span>
                              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                {memory.emotional_profile.coping_strategies.map((c, i) => (
                                  <li key={i}>✨ {c}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {/* Recent Observations */}
                        {memory?.ai_observations && memory.ai_observations.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Recent AI Observations ({memory.ai_observations.length}):
                            </span>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {memory.ai_observations.slice(-3).map((obs, i) => (
                                <p
                                  key={i}
                                  className="text-[11px] text-slate-600 dark:text-slate-300 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                >
                                  {obs.observation}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lesson Plan Summary */}
                    {lessonPlan && (
                      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center gap-2">
                          <Brain className="w-5 h-5 text-brand-600" />
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Active AI Recommended Lesson Plan
                          </h4>
                        </div>
                        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 italic">
                          "{lessonPlan.rationale}"
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {lessonPlan.focus_areas?.map((fa, i) => (
                            <Badge key={i} variant="primary" size="sm">
                              {fa.area} ({fa.priority})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
