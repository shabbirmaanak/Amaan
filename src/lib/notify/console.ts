import type { NotifyProvider, NotifyMessage, NotifyResult } from "./provider";
import { maskPhone } from "@/lib/phone";

/** Dev provider: logs instead of sending, so the app runs with no SMS vendor configured. */
export const consoleNotifyProvider: NotifyProvider = {
  async send(message: NotifyMessage): Promise<NotifyResult> {
    console.log(
      `[notify:${message.channel}] to=${maskPhone(message.to)} body="${message.body}"`
    );
    return { status: "sent", providerMessageId: `console-${Date.now()}` };
  },
};
