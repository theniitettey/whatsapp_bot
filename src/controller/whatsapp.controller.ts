import { Request, Response } from "express";
import { ApiService, UserStore, WhatsappService } from "../service";
import logger from "../lib/logger";
import { isProcessed, markProcessed } from "../service/processedStore";

/**
 * Handles incoming WhatsApp messages and replies automatically using the
 * centralized WhatsappService (which handles Ultramsg details).
 */
const extractIncoming = (body: any) => {
  // Handles multiple webhook shapes: Facebook Graph, Ultramsg, or simple forwarders.
  // Return { sender, text, id } or null if no message found.

  // 1) Ultramsg webhook shape (newer): { event_type, instanceId, data: { id, sid, from, body, ... } }
  const data = body?.data ?? null;
  if (data && typeof data === "object") {
    const rawFrom =
      data.from || data.from_number || data.sender || data.author || null;
    // normalize sender: strip any @... suffix (e.g. 233599835538@c.us -> 233599835538)
    const sender =
      typeof rawFrom === "string" ? rawFrom.split("@")[0] : rawFrom;
    const text = data.body || data.text || data.message || "";
    const id = data.id ?? data.sid ?? data.messageId ?? null;
    const fromMe = data.fromMe === true || data.fromMe === "true";
    const self = data.self === true || data.self === "true";
    const eventType = body?.event_type ?? null;
    if (sender) {
      return { sender, text, id, fromMe, self, eventType };
    }
  }

  // 2) Graph API shape: { entry: [ { changes: [ { value: { messages: [ ... ] } } ] } ] }
  const entry = body?.entry?.[0];
  const changes = entry?.changes?.[0];
  const graphMsg = changes?.value?.messages?.[0];
  if (graphMsg) {
    return {
      sender: graphMsg.from,
      text: graphMsg.text?.body || graphMsg.body || "",
      id: graphMsg.id ?? graphMsg.message_id ?? graphMsg.mid ?? null,
      fromMe: false,
      self: false,
      eventType: null,
    };
  }

  // 2) Ultramsg shape (or similar): { messages: [ { from, body, id } ] }
  const ul = body?.messages?.[0] || body?.message || null;
  if (ul) {
    return {
      sender: ul.from || ul.from_number || ul.sender || null,
      text: ul.body || ul.text || ul.payload || "",
      id: ul.id ?? ul.messageId ?? null,
      fromMe: ul.fromMe === true || ul.fromMe === "true",
      self: ul.self === true || ul.self === "true",
      eventType: body?.event_type ?? null,
    };
  }

  // 3) Simple forwarder: { from, text }
  if (body?.from && (body?.text || body?.body)) {
    return {
      sender: body.from,
      text: body.text || body.body || "",
      id: body.id ?? null,
      fromMe: false,
      self: false,
      eventType: null,
    };
  }

  return null;
};

const handleIncomingMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    logger.info("Received incoming webhook", {
      size: JSON.stringify(req.body).length,
    });
    const msg = extractIncoming(req.body);
    if (!msg) {
      res.sendStatus(200);
      return;
    }

    const { sender, text, id, fromMe, self, eventType } = msg as any;
    if (!sender) {
      res.sendStatus(200);
      return;
    }

    logger.debug("Incoming message payload:", msg);

    // Use the provider's event type to decide whether to act. Accept a small
    // whitelist of actionable event types (providers differ). If an explicit
    // event_type is present and NOT in the whitelist, acknowledge with 200
    // and skip processing.
    // Only treat provider 'message_received' as actionable. Some providers
    // use 'message_create' for outgoing messages we send back, so we don't
    // want to process those. If eventType is null (e.g. Graph shape) we
    // continue to process so simple forwarders still work.
    const ACTIONABLE = new Set(["message_received"]);
    if (eventType != null && !ACTIONABLE.has(String(eventType))) {
      logger.info(`Ignoring non-actionable event_type='${eventType}'`);
      res.sendStatus(200);
      return;
    }

    // Deduplicate incoming message events by message ID to avoid loops
    const messageId = id ?? null;
    if (messageId && isProcessed(messageId)) {
      logger.debug(`Duplicate webhook for message ${messageId} — skipping`);
      res.sendStatus(200);
      return;
    }
    if (messageId) await markProcessed(messageId);

    logger.info(`New message from ${sender}`);

    // Template-first handled by the external API: always forward the
    // incoming event to the ApiService. For new users we mark them seen
    // and let the API decide whether to return a welcome/template message.
    if (UserStore.isNewUser(sender)) {
      logger.info(`First time from ${sender} — delegating to ApiService`);
      void UserStore.markUserSeen(sender);
    }

    // Ask external API and forward reply (or fallback)
    const reply = await ApiService.getAPIResponse(text || "", sender);
    logger.debug(`External API reply for ${sender}:`, reply);

    if (!reply) {
      const fallback =
        process.env.FALLBACK_MESSAGE || "Sorry, something went wrong.";
      const fallbackResp = await WhatsappService.sendTextMessage(
        sender,
        fallback
      );
      logger.info(`Sent fallback to ${sender}`);
      res.sendStatus(200);
      return;
    }

    const outbound =
      reply.response || reply.text || reply.message || String(reply);
    const outboundResp = await WhatsappService.sendTextMessage(
      sender,
      outbound
    );
    logger.info(`Sent reply to ${sender}`);
    res.sendStatus(200);
    return;
  } catch (error: any) {
    console.error(
      "❌ Error handling incoming message:",
      error.response?.data || error.message || error
    );
    res.sendStatus(500);
    return;
  }
};

export const WhatsappController = {
  handleIncomingMessage,
};
