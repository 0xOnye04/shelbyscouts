import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({ where: { email: session.user.email } });
}

async function findOwnedVideo(videoId: string, userId: string) {
  return prisma.video.findFirst({
    where: {
      id: videoId,
      playerId: userId,
    },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await findOwnedVideo(id, user.id);

  if (!video) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  const body = await request.json();
  const title = cleanText(body.title);
  const description = cleanText(body.description);

  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const updated = await prisma.video.update({
    where: { id: video.id },
    data: {
      title,
      description,
    },
  });

  return NextResponse.json({ video: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const video = await findOwnedVideo(id, user.id);

  if (!video) {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }

  await prisma.video.delete({ where: { id: video.id } });

  return NextResponse.json({ ok: true });
}
