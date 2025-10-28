import axios from "axios";
import CONFIG from "../config";

async function getAPIResponse(message: string, senderId: string) {
  try {
    const response = await axios.post(CONFIG.EXTERNAL_API_URL, {
      message: message,
      senderId: senderId,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching API response:", error);
    throw error;
  }
}

export const ApiService = {
  getAPIResponse,
};
