import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
export const dynamic = "force-dynamic";


const signupSchema = z.object({
  name: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().min(2).optional()
  ),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.string().optional()
  ),
});

export async function POST(req: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[Signup] Failed to parse JSON body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Validate input
    let validatedData;
    try {
      validatedData = signupSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error("[Signup] Validation error:", validationError.errors);
        return NextResponse.json(
          { error: "Invalid input", details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { name, email, password, phone } = validatedData;

    // Normalize optional fields (convert empty strings to undefined)
    const normalizedName = name && name.trim() ? name.trim() : undefined;
    const normalizedPhone = phone && phone.trim() ? phone.trim() : undefined;

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError) {
      console.error("[Signup] Database error checking existing user:", dbError);
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    let passwordHash;
    try {
      passwordHash = await bcrypt.hash(password, 10);
    } catch (hashError) {
      console.error("[Signup] Password hashing error:", hashError);
      return NextResponse.json(
        { error: "Failed to process password" },
        { status: 500 }
      );
    }

    // Generate 6-digit OTP
    let otp: string;
    try {
      const crypto = await import("crypto");
      otp = crypto.randomInt(100000, 999999).toString();
    } catch (cryptoError) {
      console.error("[Signup] OTP generation error:", cryptoError);
      return NextResponse.json(
        { error: "Failed to generate verification code" },
        { status: 500 }
      );
    }

    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10); // Valid for 10 minutes

    // Create user with OTP
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: normalizedName,
          email,
          passwordHash,
          phone: normalizedPhone,
          role: "CUSTOMER",
          emailVerified: false, // Email verification required via OTP
          registrationOtp: otp,
          registrationOtpExpires: otpExpires,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    } catch (createError: any) {
      console.error("[Signup] User creation error:", {
        error: createError?.message || String(createError),
        code: createError?.code,
        meta: createError?.meta,
      });
      
      // Handle unique constraint violation
      if (createError?.code === "P2002") {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Send OTP email (non-blocking)
    try {
      const { sendRegistrationOTPEmail } = await import("@/lib/email");
      await sendRegistrationOTPEmail(user.email, otp, user.name || undefined, user.role);
    } catch (error) {
      // Non-blocking - don't fail signup if email fails
      console.error("[Signup] Failed to send OTP email (non-blocking):", error);
    }

    return NextResponse.json(
      { 
        message: "User created successfully. Please verify your email with the OTP sent to your email.", 
        user,
        requiresVerification: true 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Signup] Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

