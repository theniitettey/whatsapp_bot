import { Express, Router } from "express";
import { WhatsappController } from "../controller/whatsapp.controller";
import { WhatsappService } from "../service/whatsapp.service";

const router: Router = Router();

// Incoming webhook POSTs from Ultramsg / forwarders
router.post("/webhook", WhatsappController.handleIncomingMessage);
router.post("/send", async (req, res) => {
  try {
    const { to, message } = req.body;
    if (!to || !message)
      return res.status(400).json({ error: "Missing 'to' or 'message'" });

    const data = await WhatsappService.sendMessage(to, message);
    res.status(200).json(data);
  } catch (err) {
    console.error("Error in /send route:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
