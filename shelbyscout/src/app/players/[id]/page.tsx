import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSamplePlayer, getSampleVideosForPlayer } from "@/lib/sample-data";

export const dynamic = "force-dynamic";

type PlayerVideo = {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl: string;
  storageProvider?: string | null;
  storageProof?: string | null;
  isShelbyStored?: boolean;
};

type PlayerProfile = {
  id: string;
  name?: string | null;
  role?: string | null;
  bio?: string | null;
  position?: string | null;
  age?: number | null;
  nationality?: string | null;
  height?: string | null;
  preferredFoot?: string | null;
  academyClub?: string | null;
  socialInstagram?: string | null;
  socialX?: string | null;
  socialTikTok?: string | null;
  socialYouTube?: string | null;
  rating: number;
  speed: number;
  agility: number;
  goals: number;
  assists: number;
  profileImage?: string | null;
  coverImage?: string | null;
  popularity: number;
  videos?: PlayerVideo[];
};

export const metadata = {
  title: "Player profile | ShelbyScout",
  description: "View player stats, short clips, highlight videos, and scouting profile.",
};

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let player: PlayerProfile | undefined = getSamplePlayer(id);
  let databaseAvailable = false;

  if (process.env.DATABASE_URL) {
    try {
      const dbPlayer = await prisma.user.findUnique({
          where: { id },
          include: { videos: { orderBy: { uploadedAt: "desc" } } },
        });

      player = dbPlayer ?? undefined;
      databaseAvailable = true;
    } catch (error) {
      console.error("Unable to load player profile", error);
    }
  }

  const videos: PlayerVideo[] = databaseAvailable
    ? player && "videos" in player
      ? player.videos ?? []
      : []
    : getSampleVideosForPlayer(id);

  if (!player || (databaseAvailable && "role" in player && player.role !== "PLAYER")) {
    notFound();
  }

  const details = [
    ["Nationality", "nationality" in player ? player.nationality : null],
    ["Height", "height" in player ? player.height : null],
    ["Preferred foot", "preferredFoot" in player ? player.preferredFoot : null],
    ["Academy/club", "academyClub" in player ? player.academyClub : null],
  ];

  const socialLinks = [
    ["Instagram", "socialInstagram" in player ? player.socialInstagram : null],
    ["X", "socialX" in player ? player.socialX : null],
    ["TikTok", "socialTikTok" in player ? player.socialTikTok : null],
    ["YouTube", "socialYouTube" in player ? player.socialYouTube : null],
  ].filter(([, url]) => Boolean(url));

  return (
    <div className="space-y-8 py-10">
      <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 shadow-xl shadow-cyan-500/10">
        <div className="relative h-80 bg-slate-900">
          <Image
            src={player.coverImage || "/player-cover.svg"}
            alt={player.name || "Player"}
            fill
            sizes="(min-width: 1024px) 1216px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
          <div className="absolute bottom-8 left-8 flex flex-col gap-4 text-white">
            <p className="uppercase tracking-[0.35em] text-cyan-300/80">{player.position || "Player"}</p>
            <h1 className="text-5xl font-semibold tracking-tight">{player.name || "Player"}</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-200/80">{player.bio}</p>
          </div>
        </div>

        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-4xl border border-white/10 bg-slate-950/80 p-8">
              <h2 className="text-2xl font-semibold text-white">Player stats</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Age", value: player.age ?? "-" },
                  { label: "Rating", value: player.rating },
                  { label: "Speed", value: player.speed },
                  { label: "Agility", value: player.agility },
                  { label: "Goals", value: player.goals },
                  { label: "Assists", value: player.assists },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-3xl bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-4xl border border-white/10 bg-slate-950/80 p-8">
              <h2 className="text-2xl font-semibold text-white">Recent uploads</h2>
              <div className="mt-6 space-y-4">
                {videos.length ? (
                  videos.map((video) => (
                    <article key={video.id} className="rounded-3xl border border-white/10 bg-slate-900 p-5">
                      <h3 className="text-xl font-semibold text-white">{video.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{video.description}</p>
                      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">
                        <p className="font-semibold text-white">
                          {"storageProvider" in video &&
                          video.storageProvider === "shelby-pending"
                            ? "Processing on Shelby"
                            : "isShelbyStored" in video && video.isShelbyStored
                            ? "Stored on Shelby"
                            : "Demo storage"}
                        </p>
                        <p className="mt-2 break-all text-slate-400">
                          {"storageProof" in video && video.storageProof
                            ? video.storageProof
                            : "No Shelby proof is available for this clip."}
                        </p>
                      </div>
                      <div className="mt-4 overflow-hidden rounded-3xl border border-white/10 bg-black">
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          src={video.url}
                          className="h-[240px] w-full object-cover"
                          poster={video.thumbnailUrl}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Open stream
                        </a>
                        <span className="text-sm text-slate-400">
                          Scouts can stream this clip directly in the player.
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900 p-8 text-slate-400">
                    No video clips have been uploaded yet.
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8">
              <h2 className="text-2xl font-semibold text-white">About this player</h2>
              <p className="mt-4 text-slate-400 leading-7">{player.bio}</p>
            </div>
            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8">
              <h2 className="text-2xl font-semibold text-white">Player details</h2>
              <div className="mt-5 space-y-3">
                {details.map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/80 p-4 text-sm"
                  >
                    <span className="text-slate-400">{label}</span>
                    <span className="text-right font-semibold text-white">
                      {value || "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8">
              <h2 className="text-2xl font-semibold text-white">Social links</h2>
              <div className="mt-5 flex flex-wrap gap-3">
                {socialLinks.length ? (
                  socialLinks.map(([label, url]) => (
                    <a
                      key={label}
                      href={String(url)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40"
                    >
                      {label}
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    No social links added yet.
                  </p>
                )}
              </div>
            </div>
            <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8">
              <h2 className="text-2xl font-semibold text-white">Scouting summary</h2>
              <ul className="mt-4 space-y-3 text-slate-300">
                <li className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Short clips make key moments easy to review and share.</li>
                <li className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Performance data supports faster scout comparisons.</li>
                <li className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">Shelby media storage keeps highlights ready for global playback.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
