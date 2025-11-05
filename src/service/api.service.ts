import axios from "axios";
import CONFIG from "../config";
import { setToken } from "./userStore";
import { text } from "body-parser";
import { response } from "express";

async function getAPIResponse(message: string, senderId: string) {
  const payload = {
    message: message,
    session_id: senderId,
    budget: null,
    token: null,
  };

  try {
    const response = await axios.post(CONFIG.EXTERNAL_API_URL, payload);
    const data = response.data;

    // If the external API returned an auth token for this user, persist it
    // so subsequent requests can reuse it. We look for common fields but
    // tolerate different shapes (access_token or token).
    try {
      const token = data?.token ?? data?.access_token ?? null;
      const refreshToken = data?.refresh_token ?? null;
      const expiresIn = data?.expires_in ?? data?.expires ?? null; // seconds

      if (token) {
        // Persist token for the sender. expiresIn may be null.
        await setToken(senderId, token, expiresIn, refreshToken);
      }
    } catch (err) {
      // non-fatal: log and continue returning the API response
      console.warn("Warning: failed to persist token from API response:", err);
    }

    return data;
    // const mockResponse = {
    //   message: "This is a mock response from the external API.",
    //   reply: message,
    //   text: message,
    //   response: "This is a mock response from the external API.",
    //   session_id: senderId,
    //   budget: 100,
    //   token: "  mock_token_12345",
    // };
    // return mockResponse;
  } catch (err: any) {
    // Single attempt failed — log and return null so caller decides what to send
    console.warn(
      "External API call failed (no retry):",
      err?.response?.data || err.message || err
    );
    return null;
  }
}

export const ApiService = {
  getAPIResponse,
};
