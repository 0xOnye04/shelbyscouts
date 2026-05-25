import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { prepareShelbyVideoUpload } from "@/lib/shelbystream";

const MAX_DIRECT_VIDEO_BYTES = 250 * 1024 * 1024;

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Video uploads require DATABASE_URL to be configured." },
      { status: 503 }
    );
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

  try {
    const body = await request.json();
    const title = body.title?.toString() || "Untitled highlight";
    const description = body.description?.toString() || "";
    const fileName = body.fileName?.toString() || "clip.mp4";
    const walletAddress = body.walletAddress?.toString() || "";
    const blobMerkleRoot = body.blobMerkleRoot?.toString() || "";
    const fileSize = Number(body.fileSize || 0);

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Connect Petra or Martian wallet before uploading." },
        { status: 400 }
      );
    }

    if (!blobMerkleRoot || !blobMerkleRoot.startsWith("0x")) {
      return NextResponse.json(
        { error: "Shelby blob commitment is missing or invalid." },
        { status: 400 }
      );
    }

    if (!fileSize || fileSize > MAX_DIRECT_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "Upload a video clip up to 250 MB." },
        { status: 413 }
      );
    }

    const media = await prepareShelbyVideoUpload({
      fileName,
      title,
      walletAddress,
      fileSize,
      blobMerkleRoot,
    });

    const video = await prisma.video.create({
      data: {
        title,
        description,
        url: media.url,
        thumbnailUrl: media.thumbnailUrl,
        storageProvider: "shelby-uploading",
        storageAssetId: media.storageAssetId,
        storageProof: media.storageProof,
        isShelbyStored: false,
        playerId: user.id,
      },
    });

    return NextResponse.json({
      video,
      upload: {
        network: media.network,
        accountAddress: media.accountAddress,
        blobName: media.blobName,
        url: media.url,
        storageAssetId: media.storageAssetId,
        storageProof: media.storageProof,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to prepare Shelby upload.",
      },
      { status: 500 }
    );
  }
}
