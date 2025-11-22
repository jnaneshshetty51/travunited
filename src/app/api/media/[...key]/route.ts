import { NextResponse } from "next/server";
import { getDocumentObject } from "@/lib/minio";
import { Readable } from "stream";
export const dynamic = "force-dynamic";


function readableToWebStream(stream: Readable): ReadableStream<Uint8Array> {
  const reader = stream;

  return new ReadableStream<Uint8Array>({
    start(controller) {
      reader.on("data", (chunk) => {
        controller.enqueue(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      });

      reader.on("end", () => {
        controller.close();
      });

      reader.on("error", (error) => {
        controller.error(error);
      });
    },
    cancel() {
      reader.destroy();
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: { key: string[] } }
) {
  const keyPath = params.key?.join("/");

  // Validate key path - must be a valid path, not just a single character or empty
  if (!keyPath || keyPath.length < 3 || keyPath.trim().length === 0) {
    console.error("Media proxy error: Invalid key path", { key: keyPath, params: params.key });
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }

  // Log the incoming key for debugging
  console.log("Media proxy request:", { key: keyPath, bucket: process.env.MINIO_BUCKET });

  try {
    const object = await getDocumentObject(keyPath);

    if (!object) {
      console.error("Media proxy error: Object not found", { key: keyPath });
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const webStream = readableToWebStream(object.stream);
    const headers = new Headers();

    headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=60");
    headers.set("Content-Type", object.contentType || "application/octet-stream");

    if (object.contentLength) {
      headers.set("Content-Length", object.contentLength.toString());
    }

    if (object.lastModified) {
      headers.set("Last-Modified", object.lastModified.toUTCString());
    }

    return new NextResponse(webStream, { headers });
  } catch (error: any) {
    // Log detailed error information
    console.error("Media proxy error:", {
      error: error.message,
      code: error.Code || error.code,
      key: keyPath,
      bucket: process.env.MINIO_BUCKET,
      stack: error.stack,
    });
    
    // Return appropriate error response
    if (error.Code === "NoSuchKey" || error.code === "NoSuchKey") {
      return NextResponse.json(
        { error: "Media not found", details: `Key "${keyPath}" does not exist in bucket` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ error: "Media unavailable" }, { status: 500 });
  }
}

