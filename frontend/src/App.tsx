import { useState } from "react";

import {
  getTestConfig,
  startTest,
  submitTest,
} from "./services/api";

import type {
  TestQuestion,
  TestResult,
} from "./types/test";

import LoginPage from "./pages/LoginPage";
import InstructionsPage from "./pages/InstructionsPage";
import TestPage from "./pages/TestPage";
import ResultPage from "./pages/ResultPage";

import "./App.css";

type Page =
  | "login"
  | "instructions"
  | "test"
  | "result";

function App() {
  const [page, setPage] = useState<Page>("login");

  const [rollNumber, setRollNumber] =
    useState("");

  const [section, setSection] =
    useState("");

  const [testName, setTestName] =
    useState("");

  const [subject, setSubject] =
    useState("");

  const [totalQuestions, setTotalQuestions] =
    useState(0);

  const [marksPerQuestion, setMarksPerQuestion] =
    useState(1);

  const [questions, setQuestions] =
    useState<TestQuestion[]>([]);

  const [result, setResult] =
    useState<TestResult | null>(null);

  const [appError, setAppError] =
    useState("");

  /* =======================================================
     LOGIN
     ======================================================= */

  const handleLogin = async (
    studentRollNumber: string,
    studentSection: string
  ) => {
    setAppError("");

    try {
      const config = await getTestConfig();

      if (!config.success) {
        throw new Error(
          config.message ||
            "Unable to load test configuration."
        );
      }

      /*
       * Do not allow students to continue when
       * the administrator has closed the test.
       */
      if (config.testStatus !== "OPEN") {
        throw new Error(
          "The test is currently closed."
        );
      }

      setRollNumber(
        studentRollNumber.trim().toUpperCase()
      );

      setSection(
        studentSection.trim().toUpperCase()
      );

      setTestName(config.testName || "");

      setSubject(config.subject || "");

      setTotalQuestions(
        Number(config.totalQuestions || 0)
      );

      setMarksPerQuestion(
        Number(config.marksPerQuestion || 1)
      );

      setPage("instructions");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to load the test.";

      setAppError(message);

      throw error;
    }
  };

  /* =======================================================
     START TEST
     ======================================================= */

  const handleStartTest = async () => {
    setAppError("");

    try {
      const response = await startTest(
        rollNumber,
        section
      );

      if (!response.success) {
        if (response.alreadySubmitted) {
          throw new Error(
            "You have already submitted this test."
          );
        }

        if (response.configurationError) {
          throw new Error(
            response.message ||
              "There is a test configuration error."
          );
        }

        throw new Error(
          response.message ||
            "Unable to start the test."
        );
      }

      if (
        !response.questions ||
        response.questions.length === 0
      ) {
        throw new Error(
          "No questions were received from the server."
        );
      }

      setTestName(
        response.testName || testName
      );

      setSubject(
        response.subject || subject
      );

      setTotalQuestions(
        Number(
          response.totalQuestions ||
            response.questions.length
        )
      );

      setMarksPerQuestion(
        Number(
          response.marksPerQuestion ||
            marksPerQuestion
        )
      );

      setQuestions(response.questions);

      setPage("test");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start the test.";

      setAppError(message);

      throw error;
    }
  };

  /* =======================================================
     SUBMIT TEST
     ======================================================= */

  const handleSubmit = async (
    answers: {
      questionId: string;
      selectedOption: string;
    }[]
  ) => {
    setAppError("");

    try {
      const response = await submitTest(
        rollNumber,
        section,
        answers
      );

      if (!response.success) {
        if (response.alreadySubmitted) {
          throw new Error(
            "This test has already been submitted."
          );
        }

        throw new Error(
          response.message ||
            "Unable to submit the test."
        );
      }

      if (!response.result) {
        throw new Error(
          "The server did not return the test result."
        );
      }

      setResult(response.result);

      setPage("result");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit the test.";

      setAppError(message);

      throw error;
    }
  };

  /* =======================================================
     LOGOUT / RETURN
     ======================================================= */

  const handleLogout = () => {
    setPage("login");

    setRollNumber("");
    setSection("");

    setTestName("");
    setSubject("");

    setTotalQuestions(0);
    setMarksPerQuestion(1);

    setQuestions([]);

    setResult(null);

    setAppError("");
  };

  /* =======================================================
     COMMON ERROR BANNER
     ======================================================= */

  const errorBanner =
    appError && page !== "login" ? (
      <div className="app-error-banner">
        <span>{appError}</span>

        <button
          type="button"
          onClick={() => setAppError("")}
          aria-label="Close error"
        >
          ×
        </button>
      </div>
    ) : null;

  /* =======================================================
     PAGE ROUTING
     ======================================================= */

  return (
    <>
      {errorBanner}

      {page === "login" && (
        <LoginPage
          onLogin={handleLogin}
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
          onStart={handleStartTest}
          onLogout={handleLogout}
        />
      )}

      {page === "test" && (
        <TestPage
          rollNumber={rollNumber}
          section={section}
          testName={testName}
          subject={subject}
          questions={questions}
          marksPerQuestion={marksPerQuestion}
          onSubmit={handleSubmit}
        />
      )}

      {page === "result" && result && (
        <ResultPage
          result={result}
          onFinish={handleLogout}
        />
      )}
    </>
  );
}

export default App;