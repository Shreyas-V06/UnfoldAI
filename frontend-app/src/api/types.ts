// Types matching the Unfold FastAPI backend

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type ExerciseType = 'mcq' | 'audio' | 'emotional' | 'situational';

export interface StudentProfile {
  learning_style?: string;
  preferred_difficulty?: string;
  notes?: string;
}

export interface Student {
  _id: string;
  name: string;
  email: string;
  age: number;
  grade: string;
  profile?: StudentProfile;
  created_at: string;
  updated_at?: string;
}

export interface StudentCreate {
  name: string;
  email: string;
  age: number;
  grade: string;
  profile?: StudentProfile;
}

export interface StudentUpdate {
  name?: string;
  email?: string;
  age?: number;
  grade?: string;
  profile?: StudentProfile;
}

export interface AIObservation {
  observation: string;
  source_exercise_id?: string;
  timestamp: string;
}

export interface EmotionalProfile {
  overall_sentiment: string;
  observed_patterns: string[];
  triggers: string[];
  coping_strategies: string[];
}

export interface LessonProgress {
  lesson_id: string;
  lesson_title: string;
  average_score: number;
  completed_at: string;
}

export interface StudentMemory {
  _id: string;
  student_id: string;
  strengths: string[];
  weaknesses: string[];
  misconceptions: string[];
  pronunciation_issues: string[];
  emotional_profile: EmotionalProfile;
  completed_lessons: LessonProgress[];
  overall_progress: Record<string, any>;
  ai_observations: AIObservation[];
  last_updated: string;
}

export interface FocusArea {
  area: string;
  priority: string;
  suggested_exercises: string[];
}

export interface LessonPlan {
  _id: string;
  student_id: string;
  recommended_lessons: string[];
  focus_areas: FocusArea[];
  rationale: string;
  difficulty_adjustment: string;
  generated_at: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description: string;
  subject: string;
  difficulty_level: DifficultyLevel;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LessonCreate {
  title: string;
  description: string;
  subject: string;
  difficulty_level: DifficultyLevel;
  order: number;
  is_active?: boolean;
}

export interface LessonUpdate {
  title?: string;
  description?: string;
  subject?: string;
  difficulty_level?: DifficultyLevel;
  order?: number;
  is_active?: boolean;
}

export interface MCQContent {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

export interface AudioContent {
  audio_description: string;
  target_text: string;
  pronunciation_guide?: string;
}

export interface EmotionalContent {
  scenario_description: string;
  emotion_context: string;
  expected_response_type?: string;
  guiding_questions: string[];
}

export interface SituationalContent {
  situation: string;
  context: string;
  expected_skills: string[];
  difficulty_hint?: string;
}

export type ExerciseContent = MCQContent | AudioContent | EmotionalContent | SituationalContent | Record<string, any>;

export interface Exercise {
  _id: string;
  lesson_id: string;
  type: ExerciseType;
  title: string;
  content: ExerciseContent;
  order: number;
  created_at: string;
  updated_at?: string;
}

export interface ExerciseCreate {
  lesson_id: string;
  type: ExerciseType;
  title: string;
  content: ExerciseContent;
  order: number;
}

export interface ExerciseUpdate {
  lesson_id?: string;
  type?: ExerciseType;
  title?: string;
  content?: ExerciseContent;
  order?: number;
}

export interface LessonDetail extends Lesson {
  exercises: Exercise[];
}

export interface EvaluationResult {
  score: number;
  correct?: boolean;
  analysis: string;
  identified_issues: string[];
}

export interface ImmediateFeedback {
  summary: string;
  strengths: string[];
  areas_to_improve: string[];
  specific_tips: string[];
  encouragement: string;
}

export interface ExerciseResult {
  _id: string;
  student_id: string;
  exercise_id: string;
  lesson_id: string;
  exercise_type: string;
  submission: Record<string, any>;
  evaluation: EvaluationResult;
  immediate_feedback: ImmediateFeedback;
  score: number;
  submitted_at: string;
}

export interface SubmitExerciseResponse {
  exercise_result: ExerciseResult;
  immediate_feedback: ImmediateFeedback;
}

export interface ReportFinding {
  category: string;
  finding: string;
  severity: 'low' | 'medium' | 'high' | 'info' | string;
}

export interface Report {
  _id: string;
  student_id: string;
  period: string;
  summary: Record<string, any>;
  detailed_findings: ReportFinding[];
  recommendations: string[];
  generated_at: string;
}

export interface CourseVideo {
  title: string;
  link: string;
}

export interface CourseGenerateResponse {
  topic: string;
  videos: CourseVideo[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  student_id: string;
  message: string;
  conversation_history: ChatMessage[];
  exercise_id?: string;
  current_exercise_context?: Record<string, any>;
}

export interface ChatResponse {
  reply: string;
  lesson_id: string;
}

