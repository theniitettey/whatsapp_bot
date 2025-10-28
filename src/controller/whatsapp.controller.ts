import { Request, Response } from "express";
import CONFIG from "../config";
import { WhatsappService, ApiService } from "../service";

/**
 * Verifies webhook for WhatsApp setup
 */
const verifyWebhook = (req: Request, res: Response): void => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === CONFIG.VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

/**
 * Handles incoming WhatsApp messages and replies automatically
 */
const handleIncomingMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const message = changes?.value?.messages?.[0];

    if (!message) {
      // WhatsApp might send status updates or empty notifications
      res.sendStatus(200);
      return;
    }

    const sender = message.from; // sender phone number (e.g., "233599835538")
    const text = message.text?.body || "";

    console.log(`📩 New message from ${sender}: "${text}"`);

    // Optional: get a dynamic response from your external API
    const reply = await ApiService.getAPIResponse(text, sender);

    // Send message (auto-detects whether to use template or text)
    await WhatsappService.sendMessage(sender, reply);

    res.sendStatus(200);
  } catch (error: any) {
    console.error(
      "❌ Error handling incoming message:",
      error.response?.data || error.message
    );
    res.sendStatus(500);
  }
};

export const WhatsappController = {
  verifyWebhook,
  handleIncomingMessage,
};
