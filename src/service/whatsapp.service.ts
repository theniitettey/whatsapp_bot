import axios from "axios";
import CONFIG from "../config";
import {
  isNewUser as storeIsNewUser,
  markUserSeen as storeMarkUserSeen,
} from "./userStore";
import logger from "../lib/logger";

const BASE_URL = `https://api.ultramsg.com/${CONFIG.ULTRAMSG_INSTANCE_ID}/messages/chat`;

async function sendTextMessage(to: string, textMessage: string) {
  try {
    const payload = { token: CONFIG.ULTRAMSG_TOKEN, to, body: textMessage };
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => params.append(k, String(v)));
    const response = await axios.post(BASE_URL, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    logger.info("Ultramsg text send response:", response.status, response.data);
    return response.data;
  } catch (err: any) {
    logger.error(
      "Error sending text message:",
      err.response?.data || err.message
    );
  }
}

async function sendTemplateMessage(to: string) {
  try {
    const payload = {
      token: CONFIG.ULTRAMSG_TOKEN,
      to,
      body: "Hello welcome to PrestoQ!",
    };
    const params = new URLSearchParams();
    Object.entries(payload).forEach(([k, v]) => params.append(k, String(v)));
    const response = await axios.post(BASE_URL, params.toString(), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    logger.info(
      "Ultramsg template send response:",
      response.status,
      response.data
    );
    return response.data;
  } catch (err: any) {
    logger.error(
      "Error sending template message:",
      err.response?.data || err.message
    );
    throw err;
  }
}

const sentToUsers = new Set<string>();

async function sendMessage(to: string, textMessage: string) {
  if (storeIsNewUser(to)) {
    logger.info(`New user detected (${to}) → sending template`);
    const resp = await sendTemplateMessage(to);
    void storeMarkUserSeen(to);
    return resp;
  } else {
    logger.debug(`Returning user (${to}) → sending text message`);
    const resp = await sendTextMessage(to, textMessage);
    return resp;
  }
}

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
  isNewUser: storeIsNewUser,
  markUserSeen: storeMarkUserSeen,
};
