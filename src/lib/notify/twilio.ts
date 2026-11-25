import type { NotifyProvider, NotifyMessage, NotifyResult } from "./provider";

/** Thin REST client against Twilio's Messages API — no SDK dependency needed. */
export const twilioNotifyProvider: NotifyProvider = {
  async send(message: NotifyMessage): Promise<NotifyResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const smsFrom = process.env.TWILIO_FROM_NUMBER;
    const waFrom = process.env.TWILIO_WHATSAPP_FROM;

    if (!sid || !token) {
      return { status: "failed", error: "Twilio credentials not configured" };
    }

    const from = message.channel === "whatsapp" ? `whatsapp:${waFrom}` : smsFrom;
    const to = message.channel === "whatsapp" ? `whatsapp:${message.to}` : message.to;
    if (!from) {
      return { status: "failed", error: `No Twilio "from" number configured for ${message.channel}` };
    }

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ From: from, To: to, Body: message.body }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        return { status: "failed", error: data?.message ?? `Twilio error ${res.status}` };
      }
      return { status: "sent", providerMessageId: data.sid };
    } catch (err) {
      return { status: "failed", error: err instanceof Error ? err.message : "Unknown error" };
    }
  },
};
