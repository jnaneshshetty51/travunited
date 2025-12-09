import { NextResponse } from "next/server";
import { sendPasswordResetOTPEmail, getLastEmailError, getEmailServiceConfig } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Test endpoint to diagnose OTP email sending issues
 * Only accessible to admins
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "STAFF_ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, otp } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const testOTP = otp || "123456";

    // Get email config for diagnostics
    const config = await getEmailServiceConfig();

    // Try to send the email
    console.log("[OTP Test] Starting OTP email test", {
      email,
      testOTP,
      config: {
        hasAccessKey: !!config.awsAccessKeyId,
        hasSecretKey: !!config.awsSecretAccessKey,
        region: config.awsRegion,
        emailFrom: config.emailFromGeneral,
      },
    });

    const result = await sendPasswordResetOTPEmail(email, testOTP, session.user.role);
    const lastError = getLastEmailError();

    return NextResponse.json({
      success: result,
      email,
      otp: testOTP,
      lastError: lastError || null,
      config: {
        awsAccessKeyId: config.awsAccessKeyId ? "✅ Set" : "❌ Missing",
        awsSecretAccessKey: config.awsSecretAccessKey ? "✅ Set" : "❌ Missing",
        awsRegion: config.awsRegion || "❌ Missing",
        emailFromGeneral: config.emailFromGeneral || "❌ Missing",
      },
      recommendations: [
        !config.awsAccessKeyId && "Set AWS_ACCESS_KEY_ID in environment variables",
        !config.awsSecretAccessKey && "Set AWS_SECRET_ACCESS_KEY in environment variables",
        !config.awsRegion && "Set AWS_REGION in environment variables",
        !config.emailFromGeneral && "Set EMAIL_FROM in environment variables",
        !result && lastError && `Email sending failed: ${lastError}`,
        result && "✅ Email sent successfully! Check inbox and spam folder.",
      ].filter(Boolean),
    });
  } catch (error: any) {
    console.error("[OTP Test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

