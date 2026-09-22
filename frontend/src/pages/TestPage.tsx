import { useMemo, useState } from "react";

import type {
  StudentAnswer,
  TestQuestion,
} from "../types/test";

interface TestPageProps {
  rollNumber: string;
  section: string;
  testName: string;
  subject: string;
  questions: TestQuestion[];
  marksPerQuestion: number;
  onSubmit: (answers: StudentAnswer[]) => Promise<void>;
}

function TestPage({
  rollNumber,
  section,
  testName,
  subject,
  questions,
  marksPerQuestion,
  onSubmit,
}: TestPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});

  const [showSubmitModal, setShowSubmitModal] =
    useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const currentQuestion = questions[currentIndex];

  const attempted = useMemo(() => {
    return questions.filter(
      (question) => answers[question.id]
    ).length;
  }, [answers, questions]);

  const unanswered = questions.length - attempted;

  const handleSelectOption = (optionKey: string) => {
    if (!currentQuestion || submitting) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionKey,
    }));
  };

  const goPrevious = () => {
    if (currentIndex > 0 && !submitting) {
      setCurrentIndex((index) => index - 1);
    }
  };

  const goNext = () => {
    if (
      currentIndex < questions.length - 1 &&
      !submitting
    ) {
      setCurrentIndex((index) => index + 1);
    }
  };

  const goToQuestion = (index: number) => {
    if (!submitting) {
      setCurrentIndex(index);
    }
  };

  const openSubmitModal = () => {
    setSubmitError("");
    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    if (!submitting) {
      setSubmitError("");
      setShowSubmitModal(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const submission: StudentAnswer[] =
        questions.map((question) => ({
          questionId: question.id,
          selectedOption:
            answers[question.id] || "",
        }));

      await onSubmit(submission);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to submit the test.";

      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="test-page">
        <div className="empty-state-card">
          <h2>No Questions Available</h2>
          <p>
            The test questions could not be loaded.
            Please contact the administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="test-page">
      {/* =========================
          TEST HEADER
      ========================== */}

      <header className="test-header">
        <div className="test-header-left">
          <div className="test-header-title">
            <span className="institution-label">
              ONLINE ASSESSMENT
            </span>

            <h1>{testName}</h1>

            {subject && (
              <p>{subject}</p>
            )}
          </div>
        </div>

        <div className="test-student-info">
          <div>
            <span>Roll Number</span>
            <strong>{rollNumber}</strong>
          </div>

          <div>
            <span>Section</span>
            <strong>{section}</strong>
          </div>
        </div>
      </header>

      {/* =========================
          TEST CONTENT
      ========================== */}

      <main className="test-content">
        <div className="test-main-column">
          {/* Progress */}

          <div className="test-progress-card">
            <div className="test-progress-top">
              <span>
                Question {currentIndex + 1} of{" "}
                {questions.length}
              </span>

              <span>
                {attempted} / {questions.length} Answered
              </span>
            </div>

            <div className="test-progress-track">
              <div
                className="test-progress-fill"
                style={{
                  width: `${
                    ((currentIndex + 1) /
                      questions.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {/* Question */}

          <section className="question-card">
            <div className="question-number">
              Question {currentIndex + 1}
            </div>

            <h2 className="question-text">
              {currentQuestion.question}
            </h2>

            <div className="options-list">
              {currentQuestion.options.map(
                (option) => {
                  const selected =
                    answers[currentQuestion.id] ===
                    option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      className={`option-button ${
                        selected
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        handleSelectOption(
                          option.key
                        )
                      }
                      disabled={submitting}
                    >
                      <span className="option-key">
                        {option.key}
                      </span>

                      <span className="option-text">
                        {option.text}
                      </span>

                      {selected && (
                        <span className="option-check">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* Navigation */}

          <div className="question-navigation">
            <button
              type="button"
              className="secondary-button"
              onClick={goPrevious}
              disabled={
                currentIndex === 0 || submitting
              }
            >
              ← Previous
            </button>

            {currentIndex <
            questions.length - 1 ? (
              <button
                type="button"
                className="primary-button"
                onClick={goNext}
                disabled={submitting}
              >
                Save & Next →
              </button>
            ) : (
              <button
                type="button"
                className="submit-button"
                onClick={openSubmitModal}
                disabled={submitting}
              >
                Submit Test
              </button>
            )}
          </div>
        </div>

        {/* =========================
            QUESTION NAVIGATOR
        ========================== */}

        <aside className="question-sidebar">
          <div className="navigator-card">
            <div className="navigator-header">
              <h3>Questions</h3>

              <span>
                {attempted}/{questions.length}
              </span>
            </div>

            <div className="question-grid">
              {questions.map(
                (question, index) => {
                  const answered =
                    Boolean(answers[question.id]);

                  const current =
                    index === currentIndex;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={[
                        "question-number-button",
                        answered
                          ? "answered"
                          : "unanswered",
                        current ? "current" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        goToQuestion(index)
                      }
                      disabled={submitting}
                    >
                      {index + 1}
                    </button>
                  );
                }
              )}
            </div>

            <div className="navigator-legend">
              <div>
                <span className="legend-box answered" />
                Answered
              </div>

              <div>
                <span className="legend-box unanswered" />
                Unanswered
              </div>

              <div>
                <span className="legend-box current" />
                Current
              </div>
            </div>

            <div className="navigator-summary">
              <div>
                <span>Attempted</span>
                <strong>{attempted}</strong>
              </div>

              <div>
                <span>Unanswered</span>
                <strong>{unanswered}</strong>
              </div>

              <div>
                <span>Total Marks</span>
                <strong>
                  {questions.length *
                    marksPerQuestion}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* =========================
          SUBMIT MODAL
      ========================== */}

      {showSubmitModal && (
        <div className="modal-overlay">
          <div className="submit-modal">
            <div className="modal-icon">?</div>

            <h2>Submit Test?</h2>

            <p>
              Please review your answers before
              submitting. You will not be able to
              attempt the test again after submission.
            </p>

            <div className="submit-summary">
              <div>
                <span>Total Questions</span>
                <strong>{questions.length}</strong>
              </div>

              <div>
                <span>Attempted</span>
                <strong>{attempted}</strong>
              </div>

              <div>
                <span>Unanswered</span>
                <strong>{unanswered}</strong>
              </div>
            </div>

            {submitError && (
              <div className="submit-error">
                <strong>Submission failed</strong>
                <span>{submitError}</span>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeSubmitModal}
                disabled={submitting}
              >
                Review Answers
              </button>

              <button
                type="button"
                className="submit-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Confirm Submission"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestPage;