import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  try {
    const body = await request.json();
    const videoId = body.videoId?.toString();

    if (!videoId) {
      return NextResponse.json({ error: "Missing video id." }, { status: 400 });
    }

    const video = await prisma.video.findFirst({
      where: { id: videoId, playerId: user.id },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found." }, { status: 404 });
    }

    const updated = await prisma.video.update({
      where: { id: video.id },
      data: {
        storageProvider: "shelby",
        isShelbyStored: true,
      },
    });

    return NextResponse.json({ video: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to complete Shelby upload.",
      },
      { status: 500 }
    );
  }
}
