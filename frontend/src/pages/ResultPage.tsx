import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import type { TestResult } from "../types/test";
interface ResultPageProps {
  result: TestResult;
  onFinish: () => void;
}
export default function ResultPage({ result, onFinish }: ResultPageProps) {
  const released =
    result.resultReleased === true && typeof result.score === "number";
  const maxScore =
    result.maxScore ?? result.totalQuestions * (result.marksPerQuestion || 1);
  const percentage =
    released && maxScore > 0 ? ((result.score || 0) / maxScore) * 100 : 0;
  return (
    <div className="premium-result-page">
      <header className="premium-result-header">
        <div className="premium-result-brand">
          <div className="premium-result-brand-mark">
            <span />
            <span />
            <span />
          </div>
          <div>
            <span>ONLINE ASSESSMENT</span>
            <strong>{result.testName}</strong>
          </div>
        </div>
        <div className="premium-result-status">
          <Check size={15} />
          <span>SUBMISSION RECORDED</span>
        </div>
      </header>
      <main className="premium-result-main">
        <section className="premium-result-hero">
          <div className="premium-result-success-mark">
            <Check size={30} />
          </div>
          <span className="premium-result-overline">ASSESSMENT COMPLETED</span>
          <h1>
            Test Submitted
            <br />
            Successfully
          </h1>
          <p>
            Your responses have been securely recorded in the assessment system.
          </p>
        </section>
        <section className="premium-result-info">
          <div>
            <span>TEST</span>
            <strong>{result.testName}</strong>
          </div>
          <div>
            <span>ROLL NUMBER</span>
            <strong>{result.rollNumber}</strong>
          </div>
          <div>
            <span>SECTION</span>
            <strong>{result.section}</strong>
          </div>
        </section>
        {released ? (
          <section className="premium-result-score">
            <div className="premium-score-label">FINAL SCORE</div>
            <div className="premium-score-number">
              <strong>{result.score}</strong>
              <span> / {maxScore}</span>
            </div>
            <div className="premium-score-percentage">
              {percentage.toFixed(1)}%
            </div>
            <div className="premium-score-line">
              <div
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
              />
            </div>
            <div className="premium-score-caption">
              {result.correct ?? 0} correct answers out of{" "}
              {result.totalQuestions} questions
            </div>
            <div className="premium-performance-grid">
              <div className="premium-performance-item">
                <span>ATTEMPTED</span>
                <strong>{result.attempted ?? 0}</strong>
              </div>
              <div className="premium-performance-item">
                <span>WRONG</span>
                <strong>{result.wrong ?? 0}</strong>
              </div>
              <div className="premium-performance-item">
                <span>UNANSWERED</span>
                <strong>{result.unanswered ?? 0}</strong>
              </div>
            </div>
          </section>
        ) : (
          <section className="result-release-notice">
            <div className="result-release-icon">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span>RESULT STATUS</span>
              <h2>Your result is being held</h2>
              <p>
                Your submission is recorded. Scores and answer review will
                become available only after the instructor releases results.
              </p>
            </div>
          </section>
        )}
        <button
          className="premium-result-finish"
          type="button"
          onClick={onFinish}
        >
          Return to portal <ArrowRight size={17} />
        </button>
      </main>
    </div>
  );
}
