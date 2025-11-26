import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { key: string } }
) {
  try {
    const policy = await prisma.sitePolicy.findUnique({
      where: { key: params.key },
    });

    if (!policy) {
      return NextResponse.json(
        { error: "Policy not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      key: policy.key,
      title: policy.title,
      content: policy.content,
      version: policy.version,
      updatedAt: policy.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

