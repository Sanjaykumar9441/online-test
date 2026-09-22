import { useState } from "react";

interface InstructionsPageProps {
  rollNumber: string;
  section: string;
  testName: string;
  subject: string;
  totalQuestions: number;
  marksPerQuestion: number;
  onStart: () => void | Promise<void>;
  onLogout: () => void;
}

function InstructionsPage({
  rollNumber,
  section,
  testName,
  subject,
  totalQuestions,
  marksPerQuestion,
  onStart,
  onLogout,
}: InstructionsPageProps) {
  const [starting, setStarting] = useState(false);

  const maximumMarks =
    totalQuestions * marksPerQuestion;

  const handleStart = async () => {
    if (starting || totalQuestions <= 0) {
      return;
    }

    setStarting(true);

    try {
      await onStart();
    } catch {
      /*
       * App.tsx normally handles the error.
       * Keep this catch so a rejected promise
       * does not create an unhandled rejection.
       */
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="instructions-page">
      <div className="instructions-container">
        <header className="instructions-header">
          <div>
            <span className="instructions-kicker">
              ONLINE ASSESSMENT
            </span>

            <h1>
              {testName || "Online Assessment"}
            </h1>

            {subject && <p>{subject}</p>}
          </div>

          <button
            type="button"
            className="instructions-logout"
            onClick={onLogout}
            disabled={starting}
          >
            Back
          </button>
        </header>

        <section className="student-info-card">
          <div className="section-heading">
            <h2>Student Information</h2>
          </div>

          <div className="student-info-grid">
            <div>
              <span>Roll Number</span>
              <strong>{rollNumber}</strong>
            </div>

            <div>
              <span>Section</span>
              <strong>{section}</strong>
            </div>

            <div>
              <span>Subject</span>
              <strong>{subject || "—"}</strong>
            </div>
          </div>
        </section>

        <section className="assessment-details-card">
          <div className="section-heading">
            <h2>Assessment Details</h2>
          </div>

          <div className="assessment-details-grid">
            <div className="assessment-detail">
              <span>Total Questions</span>
              <strong>{totalQuestions}</strong>
            </div>

            <div className="assessment-detail">
              <span>Marks per Question</span>
              <strong>{marksPerQuestion}</strong>
            </div>

            <div className="assessment-detail">
              <span>Maximum Marks</span>
              <strong>{maximumMarks}</strong>
            </div>

            <div className="assessment-detail">
              <span>Question Type</span>
              <strong>MCQ</strong>
            </div>
          </div>
        </section>

        <section className="instructions-card">
          <div className="section-heading">
            <h2>Instructions</h2>
          </div>

          <ol className="instructions-list">
            <li>
              Read each question carefully before
              selecting an answer.
            </li>

            <li>
              Each question has four options and
              exactly one correct answer.
            </li>

            <li>
              Select the option you consider correct.
              You can change your answer before
              submitting the test.
            </li>

            <li>
              Use the question navigator to move
              directly between questions.
            </li>

            <li>
              Questions that have not been answered
              will be recorded as unanswered.
            </li>

            <li>
              Review your answers carefully before
              submitting the assessment.
            </li>

            <li>
              Once the test is submitted, the
              submission is recorded and cannot be
              attempted again unless retesting has
              been enabled by the administrator.
            </li>
          </ol>
        </section>

        <section className="instructions-notice">
          <div className="notice-title">
            Important Notice
          </div>

          <p>
            Please make sure that your roll number
            and section are correct before starting
            the assessment. Your result will be
            recorded against these details.
          </p>
        </section>

        <div className="instructions-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onLogout}
            disabled={starting}
          >
            Back
          </button>

          <button
            type="button"
            className="primary-button instructions-start-button"
            onClick={handleStart}
            disabled={
              starting || totalQuestions <= 0
            }
          >
            {starting ? (
              <>
                <span className="button-spinner" />
                Loading Test...
              </>
            ) : (
              "Start Test"
            )}
          </button>
        </div>

        <footer className="instructions-footer">
          <span>Online Assessment System</span>

          <span>Authorized Student Access</span>
        </footer>
      </div>
    </div>
  );
}

export default InstructionsPage;