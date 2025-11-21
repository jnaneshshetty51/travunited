import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseFile, validateVisas } from "@/lib/import-utils";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, AuditEntityType } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mode = req.nextUrl.searchParams.get("mode") || "validate";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Parse file
    const rows = await parseFile(file);

    // Validate
    const validation = validateVisas(rows);

    if (mode === "validate") {
      return NextResponse.json({
        preview: validation.preview,
        summary: {
          totalRows: rows.length,
          validRows: validation.validRows.length,
          invalidRows: validation.invalidRows.length,
        },
        errors: validation.invalidRows,
      });
    }

    // Import mode - commit to database
    let created = 0;
    let updated = 0;
    const failed: Array<{ row: number; message: string }> = [];

    for (const { row, data } of validation.validRows) {
      try {
        // Validation is handled by Zod schema in validateVisas()
        // If we reach here, all required fields are present and valid

        // Find or create country by country_code (as per requirements)
        const country = await prisma.country.upsert({
          where: { code: data.country_code },
          update: { name: data.country_name },
          create: {
            code: data.country_code,
            name: data.country_name,
            isActive: true,
          },
        });

        // Calculate total price for backward compatibility
        const totalPrice = data.govt_fee + data.service_fee;

        // Build visa data with new fields
        const visaData = {
          countryId: country.id,
          name: data.visa_name,
          slug: data.visa_slug,
          category: data.entry_type || "Tourist",
          // New fields from CSV template (required)
          stayDurationDays: Number(data.stay_duration_days),
          validityDays: Number(data.validity_days),
          govtFee: Number(data.govt_fee),
          serviceFee: Number(data.service_fee),
          currency: data.currency || "INR",
          // Legacy fields (for backward compatibility)
          priceInInr: totalPrice,
          processingTime: data.processing_time_days || "3-5 days",
          stayDuration: `${data.stay_duration_days} days`,
          validity: `${data.validity_days} days`,
          entryType: data.entry_type || "single",
          overview: data.long_description || data.short_description || "",
          eligibility: "",
          isActive: data.is_active ?? true,
          isFeatured: data.show_on_homepage || false,
        };

        // Upsert visa by slug (as per requirements)
        const existingVisa = await prisma.visa.findUnique({
          where: { slug: data.visa_slug },
          select: { id: true },
        });

        await prisma.visa.upsert({
          where: { slug: data.visa_slug },
          update: visaData,
          create: visaData,
        });

        if (existingVisa) {
          updated++;
        } else {
          created++;
        }
      } catch (error: any) {
        console.error(`Error importing visa at row ${row}:`, error);
        let errorMessage = error.message || "Failed to import";
        if (error.code === "P2002") {
          errorMessage = "Duplicate slug - visa_slug must be unique";
        } else if (error.code === "P2003") {
          errorMessage = `Foreign key constraint failed: ${error.meta?.field_name || "related record not found"}`;
        }
        failed.push({ row, message: errorMessage });
      }
    }

    // Log audit event
    await logAuditEvent({
      adminId: session.user.id,
      entityType: AuditEntityType.OTHER,
      entityId: "bulk-import",
      action: AuditAction.CREATE,
      description: `Bulk imported visas: ${created} created, ${updated} updated, ${failed.length} failed`,
      metadata: {
        created,
        updated,
        failed: failed.length,
        totalRows: rows.length,
      },
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalRows: rows.length,
        created,
        updated,
        failed: failed.length,
      },
      failed,
    });
  } catch (error: any) {
    console.error("Error importing visas:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

