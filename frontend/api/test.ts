import type { VercelRequest, VercelResponse } from "@vercel/node";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  /* =======================================================
     METHOD CHECK
     ======================================================= */

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed.",
    });
  }

  /* =======================================================
     ENVIRONMENT VARIABLE CHECK
     ======================================================= */

  if (!APPS_SCRIPT_URL) {
    console.error(
      "APPS_SCRIPT_URL environment variable is missing."
    );

    return res.status(500).json({
      success: false,
      message: "Test server is not configured.",
    });
  }

  /* =======================================================
     FORWARD REQUEST TO GOOGLE APPS SCRIPT
     ======================================================= */

  try {
    const response = await fetch(
      APPS_SCRIPT_URL,
      {
        method: "POST",

        // Vercel → Google Apps Script
        headers: {
          "Content-Type":
            "text/plain;charset=utf-8",
        },

        body: JSON.stringify(req.body),
      }
    );

    const text = await response.text();

    /* =====================================================
       PARSE APPS SCRIPT RESPONSE
       ===================================================== */

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch (error) {
      console.error(
        "Invalid Apps Script response:",
        text
      );

      return res.status(502).json({
        success: false,
        message:
          "Invalid response received from the test server.",
      });
    }

    /* =====================================================
       RETURN RESPONSE TO REACT
       ===================================================== */

    return res
      .status(response.ok ? 200 : response.status)
      .json(data);

  } catch (error) {
    console.error(
      "Vercel API error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to connect to the test server.",
    });
  }
}