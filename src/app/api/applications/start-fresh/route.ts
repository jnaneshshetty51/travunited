import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { visaId } = body as { visaId?: string };

    if (!visaId) {
      return NextResponse.json(
        { error: "visaId is required" },
        { status: 400 }
      );
    }

    // Delete existing DRAFT applications for this user and visa
    const result = await prisma.application.deleteMany({
      where: {
        userId: session.user.id,
        visaId,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ ok: true, deletedDrafts: result.count });
  } catch (error) {
    console.error("Error starting fresh application:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


