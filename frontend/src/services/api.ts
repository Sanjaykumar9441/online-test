import type {
  TestQuestion,
  TestResult,
} from "../types/test";

const API_URL = "/api/test";

/* =========================================================
   API TYPES
   ========================================================= */

export interface StudentValidationResponse {
  success: boolean;
  message: string;
  alreadySubmitted?: boolean;
}

export interface StartTestResponse {
  success: boolean;
  message?: string;
  alreadySubmitted?: boolean;
  configurationError?: boolean;

  testName?: string;
  subject?: string;
  totalQuestions?: number;
  marksPerQuestion?: number;

  questions?: TestQuestion[];
}

export interface SubmitAnswer {
  questionId: string;
  selectedOption: string;
}

export interface SubmitTestResponse {
  success: boolean;
  message: string;
  alreadySubmitted?: boolean;
  result?: TestResult;
}

export interface AvailableTest {
  testId: string;
  testName: string;
  subject?: string;
  totalQuestions?: number;
  marksPerQuestion?: number;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number;
  status: string;
  canStart: boolean;
}

export interface TestsResponse {
  success: boolean;
  message?: string;
  tests?: AvailableTest[];
}

export interface TestConfigResponse {
  success: boolean;
  message?: string;

  testName?: string;
  subject?: string;
  totalQuestions?: number;
  marksPerQuestion?: number;

  allowRetest?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  testStatus?: string;
  testId?: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number;
  questionIds?: string[];
}

export interface SectionsResponse {
  success: boolean;
  message?: string;
  sections?: string[];
}

/* =========================================================
   COMMON API REQUEST
   ========================================================= */

async function apiRequest<T>(
  body: Record<string, unknown>
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(API_URL, {
      method: "POST",

      // React → Vercel
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("API connection error:", error);

    throw new Error(
      "Unable to connect to the test server. Please check your internet connection."
    );
  }

  let data: T & {
    success?: boolean;
    message?: string;
  };

  try {
    data = await response.json();
  } catch (error) {
    console.error("Invalid API response:", error);

    throw new Error(
      "The server returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Server error (${response.status}).`
    );
  }

  if (data && data.success === false) {
    throw new Error(
      data.message ||
        "The request was unsuccessful."
    );
  }

  return data;
}

/* =========================================================
   VALIDATE STUDENT
   ========================================================= */

export async function validateStudent(
  rollNumber: string,
  section: string,
  testId?: string,
): Promise<StudentValidationResponse> {
  return apiRequest<StudentValidationResponse>({
    action: "validateStudent",
    rollNumber,
    section,
    ...(testId ? { testId } : {}),
  });
}

/* =========================================================
   GET SECTIONS
   ========================================================= */

export async function getSections(): Promise<SectionsResponse> {
  return apiRequest<SectionsResponse>({
    action: "getSections",
  });
}

/* =========================================================
   GET TEST CONFIG
   ========================================================= */

export async function getTests(): Promise<TestsResponse> {
  return apiRequest<TestsResponse>({ action: "getTests" });
}

export async function getTestConfig(testId?: string): Promise<TestConfigResponse> {
  return apiRequest<TestConfigResponse>({
    action: "getTestConfig",
    ...(testId ? { testId } : {}),
  });
}

/* =========================================================
   START TEST
   ========================================================= */

export async function startTest(
  rollNumber: string,
  section: string,
  testId?: string,
): Promise<StartTestResponse> {
  return apiRequest<StartTestResponse>({
    action: "startTest",
    rollNumber,
    section,
    ...(testId ? { testId } : {}),
  });
}

/* =========================================================
   SUBMIT TEST
   ========================================================= */

export async function submitTest(
  rollNumber: string,
  section: string,
  answers: SubmitAnswer[],
  testId?: string,
): Promise<SubmitTestResponse> {
  return apiRequest<SubmitTestResponse>({
    action: "submitTest",
    rollNumber,
    section,
    answers,
    ...(testId ? { testId } : {}),
  });
}