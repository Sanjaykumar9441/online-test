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

import { registerFullscreenExit, sendAuditEvent } from "../services/api";
import { detectDeviceType } from "../services/device";
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
  sessionId: string;
  fullscreenRequired: boolean;
  maxFullscreenExits: number;
  onSubmit: (answers: StudentAnswer[], automatic?: boolean) => Promise<void>;
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
  sessionId,
  fullscreenRequired,
  maxFullscreenExits,
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
  const submitHandlerRef = useRef<(automatic?: boolean) => Promise<void>>(async () => undefined);
  const wasFullscreenRef = useRef(Boolean(document.fullscreenElement));
  const exitRequestInFlight = useRef(false);
  // A single exit is counted until the student has restored full-screen and acknowledged the warning.
  const allowExitCountingRef = useRef(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [fullscreenWarning, setFullscreenWarning] = useState("");
  const [fullscreenLocked, setFullscreenLocked] = useState(false);
  const [fullscreenAcknowledgementRequired, setFullscreenAcknowledgementRequired] = useState(false);
  const [returningFullscreen, setReturningFullscreen] = useState(false);
  const hasExitedFullscreenRef = useRef(false);

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
    const deviceType = detectDeviceType();
    const log = (event: string, detail: string) => {
      void sendAuditEvent({ testId, rollNumber, section, sessionId, deviceType, event, detail }).catch(() => undefined);
    };
    const logVisibility = () => log(document.visibilityState === "hidden" ? "TAB_HIDDEN" : "TAB_VISIBLE", "Document visibility changed to " + document.visibilityState);
    const onBlur = () => log("WINDOW_BLUR", "Assessment window lost focus");
    const onFocus = () => log("WINDOW_FOCUS", "Assessment window regained focus");
    const onPageHide = () => log("PAGE_HIDE_OR_MINIMIZE", "Page hide or browser minimize signal");
    document.addEventListener("visibilitychange", logVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    window.addEventListener("pagehide", onPageHide);
    log("DEVICE_TYPE_DETECTED", "Client classified device as " + deviceType);
    return () => {
      document.removeEventListener("visibilitychange", logVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [testId, rollNumber, section, sessionId]);

  useEffect(() => {
    if (!fullscreenRequired) return;
    wasFullscreenRef.current = Boolean(document.fullscreenElement);
    const onFullscreenChange = async () => {
      const isFullscreen = Boolean(document.fullscreenElement);
      if (isFullscreen) {
        const returningAfterExit = hasExitedFullscreenRef.current;
        wasFullscreenRef.current = true;
        void sendAuditEvent({ testId, rollNumber, section, sessionId, deviceType: detectDeviceType(), event: "FULLSCREEN_ENTERED", detail: returningAfterExit ? "Full-screen mode restored after exit" : "Full-screen mode entered" }).catch(() => undefined);
        if (returningAfterExit && fullscreenRequired) {
          setFullscreenLocked(true);
          setFullscreenAcknowledgementRequired(true);
          setFullscreenWarning("You returned to full-screen. Acknowledge this warning before continuing your examination.");
          void sendAuditEvent({ testId, rollNumber, section, sessionId, deviceType: detectDeviceType(), event: "FULLSCREEN_RESTORED_ACK_REQUIRED", detail: "Student must acknowledge the full-screen exit warning" }).catch(() => undefined);
        }
        return;
      }
      if (!wasFullscreenRef.current) return;
      wasFullscreenRef.current = false;
      // Ignore fullscreenchange duplicates or another exit while the first warning is still active.
      // A new exit can be counted only after the student restores fullscreen and acknowledges it.
      if (!allowExitCountingRef.current || exitRequestInFlight.current || fullscreenLocked) return;
      allowExitCountingRef.current = false;
      hasExitedFullscreenRef.current = true;
      setFullscreenLocked(true);
      setFullscreenAcknowledgementRequired(false);
      setFullscreenWarning("Full-screen mode was exited. The examination is paused until you return to full-screen and acknowledge the warning.");
      exitRequestInFlight.current = true;
      try {
        const eventId = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const response = await registerFullscreenExit({ testId, rollNumber, section, sessionId, deviceType: detectDeviceType(), eventId });
        if (response.success) {
          const count = Number(response.exitCount || 0);
          setFullscreenExitCount(count);
          setFullscreenWarning(`Warning ${count} of ${response.maxFullscreenExits || maxFullscreenExits}: full-screen mode was exited. Return to full-screen immediately.`);
          if (response.autoSubmit && !autoSubmitStarted.current) {
            autoSubmitStarted.current = true;
            setFullscreenLocked(true);
            setFullscreenAcknowledgementRequired(false);
            setFullscreenWarning("The configured full-screen exit limit has been reached. Your assessment is being submitted automatically.");
            void sendAuditEvent({ testId, rollNumber, section, sessionId, deviceType: detectDeviceType(), event: "AUTO_SUBMISSION_REQUESTED", detail: "Server reported that the full-screen exit limit was reached" }).catch(() => undefined);
            await submitHandlerRef.current(true);
          }
        } else {
          setFullscreenWarning(response.message || "Full-screen exit could not be recorded. Re-enter full-screen and contact your instructor if this continues.");
        }
      } catch {
        setFullscreenWarning("Full-screen exit could not be recorded because the server is unavailable. Return to full-screen and check your connection.");
      } finally {
        exitRequestInFlight.current = false;
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [fullscreenRequired, testId, rollNumber, section, sessionId, maxFullscreenExits, fullscreenLocked]);

  useEffect(() => {
    if (!fullscreenRequired || !fullscreenLocked) return;
    const blockExamShortcuts = (event: KeyboardEvent) => {
      // Keep keyboard focus usable inside the blocking overlay, but stop exam shortcuts.
      if (event.key === "Tab") return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("keydown", blockExamShortcuts, true);
    return () => document.removeEventListener("keydown", blockExamShortcuts, true);
  }, [fullscreenRequired, fullscreenLocked]);

  const acknowledgeFullscreenWarning = () => {
    if (!fullscreenRequired || !document.fullscreenElement || !fullscreenAcknowledgementRequired || submitting) return;
    setFullscreenAcknowledgementRequired(false);
    setFullscreenLocked(false);
    setFullscreenWarning("");
    // Only now may a subsequent, genuine fullscreen exit increment the count.
    allowExitCountingRef.current = true;
    hasExitedFullscreenRef.current = false;
    void sendAuditEvent({ testId, rollNumber, section, sessionId, deviceType: detectDeviceType(), event: "FULLSCREEN_WARNING_ACKNOWLEDGED", detail: "Student acknowledged the full-screen exit warning" }).catch(() => undefined);
  };

  const returnToFullscreen = async () => {
    if (!fullscreenRequired || returningFullscreen) return;
    setReturningFullscreen(true);
    try {
      if (!document.documentElement.requestFullscreen) {
        setFullscreenWarning("Full-screen mode is not supported by this browser. Please use the latest Chrome, Edge, or Firefox on a desktop or laptop.");
        return;
      }
      await document.documentElement.requestFullscreen();
      if (!document.fullscreenElement) setFullscreenWarning("Full-screen mode could not be restored. Use the browser's full-screen permission and try again.");
    } catch {
      setFullscreenWarning("Select the button again to restore full-screen mode, or use a supported desktop browser.");
    } finally {
      setReturningFullscreen(false);
    }
  };

  useEffect(() => {
    if (secondsRemaining !== 0 || autoSubmitStarted.current || submitting) return;
    autoSubmitStarted.current = true;
    void handleSubmit(true);
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

  const handleSubmit = async (automatic = false) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    if (automatic) setShowSubmitModal(false);

    try {
      const submission: StudentAnswer[] =
        questions.map((question) => ({
          questionId: question.id,
          selectedOption:
            answers[question.id] || "",
        }));

      await onSubmit(submission, automatic);
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
  submitHandlerRef.current = handleSubmit;

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
      {fullscreenRequired && fullscreenLocked && (
        <div className="fullscreen-lock-overlay" role="alertdialog" aria-modal="true" aria-labelledby="fullscreen-lock-title" aria-describedby="fullscreen-lock-description">
          <section className="fullscreen-lock-card">
            <div className="fullscreen-lock-icon" aria-hidden="true">!</div>
            <span className="fullscreen-lock-eyebrow">EXAMINATION PAUSED</span>
            <h2 id="fullscreen-lock-title">Full-screen mode required</h2>
            <p id="fullscreen-lock-description">{fullscreenWarning || "Return to full-screen mode to continue your examination."}</p>
            <div className="fullscreen-lock-count">Recorded exits: <strong>{fullscreenExitCount} / {maxFullscreenExits}</strong></div>
            {!document.fullscreenElement ? (
              <button type="button" onClick={returnToFullscreen} disabled={returningFullscreen || submitting}>
                {returningFullscreen ? "Restoring full-screen…" : "Return to full-screen"}
              </button>
            ) : fullscreenAcknowledgementRequired ? (
              <button type="button" onClick={acknowledgeFullscreenWarning} disabled={submitting}>
                I understand, continue examination
              </button>
            ) : (
              <p className="fullscreen-lock-status">Please wait while the exit event is verified.</p>
            )}
            {submitError && <p className="fullscreen-lock-error" role="alert">{submitError}</p>}
            {submitting && <p className="fullscreen-lock-status">Submitting your examination…</p>}
          </section>
        </div>
      )}

      <div inert={fullscreenRequired && fullscreenLocked ? true : undefined} aria-hidden={fullscreenRequired && fullscreenLocked ? true : undefined}>
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
                onClick={() => void handleSubmit()}
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
    </div>
  );
}

export default TestPage;