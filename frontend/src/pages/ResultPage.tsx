import {
  ArrowRight,
  Check,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

import type { TestResult } from "../types/test";

interface ResultPageProps {
  result: TestResult;
  onFinish: () => void;
}

function ResultPage({
  result,
  onFinish,
}: ResultPageProps) {
  const maxScore =
    result.maxScore ||
    result.totalQuestions *
      (result.marksPerQuestion || 1);

  const percentage =
    maxScore > 0
      ? (result.score / maxScore) * 100
      : 0;

  const formattedPercentage =
    percentage.toFixed(1);

  return (
    <div className="premium-result-page">

      {/* =================================================
          TOP BAR
      ================================================== */}

      <header className="premium-result-header">

        <div className="premium-result-brand">

          <div className="premium-result-brand-mark">
            <span />
            <span />
            <span />
          </div>

          <div>
            <span>
              ONLINE ASSESSMENT
            </span>

            <strong>
              {result.testName}
            </strong>
          </div>

        </div>

        <div className="premium-result-status">
          <Check
            size={15}
            strokeWidth={2.2}
          />

          <span>
            SUBMISSION RECORDED
          </span>
        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================== */}

      <main className="premium-result-main">

        {/* Hero */}

        <section className="premium-result-hero">

          <div className="premium-result-success-mark">
            <Check
              size={30}
              strokeWidth={1.7}
            />
          </div>

          <span className="premium-result-overline">
            ASSESSMENT COMPLETED
          </span>

          <h1>
            Test Submitted
            <br />
            Successfully
          </h1>

          <p>
            Your response has been securely
            recorded in the assessment system.
          </p>

        </section>

        {/* =================================================
            STUDENT / TEST INFORMATION
        ================================================== */}

        <section className="premium-result-info">

          <div>
            <span>
              TEST
            </span>

            <strong>
              {result.testName}
            </strong>
          </div>

          <div>
            <span>
              ROLL NUMBER
            </span>

            <strong>
              {result.rollNumber}
            </strong>
          </div>

          <div>
            <span>
              SECTION
            </span>

            <strong>
              {result.section}
            </strong>
          </div>

        </section>

        {/* =================================================
            SCORE
        ================================================== */}

        <section className="premium-result-score">

          <div className="premium-score-label">
            FINAL SCORE
          </div>

          <div className="premium-score-number">

            <strong>
              {result.score}
            </strong>

            <span>
              / {maxScore}
            </span>

          </div>

          <div className="premium-score-percentage">
            {formattedPercentage}%
          </div>

          <div className="premium-score-line">
            <div
              style={{
                width: `${Math.min(
                  Math.max(
                    percentage,
                    0
                  ),
                  100
                )}%`,
              }}
            />
          </div>

          <div className="premium-score-caption">
            {result.correct} correct answers
            out of {result.totalQuestions} questions
          </div>

        </section>

        {/* =================================================
            PERFORMANCE
        ================================================== */}

        <section className="premium-performance">

          <div className="premium-section-title">

            <div>
              <span>
                ASSESSMENT BREAKDOWN
              </span>

              <h2>
                Performance Summary
              </h2>
            </div>

            <FileCheck2
              size={22}
              strokeWidth={1.4}
            />

          </div>

          <div className="premium-performance-grid">

            <div className="premium-performance-item">
              <span>
                TOTAL QUESTIONS
              </span>

              <strong>
                {result.totalQuestions}
              </strong>
            </div>

            <div className="premium-performance-item">
              <span>
                ATTEMPTED
              </span>

              <strong>
                {result.attempted}
              </strong>
            </div>

            <div className="premium-performance-item performance-correct">
              <span>
                CORRECT
              </span>

              <strong>
                {result.correct}
              </strong>
            </div>

            <div className="premium-performance-item performance-wrong">
              <span>
                WRONG
              </span>

              <strong>
                {result.wrong}
              </strong>
            </div>

            <div className="premium-performance-item performance-unanswered">
              <span>
                UNANSWERED
              </span>

              <strong>
                {result.unanswered}
              </strong>
            </div>

            <div className="premium-performance-item">
              <span>
                MARKS / QUESTION
              </span>

              <strong>
                {result.marksPerQuestion}
              </strong>
            </div>

          </div>

        </section>

        {/* =================================================
            RECORDED NOTICE
        ================================================== */}

        <section className="premium-result-notice">

          <div className="premium-notice-icon">
            <ShieldCheck
              size={20}
              strokeWidth={1.5}
            />
          </div>

          <div>

            <strong>
              Submission Recorded
            </strong>

            <p>
              Your assessment response has been
              recorded successfully. This attempt
              is now complete.
            </p>

          </div>

        </section>

        {/* =================================================
            FINISH
        ================================================== */}

        <div className="premium-result-actions">

          <button
            type="button"
            className="premium-finish-button"
            onClick={onFinish}
          >
            <span>
              Finish
            </span>

            <ArrowRight
              size={17}
            />
          </button>

        </div>

        <footer className="premium-result-footer">
          <span>
            Assessment completed successfully
          </span>

          <span>
            •
          </span>

          <span>
            You may now close this page
          </span>
        </footer>

      </main>

    </div>
  );
}

export default ResultPage;