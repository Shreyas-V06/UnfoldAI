import {
  Student,
  StudentCreate,
  StudentUpdate,
  StudentMemory,
  LessonPlan,
  Lesson,
  LessonDetail,
  LessonCreate,
  LessonUpdate,
  Exercise,
  ExerciseCreate,
  ExerciseUpdate,
  ExerciseResult,
  SubmitExerciseResponse,
  Report,
  CourseGenerateResponse,
  ChatResponse,
  ChatMessage,
} from './types';

const API_BASE = '/api/v1';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options?.headers || {});

  if (!(options?.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((e: any) => `${e.loc?.join('.') || ''}: ${e.msg}`).join(', ');
        } else {
          errorMessage = JSON.stringify(errorData.detail);
        }
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Student APIs
// ---------------------------------------------------------------------------
export const studentsApi = {
  list: (skip = 0, limit = 50) =>
    request<Student[]>(`/students/?skip=${skip}&limit=${limit}`),

  get: (studentId: string) =>
    request<Student>(`/students/${studentId}`),

  create: (data: StudentCreate) =>
    request<Student>('/students/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (studentId: string, data: StudentUpdate) =>
    request<Student>(`/students/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getMemory: (studentId: string) =>
    request<StudentMemory>(`/students/${studentId}/memory`),

  getLessonPlan: (studentId: string) =>
    request<LessonPlan | null>(`/students/${studentId}/lesson-plan`),
};

// ---------------------------------------------------------------------------
// Lesson APIs
// ---------------------------------------------------------------------------
export const lessonsApi = {
  list: (skip = 0, limit = 50, subject?: string) => {
    let query = `/lessons/?skip=${skip}&limit=${limit}`;
    if (subject) query += `&subject=${encodeURIComponent(subject)}`;
    return request<Lesson[]>(query);
  },

  getDetail: (lessonId: string) =>
    request<LessonDetail>(`/lessons/${lessonId}`),
};

// ---------------------------------------------------------------------------
// Exercise APIs
// ---------------------------------------------------------------------------
export const exercisesApi = {
  get: (exerciseId: string) =>
    request<Exercise>(`/exercises/${exerciseId}`),

  submit: (exerciseId: string, studentId: string, submissionData: Record<string, any>) =>
    request<SubmitExerciseResponse>(`/exercises/${exerciseId}/submit?student_id=${encodeURIComponent(studentId)}`, {
      method: 'POST',
      body: JSON.stringify({ submission_data: submissionData }),
    }),

  submitAudio: async (exerciseId: string, studentId: string, audioFile: Blob | File) => {
    const formData = new FormData();
    const filename = audioFile instanceof File ? audioFile.name : 'recording.wav';
    formData.append('file', audioFile, filename);

    return request<SubmitExerciseResponse>(
      `/exercises/${exerciseId}/submit-audio?student_id=${encodeURIComponent(studentId)}`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  getResultsForLesson: (studentId: string, lessonId: string) =>
    request<ExerciseResult[]>(`/exercises/results/${encodeURIComponent(studentId)}/${encodeURIComponent(lessonId)}`),
};

// ---------------------------------------------------------------------------
// Report APIs
// ---------------------------------------------------------------------------
export const reportsApi = {
  generate: (studentId: string, period = 'overall') =>
    request<Report>(`/reports/generate/${encodeURIComponent(studentId)}?period=${encodeURIComponent(period)}`, {
      method: 'POST',
    }),

  list: (studentId: string, skip = 0, limit = 10) =>
    request<Report[]>(`/reports/${encodeURIComponent(studentId)}?skip=${skip}&limit=${limit}`),

  get: (studentId: string, reportId: string) =>
    request<Report>(`/reports/${encodeURIComponent(studentId)}/${encodeURIComponent(reportId)}`),
};

// ---------------------------------------------------------------------------
// Admin APIs
// ---------------------------------------------------------------------------
export const adminApi = {
  createLesson: (data: LessonCreate) =>
    request<Lesson>('/admin/lessons', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLesson: (lessonId: string, data: LessonUpdate) =>
    request<Lesson>(`/admin/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLesson: (lessonId: string) =>
    request<void>(`/admin/lessons/${lessonId}`, {
      method: 'DELETE',
    }),

  addExercise: (lessonId: string, data: ExerciseCreate) =>
    request<Exercise>(`/admin/lessons/${lessonId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExercise: (exerciseId: string, data: ExerciseUpdate) =>
    request<Exercise>(`/admin/exercises/${exerciseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExercise: (exerciseId: string) =>
    request<void>(`/admin/exercises/${exerciseId}`, {
      method: 'DELETE',
    }),
};

// ---------------------------------------------------------------------------
// Course Generator API
// ---------------------------------------------------------------------------
export const coursesApi = {
  generate: (topic: string, maxResults = 5) =>
    request<CourseGenerateResponse>('/courses/generate', {
      method: 'POST',
      body: JSON.stringify({ topic, max_results: maxResults }),
    }),
};

// ---------------------------------------------------------------------------
// Chatbot API
// ---------------------------------------------------------------------------
export const chatApi = {
  sendMessage: (
    lessonId: string,
    studentId: string,
    message: string,
    history: ChatMessage[] = [],
    exerciseId?: string,
    currentExerciseContext?: Record<string, any>
  ) =>
    request<ChatResponse>(`/chat/${encodeURIComponent(lessonId)}`, {
      method: 'POST',
      body: JSON.stringify({
        student_id: studentId,
        message,
        conversation_history: history,
        exercise_id: exerciseId,
        current_exercise_context: currentExerciseContext,
      }),
    }),
};
