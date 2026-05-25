import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function clampStat(value: unknown, fallback: number) {
  const numberValue = optionalNumber(value);

  if (numberValue === null) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(numberValue)));
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return prisma.user.findUnique({ where: { email: session.user.email } });
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    profile: {
      ...user,
      ageLocked: user.age !== null,
      nationalityLocked: Boolean(user.nationality),
    },
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "PLAYER") {
    return NextResponse.json(
      { error: "Only player accounts can edit player profiles." },
      { status: 403 }
    );
  }

  const body = await request.json();
  const nextAge = optionalNumber(body.age);
  const nextNationality = optionalString(body.nationality);

  if (user.age !== null && nextAge !== null && nextAge !== user.age) {
    return NextResponse.json(
      { error: "Age can only be updated once." },
      { status: 400 }
    );
  }

  if (
    user.nationality &&
    nextNationality &&
    nextNationality !== user.nationality
  ) {
    return NextResponse.json(
      { error: "Nationality can only be updated once." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: optionalString(body.name),
      age: user.age ?? nextAge,
      nationality: user.nationality ?? nextNationality,
      position: optionalString(body.position),
      height: optionalString(body.height),
      preferredFoot: optionalString(body.preferredFoot),
      academyClub: optionalString(body.academyClub),
      bio: optionalString(body.bio),
      profileImage: optionalString(body.profileImage),
      rating: clampStat(body.rating, user.rating),
      speed: clampStat(body.speed, user.speed),
      agility: clampStat(body.agility, user.agility),
      goals: Math.max(0, optionalNumber(body.goals) ?? user.goals),
      assists: Math.max(0, optionalNumber(body.assists) ?? user.assists),
      socialInstagram: optionalString(body.socialInstagram),
      socialX: optionalString(body.socialX),
      socialTikTok: optionalString(body.socialTikTok),
      socialYouTube: optionalString(body.socialYouTube),
    },
  });

  return NextResponse.json({
    profile: {
      ...updated,
      ageLocked: updated.age !== null,
      nationalityLocked: Boolean(updated.nationality),
    },
  });
}
