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
  status?: string;
  alreadySubmitted?: boolean;
  resultReleased?: boolean;
  result?: TestResult;
}

export interface SubmissionQueueResponse {
  success: boolean;
  message: string;
  status: "QUEUED" | "PROCESSING" | "RETRYING" | "SUBMITTED" | "ACTION_REQUIRED" | string;
  resultReleased?: boolean;
}

export interface SubmissionStatusResponse {
  success: boolean;
  message: string;
  status: "QUEUED" | "PROCESSING" | "RETRYING" | "SUBMITTED" | "ACTION_REQUIRED" | "RECONCILIATION_REQUIRED" | "NOT_FOUND" | string;
  resultReleased?: boolean;
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
/** Add a submission to the Apps Script queue. This action does not grade it. */
export const queueSubmitTest = (
  rollNumber: string,
  section: string,
  answers: SubmitAnswer[],
  testId: string,
  sessionId: string,
) =>
  apiRequest<SubmissionQueueResponse>({
    action: "queueSubmitTest",
    rollNumber,
    section,
    testId,
    sessionId,
    answers,
  });

/** Read the queue state for the same student/test/session tuple. */
export const getSubmissionStatus = (payload: {
  rollNumber: string;
  section: string;
  testId: string;
  sessionId: string;
}) =>
  apiRequest<SubmissionStatusResponse>({
    action: "getSubmissionStatus",
    ...payload,
  });

/**
 * Compatibility wrapper used by App.tsx. It queues once, then polls status.
 * A timeout does not mean failure: the request may still be safely queued.
 */
export const submitTest = async (
  rollNumber: string,
  section: string,
  answers: SubmitAnswer[],
  testId?: string,
  sessionId?: string,
  _autoSubmit = false,
): Promise<SubmitTestResponse> => {
  if (!testId || !sessionId) {
    throw new Error("Missing test or session information. Please contact the administrator.");
  }

  const identity = { rollNumber, section, testId, sessionId };
  const accepted = await queueSubmitTest(
    rollNumber,
    section,
    answers,
    testId,
    sessionId,
  );

  if (accepted.status === "SUBMITTED") {
    return {
      success: true,
      status: "SUBMITTED",
      alreadySubmitted: true,
      resultReleased: Boolean(accepted.resultReleased),
      message: accepted.message || "Your submission has been recorded.",
    };
  }

  if (accepted.status === "ACTION_REQUIRED" || accepted.status === "RECONCILIATION_REQUIRED") {
    throw new Error(accepted.message || "Your submission requires administrator review.");
  }

  // Apps Script's worker runs in small batches; allow up to two minutes for
  // the one-minute trigger and transient processing delays.
  const deadline = Date.now() + 120_000;
  let latestStatus = accepted.status;

  while (Date.now() < deadline) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 2000));
    const current = await getSubmissionStatus(identity);
    latestStatus = current.status;

    if (current.status === "SUBMITTED") {
      return {
        success: true,
        status: "SUBMITTED",
        resultReleased: Boolean(current.resultReleased),
        message: current.message || "Your submission has been recorded.",
      };
    }

    if (current.status === "ACTION_REQUIRED" || current.status === "RECONCILIATION_REQUIRED") {
      throw new Error(current.message || "Your submission requires administrator review. Contact the assessment administrator; do not start a new attempt.");
    }

    if (!["QUEUED", "PROCESSING", "RETRYING"].includes(current.status)) {
      throw new Error(current.message || `Unexpected submission status: ${current.status || "unknown"}.`);
    }
  }

  throw new Error(
    `Your submission was accepted and is still ${latestStatus || "processing"}. Do not start a new attempt. You can safely retry the submit action from this same session to check the existing queue entry.`,
  );
};

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
