import { prisma } from "@/lib/prisma";
import { ScoutDashboard } from "@/components/ScoutDashboard";
import { samplePlayers } from "@/lib/sample-data";

export const metadata = {
  title: "Discover Clips | ShelbyScout",
  description: "Short football clips, performance data, and scouting filters for clubs.",
};

export default async function DashboardPage() {
  const players = process.env.DATABASE_URL
    ? await prisma.user.findMany({
        where: { role: "PLAYER" },
        orderBy: { popularity: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          position: true,
          rating: true,
          popularity: true,
          profileImage: true,
          bio: true,
          nationality: true,
          academyClub: true,
        },
      })
    : samplePlayers;

  return (
    <div className="space-y-8 py-10">
      <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-cyan-500/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Global scouting</p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
          Discover short-form football clips before the whole world sees them.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
          Filter emerging players, review performance signals, and open Shelby-backed highlight reels from Africa and beyond.
        </p>
      </div>
      <ScoutDashboard players={players} />
    </div>
  );
}
