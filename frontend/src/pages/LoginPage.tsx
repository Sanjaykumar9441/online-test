import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import {
  getSections,
  getTests,
  validateStudent,
  type AvailableTest,
} from "../services/api";
import { detectDeviceType, type DeviceType } from "../services/device";

interface LoginPageProps {
  onLogin: (
    rollNumber: string,
    section: string,
    testId: string,
  ) => void | Promise<void>;
}
const dateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })
    : "Schedule unavailable";
const statusCopy = (test: AvailableTest) => {
  if (test.status === "OPEN")
    return {
      title: "Assessment available",
      text: "The assessment is open. Verify your details to continue.",
      tone: "open",
    };
  if (test.status === "UPCOMING")
    return {
      title: "Assessment scheduled",
      text: `Starts ${dateTime(test.startTime)}. Access will open at the scheduled time.`,
      tone: "upcoming",
    };
  if (test.status === "PAUSED")
    return {
      title: "Assessment paused",
      text: "This assessment has been temporarily paused.",
      tone: "paused",
    };
  if (test.status === "SCHEDULE_ERROR")
    return {
      title: "Schedule needs attention",
      text: "The assessment schedule is invalid. Please contact your instructor.",
      tone: "closed",
    };
  return {
    title: "Assessment closed",
    text: `This assessment is not currently available${test.endTime ? `. It was scheduled to end ${dateTime(test.endTime)}` : "."}.`,
    tone: "closed",
  };
};
export default function LoginPage({ onLogin }: LoginPageProps) {
  const [rollNumber, setRollNumber] = useState("");
  const [section, setSection] = useState("");
  const [tests, setTests] = useState<AvailableTest[]>([]);
  const [testId, setTestId] = useState("");
  const [sections, setSections] = useState<string[]>([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [deviceType, setDeviceType] = useState<DeviceType>(() =>
    detectDeviceType(),
  );
  useEffect(() => {
    const update = () => setDeviceType(detectDeviceType());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([getSections(), getTests()])
      .then(([s, t]) => {
        if (!s.success)
          throw new Error(s.message || "Unable to load sections.");
        if (!t.success)
          throw new Error(t.message || "Unable to load assessments.");
        if (active) {
          setSections(s.sections || []);
          const list = t.tests || [];
          setTests(list);
          setTestId((previous) => previous || list[0]?.testId || "");
        }
      })
      .catch((e: unknown) => {
        if (active)
          setError(
            e instanceof Error
              ? e.message
              : "Unable to load assessment details.",
          );
      })
      .finally(() => {
        if (active) setLoadingPage(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const selected = tests.find((test) => test.testId === testId);
  const status = selected ? statusCopy(selected) : null;
  const deviceBlocked = Boolean(
    selected?.fullscreenRequired && deviceType !== "desktop",
  );
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    if (!selected) {
      setError("Select an assessment.");
      return;
    }
    if (deviceBlocked) {
      setError(
        "This examination requires a desktop or laptop in full-screen mode.",
      );
      return;
    }
    if (!selected.canStart || selected.status !== "OPEN") {
      setError(statusCopy(selected).text);
      return;
    }
    const roll = rollNumber.trim().toUpperCase();
    const sec = section.trim().toUpperCase();
    if (!roll || !sec) {
      setError("Enter your roll number and select your section.");
      return;
    }
    setLoading(true);
    try {
      const validation = await validateStudent(
        roll,
        sec,
        selected.testId,
        deviceType,
      );
      if (!validation.success)
        throw new Error(validation.message || "Student verification failed.");
      if (validation.alreadySubmitted)
        throw new Error("You have already submitted this assessment.");
      await onLogin(roll, sec, selected.testId);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to verify assessment access.",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <main className="luxury-login">
      <div className="luxury-grid" />
      <div className="luxury-cross luxury-cross-one" />
      <div className="luxury-cross luxury-cross-two" />
      <header className="luxury-header">
        <div className="luxury-wordmark">
          <span className="luxury-wordmark-line" />
          <div>
            <span className="luxury-wordmark-small">ONLINE</span>
            <span className="luxury-wordmark-main">ASSESSMENT</span>
          </div>
        </div>
        <div className="luxury-header-right">
          <span className="luxury-status-dot" />
          <span>STUDENT PORTAL</span>
        </div>
      </header>
      <section className="luxury-main">
        <div className="luxury-introduction">
          <div className="luxury-number">01</div>
          <div className="luxury-intro-content">
            <span className="luxury-overline">ASSESSMENT ACCESS</span>
            <div className="luxury-assessment-title">
              <h2>{selected?.testName || "Online Assessment"}</h2>
              {selected?.subject && <span>{selected.subject}</span>}
            </div>
            <h1>
              Begin your
              <br />
              <span>assessment.</span>
            </h1>
            <p>
              Access your registered assessment using the academic details
              provided by your institution.
            </p>
          </div>
          <div className="luxury-bottom-info">
            <div className="luxury-info-item">
              <span>ACCESS TYPE</span>
              <strong>Registered Student</strong>
            </div>
            <div className="luxury-info-item">
              <span>VERIFICATION</span>
              <strong>Institutional Records</strong>
            </div>
          </div>
        </div>
        <div className="luxury-verification">
          <div className="luxury-panel-top">
            <div>
              <span className="luxury-panel-label">STUDENT VERIFICATION</span>
              <h2>Sign in</h2>
            </div>
            <div className="luxury-panel-index">01</div>
          </div>
          <p className="luxury-panel-description">
            Enter the credentials associated with your registered assessment
            record.
          </p>
          <div className="luxury-line" />
          <form className="luxury-form" onSubmit={handleSubmit}>
            <div className="luxury-field">
              <label htmlFor="assessment">
                <span>Assessment</span>
                <small>REQUIRED</small>
              </label>
              <div className="luxury-input">
                <select
                  id="assessment"
                  value={testId}
                  onChange={(e) => {
                    setTestId(e.target.value);
                    setError("");
                  }}
                  disabled={loading || loadingPage || tests.length === 0}
                  required
                >
                  <option value="">
                    {loadingPage
                      ? "Loading assessments..."
                      : "Select assessment"}
                  </option>
                  {tests.map((t) => (
                    <option key={t.testId} value={t.testId}>
                      {t.testName} — {t.subject}
                    </option>
                  ))}
                </select>
                <ChevronDown className="luxury-chevron" size={17} />
              </div>
            </div>
            {selected && status && (
              <div
                className={`assessment-status assessment-status--${status.tone}`}
                role="status"
              >
                <span className="assessment-status-dot" />
                <div>
                  <strong>{status.title}</strong>
                  <p>{status.text}</p>
                  {selected.status === "OPEN" && (
                    <small>
                      {selected.totalQuestions} questions ·{" "}
                      {selected.durationMinutes} minutes
                    </small>
                  )}
                </div>
              </div>
            )}
            {deviceBlocked && (
              <div className="fullscreen-device-block" role="alert">
                <strong>Desktop or laptop required</strong>
                <p>
                  This examination requires a desktop or laptop in full-screen
                  mode.
                </p>
              </div>
            )}
            <div className="luxury-field">
              <label htmlFor="rollNumber">
                <span>Roll Number</span>
                <small>REQUIRED</small>
              </label>
              <div className="luxury-input">
                <input
                  id="rollNumber"
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="Enter roll number"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={loading}
                  required
                />
                <span className="luxury-input-index">01</span>
              </div>
            </div>
            <div className="luxury-field">
              <label htmlFor="section">
                <span>Section</span>
                <small>REQUIRED</small>
              </label>
              <div className="luxury-input">
                <select
                  id="section"
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value.toUpperCase());
                    setError("");
                  }}
                  disabled={loading || loadingPage || sections.length === 0}
                  required
                >
                  <option value="">
                    {loadingPage ? "Loading sections..." : "Select section"}
                  </option>
                  {sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="luxury-chevron" size={17} />
              </div>
            </div>
            {error && (
              <div className="luxury-error" role="alert">
                <span>!</span>
                <p>{error}</p>
              </div>
            )}
            <button
              type="submit"
              className="luxury-submit"
              disabled={
                loading ||
                loadingPage ||
                !selected ||
                !selected.canStart ||
                deviceBlocked
              }
            >
              <span>
                {loading
                  ? "VERIFYING ACCESS"
                  : deviceBlocked
                    ? "DESKTOP / LAPTOP REQUIRED"
                    : !selected?.canStart
                      ? "ASSESSMENT NOT OPEN"
                      : "CONTINUE TO ASSESSMENT"}
              </span>
              {loading ? (
                <Loader2 size={18} className="luxury-spinner" />
              ) : (
                <ArrowUpRight size={19} strokeWidth={1.6} />
              )}
            </button>
          </form>
          <div className="luxury-security">
            <div className="luxury-security-symbol">
              <ShieldCheck size={18} strokeWidth={1.5} />
            </div>
            <div>
              <strong>Secure assessment access</strong>
              <p>
                Your details are verified against registered institutional
                records.
              </p>
            </div>
          </div>
          <div className="luxury-status-row">
            <span>
              <Check size={12} /> Registered access
            </span>
            <span>
              <Check size={12} /> Secure submission
            </span>
          </div>
        </div>
      </section>
      <footer className="luxury-footer">
        <span>ONLINE ASSESSMENT SYSTEM</span>
        <span className="luxury-footer-center">
          SECURE • ACADEMIC • VERIFIED
        </span>
        <span>2026</span>
      </footer>
    </main>
  );
}
