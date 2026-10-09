export interface TestQuestion {
  id: string;
  question: string;
  options: { key: string; text: string }[];
}
export interface Student {
  rollNumber: string;
  section: string;
}
export interface TestConfig {
  success: boolean;
  testId?: string;
  testName: string;
  subject: string;
  totalQuestions: number;
  marksPerQuestion: number;
  allowRetest: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  testStatus: string;
  questionIds: string[];
  durationMinutes?: number;
  startTime?: string | null;
  endTime?: string | null;
}
export interface StudentAnswer {
  questionId: string;
  selectedOption: string;
}
export interface TestResult {
  rollNumber: string;
  section: string;
  testName: string;
  testId?: string;
  totalQuestions: number;
  marksPerQuestion?: number;
  maxScore?: number;
  attempted?: number;
  correct?: number;
  wrong?: number;
  unanswered?: number;
  score?: number;
  resultReleased?: boolean;
}
