import { useState } from "react";
import { getTestConfig, startTest, submitTest } from "./services/api";
import type { SubmitTestResponse } from "./services/api";
import type { DeviceType } from "./services/device";
import type { TestQuestion, TestResult } from "./types/test";
import LoginPage from "./pages/LoginPage";
import InstructionsPage from "./pages/InstructionsPage";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";
import "./App.css";

type Page = "login" | "instructions" | "test" | "result";
function getSessionId() {
  const key = "assessment_session_id";
  let value = sessionStorage.getItem(key);
  if (!value) {
    value =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(key, value);
  }
  return value;
}
export default function App() {
  const [page, setPage] = useState<Page>("login");
  const [rollNumber, setRollNumber] = useState("");
  const [section, setSection] = useState("");
  const [testId, setTestId] = useState("");
  const [testName, setTestName] = useState("");
  const [subject, setSubject] = useState("");
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [marksPerQuestion, setMarksPerQuestion] = useState(1);
  const [expiresAt, setExpiresAt] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [fullscreenRequired, setFullscreenRequired] = useState(false);
  const [maxFullscreenExits, setMaxFullscreenExits] = useState(3);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);
  const [appError, setAppError] = useState("");
  const handleLogin = async (
    roll: string,
    sec: string,
    selectedTestId: string,
  ) => {
    setAppError("");
    const config = await getTestConfig(selectedTestId);
    if (!config.success)
      throw new Error(
        config.message || "Unable to load assessment configuration.",
      );
    if (config.status !== "OPEN" && config.testStatus !== "OPEN") {
      const status = config.status || config.testStatus;
      throw new Error(
        status === "UPCOMING"
          ? "This assessment has not started yet."
          : status === "PAUSED"
            ? "This assessment is paused."
            : "This assessment is currently closed.",
      );
    }
    setRollNumber(roll);
    setSection(sec);
    setTestId(selectedTestId);
    setTestName(config.testName || "");
    setSubject(config.subject || "");
    setTotalQuestions(Number(config.totalQuestions || 0));
    setMarksPerQuestion(Number(config.marksPerQuestion || 1));
    setFullscreenRequired(Boolean(config.fullscreenRequired));
    setMaxFullscreenExits(Math.max(1, Number(config.maxFullscreenExits || 3)));
    setPage("instructions");
  };
  const handleStartTest = async (
    fullscreenEntered: boolean,
    deviceType: DeviceType,
  ) => {
    setAppError("");
    const activeSessionId = getSessionId();
    setSessionId(activeSessionId);
    const response = await startTest(
      rollNumber,
      section,
      testId,
      activeSessionId,
      navigator.userAgent.slice(0, 250),
      fullscreenEntered,
      deviceType,
    );
    if (!response.success)
      throw new Error(
        response.message ||
          (response.alreadySubmitted
            ? "You have already submitted this assessment."
            : "Unable to start the assessment."),
      );
    if (!response.questions?.length)
      throw new Error("No questions were received from the server.");
    setTestName(response.testName || testName);
    setSubject(response.subject || subject);
    setTotalQuestions(
      Number(response.totalQuestions || response.questions.length),
    );
    setMarksPerQuestion(Number(response.marksPerQuestion || marksPerQuestion));
    setFullscreenRequired(
      Boolean(response.fullscreenRequired ?? fullscreenRequired),
    );
    setMaxFullscreenExits(
      Math.max(1, Number(response.maxFullscreenExits || maxFullscreenExits)),
    );
    setExpiresAt(response.expiresAt || "");
    setQuestions(response.questions);
    setPage("test");
  };
  const handleSubmit = async (
    answers: { questionId: string; selectedOption: string }[],
    automatic = false,
  ) => {
    setAppError("");
    const response = await submitTest(
      rollNumber,
      section,
      answers,
      testId,
      sessionId || getSessionId(),
      automatic,
    );
    if (!response.success)
      throw new Error(response.message || "Unable to submit the assessment.");
    const submittedResult = response.result || {
      rollNumber,
      section,
      testName,
      testId,
      totalQuestions,
      resultReleased: Boolean(response.resultReleased),
    };
    submittedResult.resultReleased = Boolean(
      response.resultReleased ?? submittedResult.resultReleased,
    );
    setResult(submittedResult);
    setPage("result");
  };
  const handleServerAutoSubmitted = (response: SubmitTestResponse) => {
    if (!response.success) {
      setAppError(
        response.message ||
          "The automatic submission needs attention. Please contact the instructor.",
      );
      return;
    }
    const submittedResult = response.result || {
      rollNumber,
      section,
      testName,
      testId,
      totalQuestions,
      resultReleased: Boolean(response.resultReleased),
    };
    submittedResult.resultReleased = Boolean(
      response.resultReleased ?? submittedResult.resultReleased,
    );
    setResult(submittedResult);
    setPage("result");
  };
  const handleLogout = () => {
    setPage("login");
    setRollNumber("");
    setSection("");
    setTestId("");
    setTestName("");
    setSubject("");
    setTotalQuestions(0);
    setMarksPerQuestion(1);
    setExpiresAt("");
    setSessionId("");
    setFullscreenRequired(false);
    setMaxFullscreenExits(3);
    setQuestions([]);
    setResult(null);
    setAppError("");
    sessionStorage.removeItem("assessment_session_id");
  };
  return (
    <>
      {appError && page !== "login" && (
        <div className="app-error-banner" role="alert">
          <span>{appError}</span>
          <button
            type="button"
            onClick={() => setAppError("")}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}
      {page === "login" && (
        <LoginPage
          onLogin={async (roll, sec, id) => {
            try {
              await handleLogin(roll, sec, id);
            } catch (e) {
              setAppError(
                e instanceof Error ? e.message : "Unable to continue.",
              );
              throw e;
            }
          }}
        />
      )}
      {page === "instructions" && (
        <InstructionsPage
          rollNumber={rollNumber}
          section={section}
          testName={testName}
          subject={subject}
          totalQuestions={totalQuestions}
          marksPerQuestion={marksPerQuestion}
          testId={testId}
          fullscreenRequired={fullscreenRequired}
          onStart={async (fullscreenEntered, deviceType) => {
            try {
              await handleStartTest(fullscreenEntered, deviceType);
            } catch (e) {
              setAppError(e instanceof Error ? e.message : "Unable to start.");
              throw e;
            }
          }}
          onLogout={handleLogout}
        />
      )}
      {page === "test" && (
        <TestPage
          rollNumber={rollNumber}
          section={section}
          testId={testId}
          testName={testName}
          subject={subject}
          questions={questions}
          marksPerQuestion={marksPerQuestion}
          expiresAt={expiresAt}
          sessionId={sessionId}
          fullscreenRequired={fullscreenRequired}
          maxFullscreenExits={maxFullscreenExits}
          onSubmit={handleSubmit}
          onAutoSubmitted={handleServerAutoSubmitted}
        />
      )}
      {page === "result" && result && (
        <ResultPage result={result} onFinish={handleLogout} />
      )}
    </>
  );
}
