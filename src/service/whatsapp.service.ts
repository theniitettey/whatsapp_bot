import axios from "axios";
import CONFIG from "../config";
import {
  isNewUser as storeIsNewUser,
  markUserSeen as storeMarkUserSeen,
} from "./userStore";

const BASE_URL = `https://graph.facebook.com/v20.0/${CONFIG.PHONE_NUMBER_ID}/messages`;

/**
 * Sends a plain text message to a user.
 */
async function sendTextMessage(to: string, textMessage: string) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: textMessage },
    };

    const response = await axios.post(BASE_URL, payload, {
      headers: {
        Authorization: `Bearer ${CONFIG.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    // Log successful response for debugging (helps diagnose loops)
    console.log(
      "➡️ WhatsApp text send response:",
      response.status,
      response.data
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error sending text message:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Sends a pre-approved template message to initiate chat with a new user.
 */
async function sendTemplateMessage(to: string) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" },
      },
    };

    const response = await axios.post(BASE_URL, payload, {
      headers: {
        Authorization: `Bearer ${CONFIG.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    // Log successful response for debugging (helps diagnose loops)
    console.log(
      "➡️ WhatsApp template send response:",
      response.status,
      response.data
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "❌ Error sending template message:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Determines whether to send a template or text message based on user state.
 * (For now, you can mock user existence with a simple in-memory store or DB later.)
 */
const sentToUsers = new Set<string>(); // temporary store for demo

async function sendMessage(to: string, textMessage: string) {
  if (storeIsNewUser(to)) {
    console.log(`🆕 New user detected (${to}) → Sending template...`);
    await sendTemplateMessage(to);
    // persist in background; not critical to await here
    void storeMarkUserSeen(to);
  } else {
    console.log(`💬 Returning user (${to}) → Sending text message...`);
    await sendTextMessage(to, textMessage);
  }
}

// Utility helpers for controller logic
function isNewUser(to: string) {
  return !sentToUsers.has(to);
}

function markUserSeen(to: string) {
  sentToUsers.add(to);
}

export const WhatsappService = {
  sendMessage,
  sendTemplateMessage,
  sendTextMessage,
  // re-export store helpers for controller usage
  isNewUser: storeIsNewUser,
  markUserSeen: storeMarkUserSeen,
};
