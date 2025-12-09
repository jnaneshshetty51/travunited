import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPasswordResetEmail, getLastEmailError } from "@/lib/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const testEmailSchema = z.object({
  email: z.string().email(),
  resetLink: z.string().url().optional(),
});

export async function POST(req: Request) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "STAFF_ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { email, resetLink } = testEmailSchema.parse(body);

    // Use provided link or create a test link
    const testLink = resetLink || `https://travunited.in/reset-password?id=test&token=test-token-12345`;

    console.log("[Test Password Reset Email] Sending test email", {
      email,
      testLink,
      adminUser: session.user.email,
      timestamp: new Date().toISOString(),
    });

    const result = await sendPasswordResetEmail(email, testLink, session.user.role as any);

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Test password reset email sent successfully",
        email,
        link: testLink,
      });
    } else {
      const error = getLastEmailError();
      return NextResponse.json(
        {
          success: false,
          error: error || "Email sending returned false",
          email,
          lastEmailError: error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    const lastError = getLastEmailError();
    console.error("[Test Password Reset Email] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : String(error),
        lastEmailError: lastError,
      },
      { status: 500 }
    );
  }
}

