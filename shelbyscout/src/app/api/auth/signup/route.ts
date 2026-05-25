import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Signup requires DATABASE_URL to be configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, role, position, age, bio } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (role !== "PLAYER" && role !== "SCOUT") {
      return NextResponse.json({ error: "Invalid account type." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        hashedPassword,
        position: position || undefined,
        age: age ? Number(age) : undefined,
        bio: bio || undefined,
        profileImage:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=60",
        coverImage:
          "https://images.unsplash.com/photo-1495563923587-bdc4282494d0?auto=format&fit=crop&w=1200&q=80",
      },
    });

    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name, role: user.role } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && process.env.NODE_ENV !== "production"
        ? error.message
        : "Unable to create account.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
