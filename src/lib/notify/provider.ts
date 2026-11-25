export type NotifyChannel = "sms" | "whatsapp";

export type NotifyMessage = {
  to: string; // E.164 phone number
  body: string;
  channel: NotifyChannel;
};

export type NotifyResult = {
  status: "sent" | "failed";
  providerMessageId?: string;
  error?: string;
};

/** Swappable transport so SMS/WhatsApp vendor can change without touching callers. */
export interface NotifyProvider {
  send(message: NotifyMessage): Promise<NotifyResult>;
}
