import type { NotifyProvider } from "./provider";
import { consoleNotifyProvider } from "./console";
import { twilioNotifyProvider } from "./twilio";

export function getNotifyProvider(): NotifyProvider {
  return process.env.NOTIFY_PROVIDER === "twilio" ? twilioNotifyProvider : consoleNotifyProvider;
}

export * from "./provider";
