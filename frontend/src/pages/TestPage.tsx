import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Clock3,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { sendAuditEvent } from "../services/api";
import type {
  StudentAnswer,
  TestQuestion,
} from "../types/test";

interface TestPageProps {
  rollNumber: string;
  section: string;
  testId: string;
  testName: string;
  subject: string;
  questions: TestQuestion[];
  marksPerQuestion: number;
  expiresAt?: string;
  onSubmit: (answers: StudentAnswer[]) => Promise<void>;
}

function TestPage({
  rollNumber,
  section,
  testId,
  testName,
  subject,
  questions,
  marksPerQuestion,
  expiresAt,
  onSubmit,
}: TestPageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});

  const [markedForReview, setMarkedForReview] =
    useState<Record<string, boolean>>({});

  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const autoSubmitStarted = useRef(false);

  const [showSubmitModal, setShowSubmitModal] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const currentQuestion =
    questions[currentIndex];

  const attempted = useMemo(() => {
    return questions.filter(
      (question) =>
        Boolean(answers[question.id])
    ).length;
  }, [answers, questions]);

  const unanswered =
    questions.length - attempted;

  const reviewCount = questions.filter((question) => markedForReview[question.id]).length;

  const formatTime = (totalSeconds: number) => {
    const safe = Math.max(0, totalSeconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    return hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!expiresAt) return;
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    };
    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiresAt]);

  useEffect(() => {
    const logVisibility = () => {
      const event = document.visibilityState === "hidden" ? "TAB_HIDDEN" : "TAB_VISIBLE";
      void sendAuditEvent({ testId, rollNumber, section, event, detail: "Page visibility changed" }).catch(() => undefined);
    };
    document.addEventListener("visibilitychange", logVisibility);
    return () => document.removeEventListener("visibilitychange", logVisibility);
  }, [testId, rollNumber, section]);

  useEffect(() => {
    if (secondsRemaining !== 0 || autoSubmitStarted.current || submitting) return;
    autoSubmitStarted.current = true;
    void handleSubmit();
  }, [secondsRemaining, submitting]);

  const progressPercentage =
    questions.length > 0
      ? ((currentIndex + 1) /
          questions.length) *
        100
      : 0;

  const answeredPercentage =
    questions.length > 0
      ? (attempted / questions.length) * 100
      : 0;

  const handleSelectOption = (
    optionKey: string
  ) => {
    if (!currentQuestion || submitting) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionKey,
    }));
  };

  const clearCurrentResponse = () => {
    if (!currentQuestion || submitting) return;
    setAnswers((previous) => {
      const next = { ...previous };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const toggleCurrentReview = () => {
    if (!currentQuestion || submitting) return;
    setMarkedForReview((previous) => ({
      ...previous,
      [currentQuestion.id]: !previous[currentQuestion.id],
    }));
  };

  const goPrevious = () => {
    if (
      currentIndex > 0 &&
      !submitting
    ) {
      setCurrentIndex(
        (index) => index - 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const goNext = () => {
    if (
      currentIndex <
        questions.length - 1 &&
      !submitting
    ) {
      setCurrentIndex(
        (index) => index + 1
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  const goToQuestion = (
    index: number
  ) => {
    if (submitting) {
      return;
    }

    setCurrentIndex(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openSubmitModal = () => {
    setSubmitError("");
    setShowSubmitModal(true);
  };

  const closeSubmitModal = () => {
    if (submitting) {
      return;
    }

    setSubmitError("");
    setShowSubmitModal(false);
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
      <div className="premium-test-page">
        <div className="premium-test-empty">
          <div className="premium-empty-icon">
            <FileCheck2
              size={26}
              strokeWidth={1.4}
            />
          </div>

          <span>
            ASSESSMENT ERROR
          </span>

          <h2>
            No Questions Available
          </h2>

          <p>
            The assessment questions could not
            be loaded. Please contact the
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-test-page">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="premium-test-header">

        <div className="premium-test-brand">

          <div className="premium-test-brand-mark">
            <span />
            <span />
            <span />
          </div>

          <div>
            <span className="premium-test-brand-small">
              ONLINE ASSESSMENT
            </span>

            <strong>
              {testName}
            </strong>

            {subject && (
              <span className="premium-test-subject">
                {subject}
              </span>
            )}
          </div>

        </div>

        <div className={`exam-timer ${secondsRemaining !== null && secondsRemaining <= 300 ? "is-warning" : ""}`} aria-live="polite">
          <Clock3 size={17} />
          <span>TIME LEFT</span>
          <strong>{secondsRemaining === null ? "--:--" : formatTime(secondsRemaining)}</strong>
        </div>

        <div className="premium-test-student">

          <div>
            <span>
              ROLL NUMBER
            </span>

            <strong>
              {rollNumber}
            </strong>
          </div>

          <div className="premium-test-student-divider" />

          <div>
            <span>
              SECTION
            </span>

            <strong>
              {section}
            </strong>
          </div>

        </div>

      </header>

      {/* =================================================
          EXAM BODY
      ================================================== */}

      <main className="premium-test-main">

        {/* =================================================
            LEFT / QUESTION
        ================================================== */}

        <section className="premium-test-question-column">

          {/* Progress header */}

          <div className="premium-test-progress">

            <div className="premium-progress-meta">

              <div>
                <span>
                  QUESTION
                </span>

                <strong>
                  {String(
                    currentIndex + 1
                  ).padStart(2, "0")}
                  <em>
                    {" "}
                    /{" "}
                    {String(
                      questions.length
                    ).padStart(2, "0")}
                  </em>
                </strong>
              </div>

              <div className="premium-progress-answered">
                <span>
                  ANSWERED
                </span>

                <strong>
                  {attempted}
                  <em>
                    {" "}
                    /{" "}
                    {questions.length}
                  </em>
                </strong>
              </div>

            </div>

            <div className="premium-progress-track">
              <div
                className="premium-progress-position"
                style={{
                  width: `${progressPercentage}%`,
                }}
              />

              <div
                className="premium-progress-answered-fill"
                style={{
                  width: `${answeredPercentage}%`,
                }}
              />
            </div>

          </div>

          {/* Question */}

          <article className="premium-question-card">

            <div className="premium-question-top">

              <div className="premium-question-index">
                <span>
                  QUESTION
                </span>

                <strong>
                  {String(
                    currentIndex + 1
                  ).padStart(2, "0")}
                </strong>
              </div>

              <div className="exam-question-actions">
                <button type="button" className={`exam-review-toggle ${markedForReview[currentQuestion.id] ? "is-marked" : ""}`} onClick={toggleCurrentReview} disabled={submitting} aria-pressed={Boolean(markedForReview[currentQuestion.id])}>
                  <Bookmark size={15} />
                  {markedForReview[currentQuestion.id] ? "Marked for review" : "Mark for review"}
                </button>
                <button type="button" className="exam-clear-answer" onClick={clearCurrentResponse} disabled={!answers[currentQuestion.id] || submitting}>
                  <RotateCcw size={14} /> Clear response
                </button>
              </div>

              <div className="premium-question-marks">
                {marksPerQuestion}{" "}
                {marksPerQuestion === 1
                  ? "MARK"
                  : "MARKS"}
              </div>

            </div>

            <div className="premium-question-body">

              <h1>
                {currentQuestion.question}
              </h1>

              <p className="premium-select-label">
                SELECT ONE ANSWER
              </p>

              <div className="premium-options">

                {currentQuestion.options.map(
                  (option, index) => {
                    const selected =
                      answers[
                        currentQuestion.id
                      ] === option.key;

                    return (
                      <button
                        key={option.key}
                        type="button"
                        className={`premium-option ${
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

                        <span className="premium-option-number">
                          {String(
                            index + 1
                          ).padStart(2, "0")}
                        </span>

                        <span className="premium-option-key">
                          {option.key}
                        </span>

                        <span className="premium-option-text">
                          {option.text}
                        </span>

                        <span className="premium-option-indicator">
                          {selected ? (
                            <Check
                              size={17}
                              strokeWidth={2}
                            />
                          ) : null}
                        </span>

                      </button>
                    );
                  }
                )}

              </div>

            </div>

          </article>

          {/* Navigation */}

          <div className="premium-question-navigation">

            <button
              type="button"
              className="premium-nav-back"
              onClick={goPrevious}
              disabled={
                currentIndex === 0 ||
                submitting
              }
            >
              <ChevronLeft
                size={17}
              />

              <span>
                Previous
              </span>
            </button>

            <div className="premium-nav-position">
              {currentIndex + 1}
              <span>
                /
              </span>
              {questions.length}
            </div>

            {currentIndex <
            questions.length - 1 ? (
              <button
                type="button"
                className="premium-nav-next"
                onClick={goNext}
                disabled={submitting}
              >
                <span>
                  Save & Next
                </span>

                <ChevronRight
                  size={17}
                />
              </button>
            ) : (
              <button
                type="button"
                className="premium-nav-submit"
                onClick={openSubmitModal}
                disabled={submitting}
              >
                <span>
                  Submit Assessment
                </span>

                <ArrowRight
                  size={17}
                />
              </button>
            )}

          </div>

        </section>

        {/* =================================================
            RIGHT / NAVIGATOR
        ================================================== */}

        <aside className="premium-test-sidebar">

          <div className="premium-navigator">

            <div className="premium-navigator-heading">

              <div>
                <span>
                  NAVIGATION
                </span>

                <h2>
                  Questions
                </h2>
              </div>

              <div className="premium-navigator-count">
                {attempted}
                <span>
                  /
                </span>
                {questions.length}
              </div>

            </div>

            {/* completion */}

            <div className="premium-completion">

              <div className="premium-completion-top">
                <span>
                  COMPLETION
                </span>

                <strong>
                  {Math.round(
                    answeredPercentage
                  )}
                  %
                </strong>
              </div>

              <div className="premium-completion-track">
                <div
                  style={{
                    width: `${answeredPercentage}%`,
                  }}
                />
              </div>

            </div>

            {/* Question grid */}

            <div className="premium-question-grid">

              {questions.map(
                (question, index) => {
                  const answered =
                    Boolean(
                      answers[
                        question.id
                      ]
                    );

                  const current =
                    index === currentIndex;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={[
                        "premium-question-number",
                        answered
                          ? "answered"
                          : "",
                        markedForReview[question.id]
                          ? "review-marked"
                          : "",
                        current
                          ? "current"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        goToQuestion(index)
                      }
                      disabled={submitting}
                    >
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </button>
                  );
                }
              )}

            </div>

            {/* Legend */}

            <div className="premium-navigator-legend">

              <div>
                <span className="legend-current" />
                Current
              </div>

              <div>
                <span className="legend-answered" />
                Answered
              </div>

              <div>
                <span className="legend-unanswered" />
                Unanswered
              </div>

              <div>
                <span className="legend-review" />
                Marked for review ({reviewCount})
              </div>

            </div>

            {/* Summary */}

            <div className="premium-navigator-summary">

              <div>
                <span>
                  ATTEMPTED
                </span>

                <strong>
                  {attempted}
                </strong>
              </div>

              <div>
                <span>
                  REMAINING
                </span>

                <strong>
                  {unanswered}
                </strong>
              </div>

              <div>
                <span>
                  MAX MARKS
                </span>

                <strong>
                  {questions.length *
                    marksPerQuestion}
                </strong>
              </div>

            </div>

            <div className="premium-secure-note">

              <ShieldCheck
                size={16}
                strokeWidth={1.5}
              />

              <span>
                Answers are securely recorded
                on submission.
              </span>

            </div>

          </div>

        </aside>

      </main>

      {/* =================================================
          SUBMIT MODAL
      ================================================== */}

      {showSubmitModal && (
        <div
          className="premium-submit-overlay"
          role="dialog"
          aria-modal="true"
        >

          <div className="premium-submit-modal">

            <div className="premium-submit-icon">
              <CircleHelp
                size={26}
                strokeWidth={1.3}
              />
            </div>

            <span className="premium-submit-overline">
              FINAL CONFIRMATION
            </span>

            <h2>
              Submit assessment?
            </h2>

            <p>
              Please review your answers before
              continuing. Once submitted, your
              assessment will be recorded and
              cannot be attempted again.
            </p>

            <div className="premium-submit-summary">

              <div>
                <span>
                  QUESTIONS
                </span>

                <strong>
                  {questions.length}
                </strong>
              </div>

              <div>
                <span>
                  ANSWERED
                </span>

                <strong>
                  {attempted}
                </strong>
              </div>

              <div>
                <span>
                  UNANSWERED
                </span>

                <strong>
                  {unanswered}
                </strong>
              </div>

              <div>
                <span>
                  REVIEW
                </span>

                <strong>
                  {reviewCount}
                </strong>
              </div>

            </div>

            {unanswered > 0 && (
              <div className="premium-submit-warning">
                <strong>
                  {unanswered}{" "}
                  {unanswered === 1
                    ? "question remains"
                    : "questions remain"}{" "}
                  unanswered.
                </strong>

                <span>
                  You may return and review
                  your answers before submitting.
                </span>
              </div>
            )}

            {submitError && (
              <div className="premium-submit-error">
                <strong>
                  Submission failed
                </strong>

                <span>
                  {submitError}
                </span>
              </div>
            )}

            <div className="premium-submit-actions">

              <button
                type="button"
                className="premium-review-button"
                onClick={closeSubmitModal}
                disabled={submitting}
              >
                <ArrowLeft
                  size={16}
                />

                Review Answers
              </button>

              <button
                type="button"
                className="premium-confirm-button"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="premium-button-spinner" />

                    Submitting...
                  </>
                ) : (
                  <>
                    Confirm Submission

                    <ArrowRight
                      size={16}
                    />
                  </>
                )}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default TestPage;