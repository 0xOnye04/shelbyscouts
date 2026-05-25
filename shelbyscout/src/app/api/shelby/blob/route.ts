import { NextResponse } from "next/server";
import { downloadShelbyBlob, getShelbyBlobSize } from "@/lib/shelbystream";

function getContentType(blobName: string) {
  const extension = blobName.split(".").pop()?.toLowerCase();

  if (extension === "webm") {
    return "video/webm";
  }

  if (extension === "mov") {
    return "video/quicktime";
  }

  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "gif") {
    return "image/gif";
  }

  return "video/mp4";
}

function parseRangeHeader(rangeHeader: string | null) {
  if (!rangeHeader) {
    return null;
  }

  const match = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);

  if (!match) {
    return null;
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : undefined;

  if (!Number.isFinite(start) || start < 0) {
    return null;
  }

  if (
    requestedEnd !== undefined &&
    (!Number.isFinite(requestedEnd) || requestedEnd < start)
  ) {
    return null;
  }

  return {
    start,
    end: requestedEnd ?? start + 1024 * 1024 - 1,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const account = searchParams.get("account");
  const blobName = searchParams.get("name");
  const requestedRange = parseRangeHeader(request.headers.get("range"));

  if (!account || !blobName) {
    return NextResponse.json(
      { error: "Missing Shelby account or blob name." },
      { status: 400 }
    );
  }

  if (!process.env.SHELBY_API_KEY) {
    return NextResponse.json(
      { error: "SHELBY_API_KEY is required to stream Shelby blobs." },
      { status: 503 }
    );
  }

  try {
    const totalSize = await getShelbyBlobSize(account, blobName);
    const safeRange =
      requestedRange && totalSize
        ? {
            start: Math.min(requestedRange.start, totalSize - 1),
            end: Math.min(requestedRange.end, totalSize - 1),
          }
        : requestedRange;
    const blob = await downloadShelbyBlob(account, blobName, safeRange ?? undefined);
    const headers = new Headers({
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(blob.contentLength),
      "Content-Type": getContentType(blobName),
    });

    if (safeRange) {
      const responseEnd = safeRange.start + blob.contentLength - 1;
      headers.set(
        "Content-Range",
        `bytes ${safeRange.start}-${responseEnd}/${totalSize || "*"}`
      );
    }

    return new Response(blob.readable, {
      status: safeRange ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unable to stream Shelby blob." },
      { status: 500 }
    );
  }
}
