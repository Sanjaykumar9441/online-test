import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ClipboardList,
  FileQuestion,
  Loader2,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useState } from "react";
import { detectDeviceType, type DeviceType } from "../services/device";
import { sendAuditEvent } from "../services/api";

interface InstructionsPageProps {
  rollNumber: string;
  section: string;
  testId: string;
  testName: string;
  subject: string;
  totalQuestions: number;
  marksPerQuestion: number;
  fullscreenRequired: boolean;
  onStart: (fullscreenEntered: boolean, deviceType: DeviceType) => void | Promise<void>;
  onLogout: () => void;
}

function InstructionsPage({
  rollNumber,
  section,
  testId,
  testName,
  subject,
  totalQuestions,
  marksPerQuestion,
  fullscreenRequired,
  onStart,
  onLogout,
}: InstructionsPageProps) {
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const deviceType = detectDeviceType();
  const deviceBlocked = fullscreenRequired && deviceType !== "desktop";

  const maximumMarks =
    totalQuestions * marksPerQuestion;

  const handleStart = async () => {
    if (starting || totalQuestions <= 0) {
      return;
    }

    setStarting(true);
    setStartError("");

    try {
      let fullscreenEntered = false;
      if (fullscreenRequired) {
        if (deviceType !== "desktop") throw new Error("This examination requires a desktop or laptop in full-screen mode.");
        if (!(document.documentElement.requestFullscreen)) throw new Error("Your browser does not support full-screen mode. Please use the latest Chrome, Edge, or Firefox on a desktop or laptop.");
        try { await document.documentElement.requestFullscreen(); } catch { throw new Error("Full-screen mode could not be enabled. Allow full-screen access in your browser and try again."); }
        fullscreenEntered = Boolean(document.fullscreenElement);
        if (!fullscreenEntered) throw new Error("Full-screen mode is required before this examination can start.");
        await sendAuditEvent({ testId, rollNumber, section, event: "FULLSCREEN_ENTERED", detail: "Student entered full-screen before starting", deviceType });
      }
      await onStart(fullscreenEntered, deviceType);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Unable to start the assessment.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="premium-instructions">

      {/* =================================================
          BACKGROUND
      ================================================== */}

      <div className="instructions-grid-background" />

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="premium-instructions-header">

        <div className="instructions-wordmark">
          <span className="instructions-wordmark-line" />

          <div>
            <span>
              ONLINE
            </span>

            <strong>
              ASSESSMENT
            </strong>
          </div>
        </div>

        <div className="instructions-header-status">
          <span className="instructions-status-dot" />

          <span>
            STUDENT PORTAL
          </span>
        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================== */}

      <div className="premium-instructions-main">

        {/* =================================================
            TITLE / HERO
        ================================================== */}

        <section className="instructions-hero">

          <div className="instructions-hero-number">
            02
          </div>

          <div className="instructions-hero-content">

            <span className="instructions-overline">
              ASSESSMENT BRIEF
            </span>

            <h1>
              {testName ||
                "Online Assessment"}
            </h1>

            {subject && (
              <p className="instructions-subject">
                {subject}
              </p>
            )}

            <p className="instructions-hero-description">
              Review the assessment details and
              instructions carefully before beginning.
              Your answers will be recorded against
              your registered student details.
            </p>

          </div>

          <div className="instructions-hero-mark">
            <ClipboardList
              size={28}
              strokeWidth={1.3}
            />
          </div>

        </section>

        {/* =================================================
            STUDENT DETAILS
        ================================================== */}

        <section className="premium-info-section">

          <div className="premium-section-label">
            <span>
              STUDENT
            </span>

            <span>
              01
            </span>
          </div>

          <div className="student-premium-grid">

            <div className="student-premium-item">
              <span>
                ROLL NUMBER
              </span>

              <strong>
                {rollNumber}
              </strong>
            </div>

            <div className="student-premium-item">
              <span>
                SECTION
              </span>

              <strong>
                {section}
              </strong>
            </div>

            <div className="student-premium-item">
              <span>
                SUBJECT
              </span>

              <strong>
                {subject || "—"}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            ASSESSMENT DETAILS
        ================================================== */}

        <section className="premium-info-section">

          <div className="premium-section-label">
            <span>
              ASSESSMENT AT A GLANCE
            </span>

            <span>
              02
            </span>
          </div>

          <div className="assessment-premium-grid">

            <div className="assessment-premium-item">

              <div className="assessment-icon">
                <FileQuestion
                  size={19}
                  strokeWidth={1.4}
                />
              </div>

              <span>
                QUESTIONS
              </span>

              <strong>
                {totalQuestions}
              </strong>

            </div>

            <div className="assessment-premium-item">

              <div className="assessment-icon">
                <Target
                  size={19}
                  strokeWidth={1.4}
                />
              </div>

              <span>
                MARKS / QUESTION
              </span>

              <strong>
                {marksPerQuestion}
              </strong>

            </div>

            <div className="assessment-premium-item">

              <div className="assessment-icon">
                <ClipboardList
                  size={19}
                  strokeWidth={1.4}
                />
              </div>

              <span>
                MAXIMUM MARKS
              </span>

              <strong>
                {maximumMarks}
              </strong>

            </div>

            <div className="assessment-premium-item">

              <div className="assessment-icon">
                <Check
                  size={19}
                  strokeWidth={1.5}
                />
              </div>

              <span>
                QUESTION TYPE
              </span>

              <strong>
                MCQ
              </strong>

            </div>

          </div>

        </section>

        {/* =================================================
            INSTRUCTIONS
        ================================================== */}

        <section className="premium-info-section instructions-section">

          <div className="premium-section-label">
            <span>
              BEFORE YOU BEGIN
            </span>

            <span>
              03
            </span>
          </div>

          <div className="premium-instructions-list">

            <div className="premium-instruction-item">
              <span className="instruction-number">
                01
              </span>

              <p>
                Read each question carefully before
                selecting an answer.
              </p>
            </div>

            <div className="premium-instruction-item">
              <span className="instruction-number">
                02
              </span>

              <p>
                Each question contains four options
                and exactly one correct answer.
              </p>
            </div>

            <div className="premium-instruction-item">
              <span className="instruction-number">
                03
              </span>

              <p>
                You can change your selected answer
                before submitting the assessment.
              </p>
            </div>

            <div className="premium-instruction-item">
              <span className="instruction-number">
                04
              </span>

              <p>
                Use the question navigator to move
                directly between questions.
              </p>
            </div>

            <div className="premium-instruction-item">
              <span className="instruction-number">
                05
              </span>

              <p>
                Questions that are not answered will
                be recorded as unanswered.
              </p>
            </div>

            <div className="premium-instruction-item">
              <span className="instruction-number">
                06
              </span>

              <p>
                Review your answers carefully before
                submitting the assessment.
              </p>
            </div>

            <div className="premium-instruction-item">
              <span className="instruction-number">
                07
              </span>

              <p>
                Once submitted, the assessment is
                recorded and cannot be attempted again
                unless retesting has been enabled.
              </p>
            </div>

          </div>

        </section>

        {deviceBlocked && <div className="fullscreen-device-block" role="alert"><strong>Desktop or laptop required</strong><p>This examination requires a desktop or laptop in full-screen mode.</p></div>}
        {startError && <div className="fullscreen-device-block" role="alert"><strong>Unable to start examination</strong><p>{startError}</p></div>}

        {/* =================================================
            IMPORTANT NOTICE
        ================================================== */}

        <section className="premium-important-notice">

          <div className="notice-symbol">
            !
          </div>

          <div className="notice-content">

            <span>
              IMPORTANT
            </span>

            <p>
              Please make sure your roll number and
              section are correct before starting.
              Your result will be recorded against
              these registered details.
            </p>

          </div>

          <ShieldCheck
            className="notice-shield"
            size={25}
            strokeWidth={1.3}
          />

        </section>

        {/* =================================================
            ACTIONS
        ================================================== */}

        <div className="premium-instructions-actions">

          <button
            type="button"
            className="instructions-back-button"
            onClick={onLogout}
            disabled={starting}
          >
            <ArrowLeft
              size={17}
              strokeWidth={1.6}
            />

            <span>
              Back to Login
            </span>
          </button>

          <button
            type="button"
            className="instructions-begin-button"
            onClick={handleStart}
            disabled={
              starting ||
              totalQuestions <= 0 ||
              deviceBlocked
            }
          >
            {starting ? (
              <>
                <span>
                  Loading Assessment
                </span>

                <Loader2
                  size={18}
                  className="instructions-spinner"
                />
              </>
            ) : (
              <>
                <span>
                  {fullscreenRequired ? "Enter Full-Screen & Begin" : "Begin Assessment"}
                </span>

                <ArrowUpRight
                  size={19}
                  strokeWidth={1.6}
                />
              </>
            )}
          </button>

        </div>

        {/* =================================================
            FOOTER
        ================================================== */}

        <footer className="premium-instructions-footer">

          <span>
            ONLINE ASSESSMENT SYSTEM
          </span>

          <span>
            SECURE • ACADEMIC • VERIFIED
          </span>

          <span>
            2026
          </span>

        </footer>

      </div>
    </main>
  );
}

export default InstructionsPage;