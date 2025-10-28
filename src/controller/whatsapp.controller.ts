import { Request, Response } from "express";
import CONFIG from "../config";
import { WhatsappService, ApiService, UserStore } from "../service";
import { isProcessed, markProcessed } from "../service/processedStore";

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

    console.log("📥 Incoming message payload:", message);
    const sender = message.from; // sender phone number (e.g., "233599835538")
    const text = message.text?.body || "";

    // Deduplicate incoming message events by message ID to avoid loops
    const messageId = message.id ?? message.message_id ?? message.mid ?? null;
    if (messageId && isProcessed(messageId)) {
      console.log(`↩️ Duplicate webhook for message ${messageId} — skipping`);
      res.sendStatus(200);
      return;
    }
    if (messageId) markProcessed(messageId);

    console.log(`📩 New message from ${sender}: "${text}"`);

    // If this is the user's first message, send a pre-approved template
    // and do not call the external API. Otherwise, call the API to get
    // a dynamic response and send it.
    if (WhatsappService.isNewUser(sender)) {
      // send template and mark user as seen so future messages hit the API
      const messageBody = await WhatsappService.sendTemplateMessage(sender);
      WhatsappService.markUserSeen(sender);
      console.log(
        `✅ Sent template to first-time user ${sender}:`,
        messageBody
      );
    } else {
      const reply = await ApiService.getAPIResponse(text, sender);
      console.log(`🤖 External API reply for ${sender}:`, reply);

      if (!reply) {
        // External API failed; send a simple fallback/error message once
        console.log(
          `⚠️ External API failed for ${sender}; sending fallback message.`
        );
        const fallbackBody = await WhatsappService.sendTextMessage(
          sender,
          CONFIG.FALLBACK_MESSAGE
        );
        console.log(`✅ Sent fallback message to ${sender}:`, fallbackBody);
      } else {
        const messageBody = await WhatsappService.sendMessage(
          sender,
          reply.response || "Sorry, I couldn't process your request."
        );
        console.log(`✅Message body:`, messageBody);
      }
    }

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
