import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadVisaDocument } from "@/lib/minio";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const document = await prisma.bookingDocument.findUnique({
      where: { id: params.docId },
    });

    if (!document || document.bookingId !== params.id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Only allow re-upload if document is rejected
    if (document.status !== "REJECTED") {
      return NextResponse.json(
        { error: "Only rejected documents can be re-uploaded" },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and PDF files are allowed" },
        { status: 400 }
      );
    }

    // Upload new file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();
    const key = `bookings/${params.id}/${document.travellerId || "booking"}/${document.type}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    await uploadVisaDocument(key, buffer, file.type);

    // Update document record
    const updated = await prisma.bookingDocument.update({
      where: { id: params.docId },
      data: {
        key: key,
        fileName: file.name,
        status: "PENDING",
        rejectionReason: null, // Clear rejection reason on re-upload
      },
    });

    return NextResponse.json({
      id: updated.id,
      key: updated.key,
      url: `/api/media/${key}`,
      fileName: updated.fileName,
      type: updated.type,
      status: updated.status,
    });
  } catch (error) {
    console.error("Error re-uploading booking document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    await prisma.bookingDocument.delete({
      where: { id: params.docId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

