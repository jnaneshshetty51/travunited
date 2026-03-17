/**
 * API Route: Clear Email Configuration Cache
 * POST /api/admin/email/clear-cache
 * 
 * Clears the cached email configuration from database and memory
 * This forces the system to use environment variables
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { refreshEmailConfigCache } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "STAFF_ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    // Delete cached email configuration from database
    await prisma.setting.deleteMany({
      where: { key: "EMAIL_CONFIG" },
    });

    // Refresh in-memory cache
    await refreshEmailConfigCache();

    console.log("[Email] Configuration cache cleared successfully");

    return NextResponse.json({
      success: true,
      message: "Email configuration cache cleared. System will now use environment variables.",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Email] Failed to clear cache:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to clear email configuration cache",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Email cache clearing endpoint. Use POST method.",
    usage: "POST /api/admin/email/clear-cache",
    description: "Clears cached email configuration and forces system to use .env values",
  });
}

