import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markAllNotificationsAsRead } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications
 * Get notifications for the current user with filters and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter"); // "all", "visa", "tour", "payment", "system"
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      userId: session.user.id,
    };

    // Filter by read status
    if (unreadOnly) {
      where.readAt = null;
    }

    // Filter by type category
    if (filter && filter !== "all") {
      const typeFilters: Record<string, string[]> = {
        visa: [
          "VISA_APPLICATION_SUBMITTED",
          "VISA_STATUS_CHANGED",
          "VISA_DOCUMENT_REJECTED",
          "VISA_DOCUMENT_REQUIRED",
          "VISA_PAYMENT_SUCCESS",
          "VISA_PAYMENT_FAILED",
          "VISA_READY",
        ],
        tour: [
          "TOUR_BOOKING_CONFIRMED",
          "TOUR_BOOKING_CANCELLED",
          "TOUR_BOOKING_UPDATED",
          "TOUR_PAYMENT_SUCCESS",
          "TOUR_PAYMENT_FAILED",
        ],
        payment: [
          "VISA_PAYMENT_SUCCESS",
          "VISA_PAYMENT_FAILED",
          "TOUR_PAYMENT_SUCCESS",
          "TOUR_PAYMENT_FAILED",
          "ADMIN_REFUND_REQUESTED",
          "ADMIN_REFUND_PROCESSED",
        ],
        system: [
          "ADMIN_APPLICATION_ASSIGNED",
          "ADMIN_BOOKING_ASSIGNED",
          "ADMIN_CORPORATE_LEAD_NEW",
          "ADMIN_VISA_PACKAGE_CHANGED",
          "ADMIN_VISA_PACKAGE_CREATED",
          "ADMIN_TOUR_PACKAGE_CHANGED",
          "ADMIN_TOUR_PACKAGE_CREATED",
          "ADMIN_BULK_IMPORT_COMPLETED",
          "ADMIN_PAYMENT_WEBHOOK_ERROR",
          "ADMIN_ACCOUNT_CREATED",
          "ADMIN_ROLE_CHANGED",
          "ADMIN_ACCOUNT_LOCKED",
        ],
      };

      if (typeFilters[filter]) {
        where.type = { in: typeFilters[filter] };
      }
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        readAt: null,
      },
    });

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = body.action;

    if (action === "read-all") {
      const count = await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({ message: "All notifications marked as read", count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

