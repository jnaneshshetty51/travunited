import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const dynamic = "force-dynamic";



const verifyEmailSchema = z.object({
  token: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Try to parse JSON body, but handle empty body gracefully
    let body: any = {};
    let token: string | undefined;
    
    try {
      const contentType = req.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        body = await req.json();
        token = body?.token;
      }
    } catch (parseError) {
      // If JSON parsing fails (empty body), that's okay - we'll handle GET instead
      console.log("No JSON body in POST request, token should be in query params");
    }

    // If token provided in body, verify it (for API calls)
    if (token) {
      return await verifyToken(token);
    }

    // If no token in body, require session (for manual verification from settings)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Mark email as verified (manual verification)
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function verifyToken(token: string) {
  // Look for token - use passwordResetToken field for email verification tokens
  // Tokens are stored with "verify_" prefix for email verification
  let prefixedToken = token.startsWith("verify_") ? token : `verify_${token}`;
  
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: prefixedToken,
      passwordResetExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user || !user.passwordResetExpires) {
    return NextResponse.json(
      { error: "Invalid or expired verification token" },
      { status: 400 }
    );
  }

  // Check if token has expired (additional check)
  if (new Date() > user.passwordResetExpires) {
    return NextResponse.json(
      { error: "Verification token has expired. Please request a new one." },
      { status: 400 }
    );
  }

  // Mark email as verified and clear token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  return NextResponse.json({
    message: "Email verified successfully",
  });
}

export async function GET(req: Request) {
  try {
    // Check if token is in query params (from email verification link)
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (token) {
      // Verify token from email link
      return await verifyToken(token);
    }

    // If no token, check verification status (requires session)
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailVerified: true,
        email: true,
      },
    });

    return NextResponse.json({
      emailVerified: user?.emailVerified || false,
      email: user?.email,
    });
  } catch (error) {
    console.error("Error checking email verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

