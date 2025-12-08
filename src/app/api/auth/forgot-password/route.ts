import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendPasswordResetOTPEmail, getLastEmailError } from "@/lib/email";

export const dynamic = "force-dynamic";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

// Generic success response to avoid email enumeration
function respond(resetId?: string, emailSent?: boolean, error?: string) {
  return NextResponse.json(
    {
      message: "If an account exists with this email, a reset link has been sent.",
      ...(resetId ? { resetId } : {}),
      ...(typeof emailSent === "boolean" ? { emailSent } : {}),
      ...(error && process.env.NODE_ENV !== "production" ? { error } : {}),
    },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  try {
    // 1) Parse & validate
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return respond();

    // 2) Find user (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!user) return respond(); // silent success

    // 3) Generate OTP and token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // 4) Create reset record
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    const reset = await prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        otp,
        otpExpiresAt,
        ip: ip || undefined,
        userAgent: userAgent || undefined,
      },
    });

    // 5) Send email (non-blocking of overall flow)
    let emailSent = false;
    try {
      emailSent = await sendPasswordResetOTPEmail(user.email, otp, user.role);
      if (!emailSent) {
        const lastError = getLastEmailError();
        console.error("[Password Reset] sendPasswordResetOTPEmail returned false", {
          userId: user.id,
          userEmail: user.email,
          resetId: reset.id,
          lastEmailError: lastError || "unknown",
        });
      }
    } catch (err) {
      const lastError = getLastEmailError();
      console.error("[Password Reset] Exception sending OTP email", {
        userId: user.id,
        userEmail: user.email,
        resetId: reset.id,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        lastEmailError: lastError || null,
      });
      emailSent = false;
    }

    // 6) Return resetId (even if email failed), plus emailSent flag
    return respond(reset.id, emailSent, getLastEmailError() || undefined);
  } catch (error) {
    if (error instanceof z.ZodError) return respond();
    console.error("[Password Reset] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return respond();
  }
}

