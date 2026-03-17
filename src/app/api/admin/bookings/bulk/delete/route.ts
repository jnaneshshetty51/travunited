import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";



export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const isAdmin = session.user.role === "STAFF_ADMIN" || session.user.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bookingIds } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: "No bookings provided" },
        { status: 400 }
      );
    }

    // First, verify that all booking IDs exist
    const existingBookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
      },
      select: {
        id: true,
      },
    });

    const existingBookingIds = existingBookings.map(b => b.id);
    const missingIds = bookingIds.filter(id => !existingBookingIds.includes(id));

    if (missingIds.length > 0 && missingIds.length === bookingIds.length) {
      return NextResponse.json(
        { error: "None of the provided booking IDs exist" },
        { status: 404 }
      );
    }

    // Delete related records first (travellers, addOns, reviews, payments, audit logs) to avoid foreign key constraints
    // Then delete the bookings
    const deleteResult = await prisma.$transaction(async (tx) => {
      // Delete AuditLog records that reference these bookings
      // Note: entityId is nullable, but when using 'in' with an array, Prisma will only match non-null values
      if (existingBookingIds.length > 0) {
        await tx.auditLog.deleteMany({
          where: {
            entityType: "BOOKING",
            entityId: { in: existingBookingIds },
          },
        });
      }

      // Delete BookingTraveller records
      await tx.bookingTraveller.deleteMany({
        where: {
          bookingId: { in: existingBookingIds },
        },
      });

      // Delete BookingAddOn records
      await tx.bookingAddOn.deleteMany({
        where: {
          bookingId: { in: existingBookingIds },
        },
      });

      // Delete Review records (optional relation, but delete if exists)
      await tx.review.deleteMany({
        where: {
          bookingId: { in: existingBookingIds },
        },
      });

      // Delete Payment records (optional relation, but delete if exists)
      await tx.payment.deleteMany({
        where: {
          bookingId: { in: existingBookingIds },
        },
      });

      // Finally delete the bookings
      const result = await tx.booking.deleteMany({
        where: {
          id: { in: existingBookingIds },
        },
      });

      return { result, missingIds };
    });

    const response: any = {
      message: `Successfully deleted ${deleteResult.result.count} booking(s)`,
      deletedCount: deleteResult.result.count,
    };

    if (deleteResult.missingIds.length > 0) {
      response.warning = `${deleteResult.missingIds.length} booking ID(s) not found: ${deleteResult.missingIds.join(", ")}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error bulk deleting bookings:", error);
    
    // Check for Prisma foreign key constraint errors
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2003") {
        return NextResponse.json(
          { 
            error: "Cannot delete booking(s) because they are referenced by other records",
            details: "Please ensure there are no dependencies"
          },
          { status: 400 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "One or more bookings not found" },
          { status: 404 }
        );
      }
    }

    // Log full error details for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Full error details:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });

    return NextResponse.json(
      { 
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

