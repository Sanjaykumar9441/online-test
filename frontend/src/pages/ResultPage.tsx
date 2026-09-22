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

  return (
    <div className="result-page">
      <div className="result-container">
        {/* =========================
            HEADER
        ========================== */}

        <div className="result-header">
          <div className="result-success-icon">
            ✓
          </div>

          <h1>Test Submitted Successfully</h1>

          <p>
            Your response has been recorded successfully.
          </p>
        </div>

        {/* =========================
            TEST INFORMATION
        ========================== */}

        <div className="result-info-card">
          <div className="result-info-item">
            <span>Test</span>
            <strong>{result.testName}</strong>
          </div>

          <div className="result-info-item">
            <span>Roll Number</span>
            <strong>{result.rollNumber}</strong>
          </div>

          <div className="result-info-item">
            <span>Section</span>
            <strong>{result.section}</strong>
          </div>
        </div>

        {/* =========================
            SCORE
        ========================== */}

        <div className="result-score-card">
          <div className="score-label">
            Your Score
          </div>

          <div className="score-value">
            {result.score}
            <span> / {maxScore}</span>
          </div>

          <div className="score-percentage">
            {percentage.toFixed(1)}%
          </div>
        </div>

        {/* =========================
            PERFORMANCE
        ========================== */}

        <div className="result-performance-card">
          <h2>Performance Summary</h2>

          <div className="performance-grid">
            <div className="performance-item">
              <span>Total Questions</span>
              <strong>
                {result.totalQuestions}
              </strong>
            </div>

            <div className="performance-item">
              <span>Attempted</span>
              <strong>
                {result.attempted}
              </strong>
            </div>

            <div className="performance-item">
              <span>Correct</span>
              <strong>
                {result.correct}
              </strong>
            </div>

            <div className="performance-item">
              <span>Wrong</span>
              <strong>
                {result.wrong}
              </strong>
            </div>

            <div className="performance-item">
              <span>Unanswered</span>
              <strong>
                {result.unanswered}
              </strong>
            </div>

            <div className="performance-item">
              <span>Marks / Question</span>
              <strong>
                {result.marksPerQuestion}
              </strong>
            </div>
          </div>
        </div>

        {/* =========================
            NOTICE
        ========================== */}

        <div className="result-notice">
          <strong>Submission Recorded</strong>

          <p>
            Your submission has been recorded in the
            assessment system. You may now close this
            page.
          </p>
        </div>

        {/* =========================
            FINISH
        ========================== */}

        <div className="result-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onFinish}
          >
            Finish
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultPage;