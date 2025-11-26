import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadVisaDocument } from "@/lib/minio";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
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
      include: {
        travellers: true,
      },
    });

    if (!booking || booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = formData.get("documentType") as string;
    const travellerId = formData.get("travellerId") as string | null;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: "File and document type are required" },
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

    // Validate travellerId if provided
    if (travellerId) {
      const traveller = booking.travellers.find((t) => t.id === travellerId);
      if (!traveller) {
        return NextResponse.json(
          { error: "Traveller not found in this booking" },
          { status: 400 }
        );
      }
    }

    // Upload file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const timestamp = Date.now();
    const key = `bookings/${params.id}/${travellerId || "booking"}/${documentType}-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    await uploadVisaDocument(key, buffer, file.type);

    // Create document record
    const document = await prisma.bookingDocument.create({
      data: {
        bookingId: params.id,
        travellerId: travellerId || null,
        type: documentType,
        key: key,
        fileName: file.name,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      id: document.id,
      key: document.key,
      url: `/api/media/${key}`,
      fileName: document.fileName,
      type: document.type,
      status: document.status,
    });
  } catch (error) {
    console.error("Error uploading booking document:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
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

    const documents = await prisma.bookingDocument.findMany({
      where: { bookingId: params.id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching booking documents:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

