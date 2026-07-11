export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Every mail-sending path in the platform goes through this interface, never
 * a provider SDK directly — that's what keeps apps eject-ready. The Resend
 * adapter (see ADR-0004) lives in app-template; this package only ships the
 * contract and a no-op fallback for local/dev/test.
 */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** No-op fallback used until a real provider is wired (or when no API key is configured). */
export class ConsoleMailer implements Mailer {
  async send(message: MailMessage): Promise<void> {
    console.info(`[ConsoleMailer] would send to=${message.to} subject="${message.subject}"`);
  }
}
