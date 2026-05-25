import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadImageFileToShelby } from "@/lib/shelbystream";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PLAYER") {
    return NextResponse.json(
      { error: "Only player accounts can upload profile pictures." },
      { status: 403 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("profileImage");
  const walletAddress = formData.get("walletAddress")?.toString() || user.id;

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No profile picture was provided." },
      { status: 400 }
    );
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Upload a JPG, PNG, WebP, or GIF image." },
      { status: 400 }
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Profile picture must be 5 MB or smaller." },
      { status: 413 }
    );
  }

  try {
    const upload = await uploadImageFileToShelby({
      file,
      title: `${user.name || "player"} profile picture`,
      walletAddress,
    });

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        profileImage: upload.url,
      },
    });

    return NextResponse.json({
      profileImage: updated.profileImage,
      storageProvider: upload.storageProvider,
      storageProof: upload.storageProof,
      isShelbyStored: upload.isShelbyStored,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to upload profile picture.",
      },
      { status: 500 }
    );
  }
}
