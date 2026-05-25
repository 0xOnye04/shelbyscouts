import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.video.deleteMany();
  await prisma.user.deleteMany();

  const players = [
    {
      name: "Jayden Flores",
      email: "jayden@scout.test",
      role: "PLAYER",
      bio: "Dynamic striker with highlight reels full of explosive finishing and off-ball movement.",
      position: "Forward",
      age: 19,
      rating: 88,
      speed: 91,
      agility: 90,
      goals: 28,
      assists: 12,
      profileImage: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=500&q=60",
      coverImage: "https://images.unsplash.com/photo-1508606572321-901ea4437072?auto=format&fit=crop&w=1200&q=80",
      popularity: 93,
    },
    {
      name: "Maya Carter",
      email: "maya@scout.test",
      role: "PLAYER",
      bio: "Midfield engine known for accurate distribution, ball retention, and vision in the final third.",
      position: "Midfielder",
      age: 21,
      rating: 85,
      speed: 84,
      agility: 86,
      goals: 10,
      assists: 18,
      profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=60",
      coverImage: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
      popularity: 86,
    },
    {
      name: "Noah Reed",
      email: "noah@scout.test",
      role: "PLAYER",
      bio: "Electric wingback with strong crossing ability and relentless defensive support.",
      position: "Defender",
      age: 20,
      rating: 82,
      speed: 88,
      agility: 85,
      goals: 5,
      assists: 14,
      profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=60",
      coverImage: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=1200&q=80",
      popularity: 79,
    },
  ];

  for (const player of players) {
    const passwordHash = await hash("DemoPass123!", 10);

    const user = await prisma.user.create({
      data: {
        name: player.name,
        email: player.email,
        role: player.role,
        bio: player.bio,
        position: player.position,
        age: player.age,
        rating: player.rating,
        speed: player.speed,
        agility: player.agility,
        goals: player.goals,
        assists: player.assists,
        profileImage: player.profileImage,
        coverImage: player.coverImage,
        popularity: player.popularity,
        hashedPassword: passwordHash,
      },
    });

    await prisma.video.create({
      data: {
        title: `${player.name} Highlight Reel`,
        description: `Watch ${player.name} dominate the field with speed, vision and finishing.`,
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
        playerId: user.id,
      },
    });

    await prisma.video.create({
      data: {
        title: `${player.name} Training Session`,
        description: "Skills, agility and set-piece preparation from the next generation of talent.",
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        thumbnailUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=800&q=80",
        playerId: user.id,
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
