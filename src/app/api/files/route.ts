import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSignedDocumentUrl } from "@/lib/minio";
export const dynamic = "force-dynamic";



export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const keyParam = searchParams.get("key");

    if (!keyParam) {
      return NextResponse.json(
        { error: "Missing file key" },
        { status: 400 }
      );
    }

    const key = decodeURIComponent(keyParam);
    console.log("[Files API] Request received:", { key: key.substring(0, 50), userId: session.user.id, role: session.user.role });
    
    // If the key is already a full URL, just redirect directly (fallback for legacy stored URLs)
    if (key.startsWith("http://") || key.startsWith("https://")) {
      console.log("[Files API] Key is full URL, redirecting directly");
      return NextResponse.redirect(key);
    }
    const isAdmin = session.user.role === "STAFF_ADMIN" || session.user.role === "SUPER_ADMIN";

    let ownerId: string | null = null;

    const document = await prisma.applicationDocument.findFirst({
      where: { filePath: key },
      select: {
        application: {
          select: { userId: true },
        },
      },
    });

    if (document?.application?.userId) {
      ownerId = document.application.userId;
    } else {
      const application = await prisma.application.findFirst({
        where: { visaDocumentUrl: key },
        select: { userId: true },
      });

      if (application) {
        ownerId = application.userId;
      } else {
        const booking = await prisma.booking.findFirst({
          where: { voucherUrl: key },
          select: { userId: true },
        });

        if (booking) {
          ownerId = booking.userId;
        } else {
          // Check for BookingTraveller passport files
          const bookingTraveller = await prisma.bookingTraveller.findFirst({
            where: {
              OR: [
                { passportFileKey: key },
                { aadharFileKey: key },
              ],
            },
            select: {
              booking: {
                select: { userId: true },
              },
            },
          });

          if (bookingTraveller?.booking?.userId) {
            ownerId = bookingTraveller.booking.userId;
          } else {
            // Check for BookingDocument files
            const bookingDocument = await prisma.bookingDocument.findFirst({
              where: { key: key },
              select: {
                booking: {
                  select: { userId: true },
                },
              },
            });

            if (bookingDocument?.booking?.userId) {
              ownerId = bookingDocument.booking.userId;
            }
          }
        }
      }
    }

    // Check for career application resume
    if (!ownerId) {
      console.log("[Files API] No ownerId found, checking CareerApplication for key:", key);
      try {
        // Try exact match first
        let careerApp = await prisma.careerApplication.findFirst({
          where: { resumeUrl: key },
          select: { id: true, resumeUrl: true },
        });

        // If not found, try case-insensitive search (in case of encoding issues)
        if (!careerApp) {
          console.log("[Files API] Exact match not found, trying case-insensitive search");
          careerApp = await prisma.careerApplication.findFirst({
            where: { 
              resumeUrl: {
                equals: key,
                mode: "insensitive",
              },
            },
            select: { id: true, resumeUrl: true },
          });
        }

        // If still not found, try searching for partial match (in case key has extra encoding)
        if (!careerApp) {
          console.log("[Files API] Case-insensitive match not found, trying contains search");
          const allCareerApps = await prisma.careerApplication.findMany({
            where: {
              resumeUrl: {
                contains: key.split("/").pop() || key, // Try matching just the filename
              },
            },
            select: { id: true, resumeUrl: true },
          });
          
          // Find the best match
          careerApp = allCareerApps.find(app => 
            app.resumeUrl === key || 
            app.resumeUrl.includes(key) || 
            key.includes(app.resumeUrl)
          ) || null;
        }

        console.log("[Files API] CareerApplication query result:", { 
          found: !!careerApp, 
          appId: careerApp?.id, 
          requestedKey: key,
          storedResumeUrl: careerApp?.resumeUrl,
          keysMatch: careerApp ? careerApp.resumeUrl === key : false,
          isAdmin 
        });

        if (careerApp) {
          // Career resumes are accessible to admins only
          if (!isAdmin) {
            console.log("[Files API] Non-admin trying to access career resume, forbidden");
            return NextResponse.json(
              { error: "Forbidden" },
              { status: 403 }
            );
          }
          // Admin can access, continue to generate signed URL
          // Use the stored resumeUrl from database (might be slightly different)
          const actualKey = careerApp.resumeUrl || key;
          
          if (!actualKey || actualKey.trim() === "") {
            console.log("[Files API] Career resume URL is empty");
            return NextResponse.json(
              { error: "Resume not available" },
              { status: 404 }
            );
          }
          
          // Set a flag so we know this is a career resume (no ownerId needed for admins)
          ownerId = "CAREER_RESUME"; // Special flag for career resumes
          // Update key to use the actual stored value
          const originalKey = key;
          // Use the stored resumeUrl if it's different (for MinIO lookup)
          if (actualKey !== key) {
            console.log("[Files API] Key mismatch detected, using stored resumeUrl:", actualKey);
            // We'll use actualKey for MinIO but keep original key for logging
          }
          console.log("[Files API] Career resume found, setting ownerId flag, will use key:", actualKey);
        } else {
          console.log("[Files API] CareerApplication not found for key:", key);
          // Try to list all resume URLs for debugging
          try {
            const sampleApps = await prisma.careerApplication.findMany({
              take: 5,
              select: { id: true, resumeUrl: true },
            });
            console.log("[Files API] Sample resume URLs in database:", sampleApps.map(a => a.resumeUrl));
          } catch (e) {
            console.error("[Files API] Error fetching sample apps:", e);
          }
          return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
          );
        }
      } catch (careerError) {
        console.error("[Files API] Error querying CareerApplication:", careerError);
        const errorMessage = careerError instanceof Error ? careerError.message : String(careerError);
        console.error("[Files API] CareerApplication error details:", { message: errorMessage, error: careerError });
        // If table doesn't exist or other error, return file not found
        return NextResponse.json(
          { error: "File not found", details: process.env.NODE_ENV === "development" ? errorMessage : undefined },
          { status: 404 }
        );
      }
    }

    // Skip ownership check for career resumes (admins only)
    if (ownerId !== "CAREER_RESUME" && !isAdmin && ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    try {
      // For career resumes, use the stored resumeUrl from the database if we found a match
      let keyToUse = key;
      if (ownerId === "CAREER_RESUME") {
        // Re-fetch to get the exact stored value
        try {
          const careerApp = await prisma.careerApplication.findFirst({
            where: { resumeUrl: { contains: key.split("/").pop() || key } },
            select: { resumeUrl: true },
          });
          if (careerApp?.resumeUrl) {
            keyToUse = careerApp.resumeUrl;
            console.log("[Files API] Using stored resumeUrl for MinIO:", keyToUse);
          }
        } catch (e) {
          console.error("[Files API] Error fetching career app for key:", e);
        }
      }
      
      console.log("[Files API] Generating signed URL for key:", keyToUse, "ownerId:", ownerId);
      const signedUrl = await getSignedDocumentUrl(keyToUse, 60);
      console.log("[Files API] Signed URL generated successfully");
      return NextResponse.redirect(signedUrl);
    } catch (error) {
      console.error("Error generating signed URL for file:", key, error);
      // Check if it's a career application and provide a better error message
      try {
        const careerApp = await prisma.careerApplication.findFirst({
          where: { resumeUrl: key },
          select: { id: true },
        });
        
        if (careerApp) {
          return NextResponse.json(
            { error: "Resume file not available. The file may have been deleted or moved." },
            { status: 404 }
          );
        }
      } catch (careerQueryError) {
        console.error("Error querying CareerApplication in error handler:", careerQueryError);
      }
      
      return NextResponse.json(
        { error: "File not found or unavailable" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error in /api/files route:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", {
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

