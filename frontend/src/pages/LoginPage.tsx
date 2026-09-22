import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  getSections,
  validateStudent,
} from "../services/api";

interface LoginPageProps {
  onLogin: (
    rollNumber: string,
    section: string
  ) => void | Promise<void>;
}

export default function LoginPage({
  onLogin,
}: LoginPageProps) {
  const [rollNumber, setRollNumber] = useState("");
  const [section, setSection] = useState("");

  const [sections, setSections] = useState<string[]>(
    []
  );

  const [sectionsLoading, setSectionsLoading] =
    useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadSections = async () => {
      try {
        setSectionsLoading(true);
        setError("");

        const response = await getSections();

        if (!response.success) {
          throw new Error(
            response.message ||
              "Unable to load sections."
          );
        }

        if (active) {
          setSections(response.sections || []);
        }
      } catch (error) {
        if (!active) return;

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load sections."
        );
      } finally {
        if (active) {
          setSectionsLoading(false);
        }
      }
    };

    loadSections();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    const cleanRollNumber =
      rollNumber.trim().toUpperCase();

    const cleanSection =
      section.trim().toUpperCase();

    if (!cleanRollNumber) {
      setError("Enter your roll number.");
      return;
    }

    if (!cleanSection) {
      setError("Select your section.");
      return;
    }

    if (sections.length === 0) {
      setError(
        "No sections are currently available."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await validateStudent(
        cleanRollNumber,
        cleanSection
      );

      if (!response.success) {
        setError(
          response.message ||
            "Invalid roll number or section."
        );
        return;
      }

      if (response.alreadySubmitted) {
        setError(
          "You have already submitted this assessment."
        );
        return;
      }

      await onLogin(
        cleanRollNumber,
        cleanSection
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the assessment server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="luxury-login">

      {/* ==================================================
          BACKGROUND ARCHITECTURE
      =================================================== */}

      <div className="luxury-grid" />

      <div className="luxury-cross luxury-cross-one" />
      <div className="luxury-cross luxury-cross-two" />

      {/* ==================================================
          HEADER
      =================================================== */}

      <header className="luxury-header">

        <div className="luxury-wordmark">
          <span className="luxury-wordmark-line" />

          <div>
            <span className="luxury-wordmark-small">
              ONLINE
            </span>

            <span className="luxury-wordmark-main">
              ASSESSMENT
            </span>
          </div>
        </div>

        <div className="luxury-header-right">
          <span className="luxury-status-dot" />

          <span>
            STUDENT PORTAL
          </span>
        </div>

      </header>

      {/* ==================================================
          MAIN COMPOSITION
      =================================================== */}

      <section className="luxury-main">

        {/* LEFT */}

        <div className="luxury-introduction">

          <div className="luxury-number">
            01
          </div>

          <div className="luxury-intro-content">

            <span className="luxury-overline">
              ASSESSMENT ACCESS
            </span>

            <h1>
              Begin your
              <br />
              <span>assessment.</span>
            </h1>

            <p>
              Access your registered assessment
              using the academic details provided
              by your institution.
            </p>

          </div>

          <div className="luxury-bottom-info">

            <div className="luxury-info-item">
              <span>
                ACCESS TYPE
              </span>

              <strong>
                Registered Student
              </strong>
            </div>

            <div className="luxury-info-item">
              <span>
                VERIFICATION
              </span>

              <strong>
                Institutional Records
              </strong>
            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="luxury-verification">

          <div className="luxury-panel-top">

            <div>
              <span className="luxury-panel-label">
                STUDENT VERIFICATION
              </span>

              <h2>
                Sign in
              </h2>
            </div>

            <div className="luxury-panel-index">
              01
            </div>

          </div>

          <p className="luxury-panel-description">
            Enter the credentials associated with
            your registered assessment record.
          </p>

          <div className="luxury-line" />

          <form
            className="luxury-form"
            onSubmit={handleSubmit}
          >

            {/* Roll */}

            <div className="luxury-field">

              <label htmlFor="rollNumber">
                <span>
                  Roll Number
                </span>

                <small>
                  REQUIRED
                </small>
              </label>

              <div className="luxury-input">

                <input
                  id="rollNumber"
                  type="text"
                  value={rollNumber}
                  onChange={(event) => {
                    setRollNumber(
                      event.target.value.toUpperCase()
                    );
                    setError("");
                  }}
                  placeholder="Enter roll number"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  disabled={loading}
                  required
                />

                <span className="luxury-input-index">
                  01
                </span>

              </div>

            </div>

            {/* Section */}

            <div className="luxury-field">

              <label htmlFor="section">
                <span>
                  Section
                </span>

                <small>
                  REQUIRED
                </small>
              </label>

              <div className="luxury-input">

                <select
                  id="section"
                  value={section}
                  onChange={(event) => {
                    setSection(
                      event.target.value.toUpperCase()
                    );
                    setError("");
                  }}
                  disabled={
                    loading ||
                    sectionsLoading
                  }
                  required
                >
                  <option value="">
                    {sectionsLoading
                      ? "Loading sections..."
                      : "Select section"}
                  </option>

                  {sections.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  className="luxury-chevron"
                  size={17}
                />

              </div>

            </div>

            {/* Error */}

            {error && (
              <div
                className="luxury-error"
                role="alert"
              >
                <span>!</span>
                <p>{error}</p>
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              className="luxury-submit"
              disabled={
                loading ||
                sectionsLoading ||
                sections.length === 0
              }
            >
              <span>
                {loading
                  ? "VERIFYING ACCESS"
                  : sectionsLoading
                    ? "LOADING"
                    : "CONTINUE TO ASSESSMENT"}
              </span>

              {loading ||
              sectionsLoading ? (
                <Loader2
                  size={18}
                  className="luxury-spinner"
                />
              ) : (
                <ArrowUpRight
                  size={19}
                  strokeWidth={1.6}
                />
              )}
            </button>

          </form>

          {/* Security */}

          <div className="luxury-security">

            <div className="luxury-security-symbol">
              <ShieldCheck
                size={18}
                strokeWidth={1.5}
              />
            </div>

            <div>
              <strong>
                Secure assessment access
              </strong>

              <p>
                Your details are verified against
                registered institutional records.
              </p>
            </div>

          </div>

          {/* Bottom status */}

          <div className="luxury-status-row">

            <span>
              <Check size={12} />
              Registered access
            </span>

            <span>
              <Check size={12} />
              Secure submission
            </span>

          </div>

        </div>

      </section>

      {/* ==================================================
          FOOTER
      =================================================== */}

      <footer className="luxury-footer">

        <span>
          ONLINE ASSESSMENT SYSTEM
        </span>

        <span className="luxury-footer-center">
          SECURE • ACADEMIC • VERIFIED
        </span>

        <span>
          2026
        </span>

      </footer>

    </main>
  );
}