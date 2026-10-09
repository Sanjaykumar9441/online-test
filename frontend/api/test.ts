
import type { VercelRequest, VercelResponse } from "@vercel/node";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  if (!APPS_SCRIPT_URL) {
    console.error("APPS_SCRIPT_URL environment variable is missing.");

    return res.status(500).json({
      success: false,
      message: "Test server is not configured.",
    });
  }

  const requestBody = req.body;
  const action =
    requestBody && typeof requestBody.action === "string"
      ? requestBody.action
      : "unknown";

  const requestId = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  try {
    console.log(`[${requestId}] Incoming action: ${action}`);

    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(requestBody),
      redirect: "follow",
    });

    const text = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch {
      console.error(`[${requestId}] Invalid JSON response`, {
        status: response.status,
        finalUrl: response.url,
        contentType: response.headers.get("content-type"),
        preview: text.slice(0, 500),
      });

      return res.status(502).json({
        success: false,
        message: "Invalid response received from the test server.",
      });
    }

    const result = data as {
      success?: boolean;
      message?: string;
      tests?: unknown[];
    };

    console.log(`[${requestId}] Apps Script response`, {
      status: response.status,
      finalUrl: response.url,
      contentType: response.headers.get("content-type"),
      action,
      hasTests: Array.isArray(result.tests),
      testCount: Array.isArray(result.tests)
        ? result.tests.length
        : undefined,
      message: result.message,
    });

    // A getTests request must return the tests array.
    // Do not silently treat a health-check response as valid test data.
    if (action === "getTests" && !Array.isArray(result.tests)) {
      console.error(`[${requestId}] Unexpected getTests response`, {
        finalUrl: response.url,
        message: result.message,
      });

      return res.status(502).json({
        success: false,
        message: "The test server returned an unexpected response.",
      });
    }

    return res
      .status(response.ok ? 200 : response.status)
      .json(data);
  } catch (error) {
    console.error(`[${requestId}] Vercel API error:`, error);

    return res.status(500).json({
      success: false,
      message: "Unable to connect to the test server.",
    });
  }
}
