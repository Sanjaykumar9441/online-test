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

function LoginPage({ onLogin }: LoginPageProps) {
  const [rollNumber, setRollNumber] = useState("");
  const [section, setSection] = useState("");

  const [sections, setSections] = useState<string[]>(
    []
  );

  const [sectionsLoading, setSectionsLoading] =
    useState(true);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  /*
   * Load available sections from Google Sheets.
   */
  useEffect(() => {
    let mounted = true;

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

        if (mounted) {
          setSections(response.sections || []);
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load sections."
        );
      } finally {
        if (mounted) {
          setSectionsLoading(false);
        }
      }
    };

    loadSections();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * Handle roll number input.
   */
  const handleRollNumberChange = (
    value: string
  ) => {
    setRollNumber(value.toUpperCase());
    setError("");
  };

  /*
   * Handle section selection.
   */
  const handleSectionChange = (
    value: string
  ) => {
    setSection(value.toUpperCase());
    setError("");
  };

  /*
   * Validate student and continue.
   */
  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const cleanRollNumber =
      rollNumber.trim().toUpperCase();

    const cleanSection =
      section.trim().toUpperCase();

    /*
     * Basic validation.
     */
    if (!cleanRollNumber) {
      setError("Please enter your roll number.");
      return;
    }

    if (!cleanSection) {
      setError("Please select your section.");
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
      /*
       * Validate roll number + section
       * against Google Sheets.
       */
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

      /*
       * Prevent a student who has already
       * submitted the test from continuing.
       */
      if (response.alreadySubmitted) {
        setError(
          "You have already submitted this test."
        );
        return;
      }

      /*
       * App.tsx will now load the test
       * configuration before showing
       * the Instructions page.
       */
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
    <div className="login-page">
      <div className="login-container">
        {/* =========================
            HEADER
        ========================== */}

        <div className="login-header">
          <div className="login-logo">
            OA
          </div>

          <div>
            <span className="login-kicker">
              ONLINE ASSESSMENT
            </span>

            <h1>Student Login</h1>

            <p>
              Enter your registered details to
              continue to the assessment.
            </p>
          </div>
        </div>

        {/* =========================
            LOGIN CARD
        ========================== */}

        <div className="login-card">
          <div className="login-card-header">
            <h2>Student Details</h2>

            <p>
              Use the roll number and section
              provided by your institution.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {/* Roll Number */}

            <div className="form-group">
              <label htmlFor="rollNumber">
                Roll Number
              </label>

              <input
                id="rollNumber"
                type="text"
                value={rollNumber}
                onChange={(event) =>
                  handleRollNumberChange(
                    event.target.value
                  )
                }
                placeholder="Enter Roll Number"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                disabled={loading}
                required
              />
            </div>

            {/* Section Dropdown */}

            <div className="form-group">
              <label htmlFor="section">
                Section
              </label>

              <select
                id="section"
                value={section}
                onChange={(event) =>
                  handleSectionChange(
                    event.target.value
                  )
                }
                disabled={
                  loading || sectionsLoading
                }
                required
              >
                <option value="">
                  {sectionsLoading
                    ? "Loading sections..."
                    : "Select Section"}
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
            </div>

            {/* Error */}

            {error && (
              <div
                className="login-error"
                role="alert"
              >
                <span className="login-error-icon">
                  !
                </span>

                <span>{error}</span>
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              className="primary-button login-submit-button"
              disabled={
                loading ||
                sectionsLoading ||
                sections.length === 0
              }
            >
              {loading
                ? "Verifying..."
                : sectionsLoading
                ? "Loading Sections..."
                : "Continue"}
            </button>
          </form>

          {/* Information */}

          <div className="login-notice">
            <strong>Important</strong>

            <p>
              Please enter the same roll number and
              section registered for this assessment.
              Your submission is recorded against
              your registered details.
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="login-footer">
          <span>
            Online Assessment System
          </span>

          <span>
            Authorized Student Access
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;