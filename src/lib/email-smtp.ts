/**
 * SMTP-based email utility using Nodemailer and Amazon SES
 * This provides an alternative to the AWS SDK approach
 */

import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface SMTPEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  replyTo?: string | string[];
}

let transporter: Transporter | null = null;

/**
 * Get or create SMTP transporter
 */
function getTransporter(): Transporter {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SES_SMTP_HOST || "email-smtp.ap-south-1.amazonaws.com";
  const port = parseInt(process.env.SES_SMTP_PORT || "465", 10);
  const secure = process.env.SES_SMTP_SECURE !== "false"; // default true for port 465
  const user = process.env.SES_SMTP_USER;
  const pass = process.env.SES_SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP credentials not configured. Set SES_SMTP_USER and SES_SMTP_PASS in environment variables.");
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
  });

  return transporter;
}

/**
 * Send email via SMTP
 */
export async function sendMailSMTP(options: SMTPEmailOptions): Promise<{ messageId: string }> {
  const transport = getTransporter();

  const from = options.from || process.env.EMAIL_FROM || process.env.EMAIL_FROM_GENERAL || "no-reply@travunited.in";

  const info = await transport.sendMail({
    from,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc) : undefined,
    bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc) : undefined,
    replyTo: options.replyTo ? (Array.isArray(options.replyTo) ? options.replyTo.join(", ") : options.replyTo) : undefined,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });

  return {
    messageId: info.messageId,
  };
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error);
    return false;
  }
}

/**
 * Close SMTP connection (useful for cleanup)
 */
export function closeSmtpConnection(): void {
  if (transporter) {
    transporter.close();
    transporter = null;
  }
}

