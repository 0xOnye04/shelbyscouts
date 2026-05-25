import Image from "next/image";
import Link from "next/link";

type PlayerCardProps = {
  player: {
    id: string;
    name?: string | null;
    position?: string | null;
    rating: number;
    popularity: number;
    profileImage?: string | null;
    bio?: string | null;
  };
};

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="group overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-5 transition hover:-translate-y-1 hover:border-cyan-400/20 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.2)]"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-3xl bg-slate-900">
          <Image
            src={player.profileImage || "/player-placeholder.svg"}
            alt={player.name ?? "Player"}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{player.name}</h3>
          <p className="text-sm text-slate-400">{player.position || "Position"}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300 line-clamp-3">
        {player.bio || "Elite football talent with scouting-ready skills."}
      </p>
      <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
        <span>Rating {player.rating}</span>
        <span>{player.popularity}% trending</span>
      </div>
    </Link>
  );
}
