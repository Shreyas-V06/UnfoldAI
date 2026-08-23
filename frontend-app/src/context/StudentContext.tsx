import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Student, StudentMemory, LessonPlan } from '../api/types';
import { studentsApi } from '../api/client';

interface StudentContextType {
  students: Student[];
  currentStudent: Student | null;
  memory: StudentMemory | null;
  lessonPlan: LessonPlan | null;
  loading: boolean;
  loadingMemory: boolean;
  error: string | null;
  isStudentModalOpen: boolean;
  setIsStudentModalOpen: (open: boolean) => void;
  selectStudent: (student: Student) => void;
  refreshStudentsList: () => Promise<void>;
  refreshCurrentStudentData: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export const StudentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [memory, setMemory] = useState<StudentMemory | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMemory, setLoadingMemory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);

  const currentStudentRef = useRef<Student | null>(null);
  currentStudentRef.current = currentStudent;

  // Fetch list of students
  const refreshStudentsList = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await studentsApi.list();
      setStudents(list);

      if (list.length > 0) {
        const storedId = localStorage.getItem('unfold_active_student_id');
        const found = list.find((s) => s._id === storedId);
        if (found) {
          if (currentStudentRef.current?._id !== found._id) {
            setCurrentStudent(found);
          }
        } else if (!currentStudentRef.current) {
          setCurrentStudent(list[0]);
          localStorage.setItem('unfold_active_student_id', list[0]._id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch students:', err);
      setError(err?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch memory & lesson plan for active student
  const refreshCurrentStudentData = useCallback(async () => {
    const studentId = currentStudentRef.current?._id;
    if (!studentId) return;
    try {
      setLoadingMemory(true);
      const [memRes, planRes] = await Promise.all([
        studentsApi.getMemory(studentId).catch(() => null),
        studentsApi.getLessonPlan(studentId).catch(() => null),
      ]);
      setMemory(memRes);
      setLessonPlan(planRes);
    } catch (err) {
      console.error('Failed to load student memory/plan:', err);
    } finally {
      setLoadingMemory(false);
    }
  }, []);

  // Initial mount load
  useEffect(() => {
    refreshStudentsList();
  }, [refreshStudentsList]);

  // When active student ID changes, update localStorage and load details
  const activeStudentId = currentStudent?._id;
  useEffect(() => {
    if (activeStudentId) {
      localStorage.setItem('unfold_active_student_id', activeStudentId);
      refreshCurrentStudentData();
    } else {
      setMemory(null);
      setLessonPlan(null);
    }
  }, [activeStudentId, refreshCurrentStudentData]);

  const selectStudent = (student: Student) => {
    setCurrentStudent(student);
    localStorage.setItem('unfold_active_student_id', student._id);
  };

  return (
    <StudentContext.Provider
      value={{
        students,
        currentStudent,
        memory,
        lessonPlan,
        loading,
        loadingMemory,
        error,
        isStudentModalOpen,
        setIsStudentModalOpen,
        selectStudent,
        refreshStudentsList,
        refreshCurrentStudentData,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextType => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
};
