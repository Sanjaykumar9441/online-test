export interface TestQuestion {
  id: string;
  question: string;
  options: {
    key: string;
    text: string;
  }[];
}

export interface Student {
  rollNumber: string;
  section: string;
}

export interface TestConfig {
  success: boolean;
  testName: string;
  subject: string;
  totalQuestions: number;
  marksPerQuestion: number;
  allowRetest: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  testStatus: string;
  questionIds: string[];
}

export interface StudentAnswer {
  questionId: string;
  selectedOption: string;
}

export interface TestResult {
  rollNumber: string;
  section: string;
  testName: string;
  totalQuestions: number;
  marksPerQuestion: number;
  maxScore: number;
  attempted: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
}