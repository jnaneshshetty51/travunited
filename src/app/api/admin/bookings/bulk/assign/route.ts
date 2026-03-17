import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
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
    const { bookingIds, adminId } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: "No bookings provided" },
        { status: 400 }
      );
    }

    // If adminId is "current", use current admin's ID
    const targetAdminId = adminId === "current" ? session.user.id : adminId;

    // Get bookings to notify admin
    const bookings = await prisma.booking.findMany({
      where: {
        id: {
          in: bookingIds,
        },
      },
      select: {
        id: true,
        tourName: true,
      },
    });

    // Bulk update bookings
    await prisma.booking.updateMany({
      where: {
        id: {
          in: bookingIds,
        },
      },
      data: {
        processedById: targetAdminId,
      },
    });

    // Notify admin about assigned bookings
    for (const booking of bookings) {
      await notify({
        userId: targetAdminId,
        type: "ADMIN_BOOKING_ASSIGNED",
        title: "New Booking Assigned",
        message: `You have been assigned a new tour booking: ${booking.tourName || ""}`,
        link: `/admin/bookings/${booking.id}`,
        data: {
          bookingId: booking.id,
          tourName: booking.tourName,
        },
        sendEmail: true,
        roleScope: "STAFF_ADMIN",
      });
    }

    return NextResponse.json({ message: "Bookings assigned successfully" });
  } catch (error) {
    console.error("Error bulk assigning bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

