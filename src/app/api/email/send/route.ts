/**
 * API Route: Send Email
 * POST /api/email/send
 * 
 * Unified email sending endpoint that supports both SMTP and AWS SDK
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendMailSMTP } from "@/lib/email-smtp";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    // Check authentication for security
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "STAFF_ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { to, subject, html, text, cc, bcc, from, provider } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      );
    }

    // Determine which provider to use
    const emailProvider = provider || process.env.EMAIL_PROVIDER || "smtp";

    let messageId: string | undefined;

    if (emailProvider === "smtp") {
      // Use SMTP/Nodemailer
      const result = await sendMailSMTP({
        to,
        subject,
        html,
        text,
        cc,
        bcc,
        from,
      });
      messageId = result.messageId;
    } else {
      // Use AWS SDK (existing method)
      const success = await sendEmail({
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      });
      
      if (!success) {
        throw new Error("Failed to send email via AWS SDK");
      }
      
      messageId = "sent-via-aws-sdk";
    }

    return NextResponse.json({
      success: true,
      messageId,
      provider: emailProvider,
    });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json(
      {
        error: "Failed to send email",
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

