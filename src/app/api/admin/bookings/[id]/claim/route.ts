import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
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

    const isAdmin = session.user.role === "STAFF_ADMIN" || session.user.role === "SUPER_ADMIN";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: {
        tourName: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    await prisma.booking.update({
      where: { id: params.id },
      data: {
        processedById: session.user.id,
      },
    });

    // Notify admin who claimed it
    await notify({
      userId: session.user.id,
      type: "ADMIN_BOOKING_ASSIGNED",
      title: "Booking claimed",
      message: `You have claimed booking: ${booking.tourName || ""}.`,
      link: `/admin/bookings/${params.id}`,
      data: {
        bookingId: params.id,
        tourName: booking.tourName,
      },
      sendEmail: false,
    });

    return NextResponse.json({ message: "Booking claimed successfully" });
  } catch (error) {
    console.error("Error claiming booking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

