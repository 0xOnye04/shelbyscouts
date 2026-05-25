import { getServerSession } from "next-auth";
import { after, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_VIDEO_THUMBNAIL_URL,
  uploadVideoBytesToShelby,
} from "@/lib/shelbystream";

const MAX_VIDEO_BYTES = 75 * 1024 * 1024;
const DEMO_VIDEO_URL =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({ where: { email: session.user.email } });
}

function missingDatabaseResponse() {
  return NextResponse.json(
    { error: "Video uploads require DATABASE_URL to be configured." },
    { status: 503 }
  );
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return missingDatabaseResponse();
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const videos = await prisma.video.findMany({
    where: { playerId: user.id },
    orderBy: { uploadedAt: "desc" },
  });

  return NextResponse.json({ videos });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return missingDatabaseResponse();
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PLAYER") {
    return NextResponse.json(
      { error: "Only player accounts can upload videos." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const title = formData.get("title")?.toString() || "Untitled highlight";
  const description = formData.get("description")?.toString() || "";
  const walletAddress = formData.get("walletAddress")?.toString() || "";
  const file = formData.get("videoFile");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No video file provided." }, { status: 400 });
  }

  if (file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json(
      { error: "Upload short clips up to 75 MB so ShelbyScout can process them quickly." },
      { status: 413 }
    );
  }

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Connect Petra or Martian wallet before uploading." },
      { status: 400 }
    );
  }

  try {
    const blobData = new Uint8Array(await file.arrayBuffer());

    const video = await prisma.video.create({
      data: {
        title,
        description,
        url: DEMO_VIDEO_URL,
        thumbnailUrl: DEFAULT_VIDEO_THUMBNAIL_URL,
        storageProvider: "shelby-pending",
        storageProof: "Shelby upload accepted. Storage proof is processing.",
        isShelbyStored: false,
        playerId: user.id,
      },
    });

    after(async () => {
      try {
        const media = await uploadVideoBytesToShelby({
          blobData,
          fileName: file.name,
          title,
          description,
          walletAddress,
        });

        await prisma.video.update({
          where: { id: video.id },
          data: {
            url: media.url,
            thumbnailUrl: media.thumbnailUrl,
            storageProvider: media.storageProvider,
            storageAssetId: media.storageAssetId,
            storageProof: media.storageProof,
            isShelbyStored: media.isShelbyStored,
          },
        });
      } catch (backgroundError) {
        console.error(backgroundError);
        await prisma.video.update({
          where: { id: video.id },
          data: {
            storageProvider: "shelby-failed",
            storageProof:
              backgroundError instanceof Error
                ? backgroundError.message
                : "Shelby upload failed in the background.",
            isShelbyStored: false,
          },
        });
      }
    });

    return NextResponse.json({ video, queued: true }, { status: 202 });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && process.env.NODE_ENV !== "production"
        ? error.message
        : "Unable to upload video.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
