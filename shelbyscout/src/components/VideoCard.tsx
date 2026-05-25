import Image from "next/image";

type VideoCardProps = {
  video: {
    id: string;
    title: string;
    description?: string | null;
    thumbnailUrl: string;
    url: string;
    playerName?: string | null;
  };
};

export function VideoCard({ video }: VideoCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 shadow-sm transition hover:-translate-y-1 hover:border-cyan-400/20">
      <div className="relative h-64 overflow-hidden bg-slate-900">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <a
          href={video.url}
          className="absolute bottom-4 right-4 rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Stream
        </a>
      </div>
      <div className="p-4">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300/80">{video.playerName}</p>
        <h3 className="mt-2 text-xl font-semibold text-white">{video.title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-300 line-clamp-3">
          {video.description}
        </p>
      </div>
    </div>
  );
}
