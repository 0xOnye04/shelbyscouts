import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlayerCard } from "@/components/PlayerCard";
import { VideoCard } from "@/components/VideoCard";
import { samplePlayers, sampleVideos } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const players = process.env.DATABASE_URL
    ? await prisma.user.findMany({
        where: { role: "PLAYER" },
        orderBy: { popularity: "desc" },
        take: 4,
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

  const videos = process.env.DATABASE_URL
    ? await prisma.video.findMany({
        orderBy: { uploadedAt: "desc" },
        take: 4,
        include: { player: true },
      })
    : sampleVideos;

  return (
    <div className="space-y-16 py-10">
      <section className="overflow-hidden rounded-4xl border border-white/10 bg-slate-950/80 shadow-xl shadow-cyan-500/10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 p-8 sm:p-10">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Powered by Shelby</p>
            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              A decentralized football clip network for the next stars.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              Players upload highlights, training clips, and performance data. Scouts and clubs stream them instantly through Shelby-backed storage, with a special focus on emerging talent across Africa.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-7 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                Watch clips
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-full border border-white/10 px-7 py-4 text-sm font-semibold text-white transition hover:border-cyan-400/40 hover:text-white">
                Create profile
              </Link>
            </div>
            <div className="grid gap-3 pt-4 sm:grid-cols-3">
              {[
                ["Short video", "TikTok-style reels for football moments"],
                ["Scout-ready", "Stats, position, role, and clip context"],
                ["Crypto-native", "Built for Shelby media and Web3 growth"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="min-h-full bg-[linear-gradient(160deg,_#0b1220,_#041f2d_50%,_#060809)] p-6 sm:p-8">
            <div className="mx-auto max-w-sm space-y-4">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl shadow-cyan-500/10">
                <video
                  className="aspect-[9/16] w-full object-cover"
                  src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
                  poster="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="space-y-2 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Shelby clip feed</p>
                  <h2 className="text-2xl font-semibold text-white">Kofi Mensah goal burst</h2>
                  <p className="text-sm text-slate-400">Accra forward • 96% trending • stored for global playback</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-lg font-semibold text-white">4.8k</p>
                  <p className="text-xs text-slate-400">views</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-lg font-semibold text-white">31</p>
                  <p className="text-xs text-slate-400">goals</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-lg font-semibold text-white">12</p>
                  <p className="text-xs text-slate-400">clubs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Trending players</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Emerging talent scouts are watching now</h2>
          </div>
          <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/40">
            View all prospects
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">ShelbyStream highlights</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Short clips built for global streaming</h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {videos.map((video) => {
            const playerName =
              "player" in video
                ? video.player?.name ?? "Player"
                : video.playerName ?? "Player";

            return (
              <VideoCard
                key={video.id}
                video={{
                  id: video.id,
                  title: video.title,
                  description: video.description ?? "",
                  thumbnailUrl: video.thumbnailUrl,
                  url: video.url,
                  playerName,
                }}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
