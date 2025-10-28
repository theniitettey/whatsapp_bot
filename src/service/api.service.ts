import axios from "axios";
import CONFIG from "../config";
import { setToken } from "./userStore";

async function getAPIResponse(message: string, senderId: string) {
  try {
    const payload = {
      message: message,
      session_id: senderId,
      budget: null,
      token: null,
    };

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
  } catch (error) {
    console.error("Error fetching API response:", error);
    throw error;
  }
}

export const ApiService = {
  getAPIResponse,
};
