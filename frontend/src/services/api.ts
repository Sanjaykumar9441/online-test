import type { TestQuestion, TestResult } from "../types/test";
const API_URL = "/api/test";
export interface AvailableTest {
  testId: string;
  testName: string;
  subject: string;
  totalQuestions: number;
  marksPerQuestion: number;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number;
  status: "UPCOMING" | "OPEN" | "CLOSED" | "PAUSED" | "SCHEDULE_ERROR" | string;
  canStart: boolean;
  fullscreenRequired: boolean;
  maxFullscreenExits: number;
}
export interface TestsResponse {
  success: boolean;
  message?: string;
  tests: AvailableTest[];
}
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
  testId?: string;
  testName?: string;
  subject?: string;
  totalQuestions?: number;
  marksPerQuestion?: number;
  durationMinutes?: number;
  expiresAt?: string;
  attemptStartedAt?: string;
  sessionId?: string;
  fullscreenRequired?: boolean;
  maxFullscreenExits?: number;
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
  resultReleased?: boolean;
  result?: TestResult;
}
export interface TestConfigResponse {
  success: boolean;
  message?: string;
  testId?: string;
  testName?: string;
  subject?: string;
  totalQuestions?: number;
  marksPerQuestion?: number;
  durationMinutes?: number;
  allowRetest?: boolean;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  fullscreenRequired?: boolean;
  maxFullscreenExits?: number;
  testStatus?: string;
  status?: string;
  startTime?: string | null;
  endTime?: string | null;
  questionIds?: string[];
}
export interface SectionsResponse {
  success: boolean;
  message?: string;
  sections?: string[];
}
async function apiRequest<T>(body: Record<string, unknown>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      "Unable to connect to the test server. Check your internet connection.",
    );
  }
  let data: T & { success?: boolean; message?: string };
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }
  if (!response.ok || data?.success === false)
    throw new Error(data?.message || `Request failed (${response.status}).`);
  return data;
}
export const getTests = () => apiRequest<TestsResponse>({ action: "getTests" });
export const getSections = () =>
  apiRequest<SectionsResponse>({ action: "getSections" });
export const getTestConfig = (testId?: string) =>
  apiRequest<TestConfigResponse>({
    action: "getTestConfig",
    ...(testId ? { testId } : {}),
  });
export const validateStudent = (
  rollNumber: string,
  section: string,
  testId?: string,
  deviceType = "unknown",
) =>
  apiRequest<StudentValidationResponse>({
    action: "validateStudent",
    rollNumber,
    section,
    ...(testId ? { testId } : {}),
    deviceType,
  });
export const startTest = (
  rollNumber: string,
  section: string,
  testId?: string,
  sessionId?: string,
  deviceInfo?: string,
  fullscreenEntered = false,
  deviceType = "unknown",
) =>
  apiRequest<StartTestResponse>({
    action: "startTest",
    rollNumber,
    section,
    ...(testId ? { testId } : {}),
    ...(sessionId ? { sessionId } : {}),
    ...(deviceInfo ? { deviceInfo } : {}),
    fullscreenEntered,
    deviceType,
  });
export const submitTest = (
  rollNumber: string,
  section: string,
  answers: SubmitAnswer[],
  testId?: string,
  sessionId?: string,
  autoSubmit = false,
) =>
  apiRequest<SubmitTestResponse>({
    action: "submitTest",
    rollNumber,
    section,
    answers,
    ...(testId ? { testId } : {}),
    ...(sessionId ? { sessionId } : {}),
    autoSubmit,
  });

export const sendAuditEvent = (payload: {
  testId: string;
  rollNumber: string;
  section: string;
  event: string;
  detail?: string;
  sessionId?: string;
  deviceType?: string;
}) => apiRequest<{ success: boolean }>({ action: "auditEvent", ...payload });
export interface FullscreenExitResponse {
  success: boolean;
  message?: string;
  exitCount?: number;
  maxFullscreenExits?: number;
  autoSubmit?: boolean;
}
export const registerFullscreenExit = (payload: {
  testId: string;
  rollNumber: string;
  section: string;
  sessionId: string;
  deviceType: string;
  eventId: string;
}) =>
  apiRequest<FullscreenExitResponse>({ action: "fullscreenExit", ...payload });
