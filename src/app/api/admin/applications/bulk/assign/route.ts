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
    const { applicationIds, adminId } = body;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: "No applications provided" },
        { status: 400 }
      );
    }

    // If adminId is "current", use current admin's ID
    const targetAdminId = adminId === "current" ? session.user.id : adminId;

    // Get applications to notify admin
    const applications = await prisma.application.findMany({
      where: {
        id: {
          in: applicationIds,
        },
      },
      select: {
        id: true,
        country: true,
        visaType: true,
      },
    });

    // Bulk update applications
    await prisma.application.updateMany({
      where: {
        id: {
          in: applicationIds,
        },
      },
      data: {
        processedById: targetAdminId,
      },
    });

    // Notify admin about assigned applications
    for (const app of applications) {
      await notify({
        userId: targetAdminId,
        type: "ADMIN_APPLICATION_ASSIGNED",
        title: "New Application Assigned",
        message: `You have been assigned a new visa application: ${app.country || ""} ${app.visaType || ""}`,
        link: `/admin/applications/${app.id}`,
        data: {
          applicationId: app.id,
          country: app.country,
          visaType: app.visaType,
        },
        sendEmail: true,
        roleScope: "STAFF_ADMIN",
      });
    }

    return NextResponse.json({ message: "Applications assigned successfully" });
  } catch (error) {
    console.error("Error bulk assigning applications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

