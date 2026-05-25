"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import Link from "next/link";

type PlayerSummary = {
  id: string;
  name?: string | null;
  position?: string | null;
  rating: number;
  popularity: number;
  profileImage?: string | null;
  bio?: string | null;
  nationality?: string | null;
  academyClub?: string | null;
};

type ScoutDashboardProps = {
  players: PlayerSummary[];
};

const positions = ["All", "Forward", "Midfielder", "Defender", "Goalkeeper"];

export function ScoutDashboard({ players }: ScoutDashboardProps) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesPosition =
        position === "All" || player.position === position;
      const matchesSearch =
        !search ||
        player.name?.toLowerCase().includes(search.toLowerCase()) ||
        player.position?.toLowerCase().includes(search.toLowerCase()) ||
        player.nationality?.toLowerCase().includes(search.toLowerCase()) ||
        player.academyClub?.toLowerCase().includes(search.toLowerCase()) ||
        player.bio?.toLowerCase().includes(search.toLowerCase());

      return matchesPosition && matchesSearch;
    });
  }, [players, position, search]);

  return (
    <section className="space-y-8 py-10">
      <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-cyan-500/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Discovery console</p>
            <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Find standout players from the clip feed</h2>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Upload new clip
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Players monitored</p>
            <p className="mt-3 text-3xl font-semibold text-white">{players.length}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Top performer</p>
            <p className="mt-3 text-3xl font-semibold text-white">{players[0]?.name || "—"}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">Most trending</p>
            <p className="mt-3 text-3xl font-semibold text-white">{players[0]?.popularity || 0}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4 rounded-4xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-white">Filter players</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, position, or skill"
                className="w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              />
              <select
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                className="w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              >
                {positions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => (
                <Link
                  href={`/players/${player.id}`}
                  key={player.id}
                  className="rounded-3xl border border-white/10 bg-slate-900 p-5 transition hover:border-cyan-400/20 hover:bg-slate-900/95"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-3xl bg-slate-800">
                      <Image
                        src={player.profileImage || "/player-placeholder.svg"}
                        alt={player.name ?? "Player"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{player.name}</h4>
                      <p className="text-sm text-slate-400">{player.position}</p>
                      <p className="text-xs text-slate-500">
                        {[player.nationality, player.academyClub].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
                    <span>Rating {player.rating}</span>
                    <span>{player.popularity}% trending</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/80 p-8 text-center text-slate-400">
                No players match that search.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 shadow-xl shadow-slate-950/10">
          <h3 className="text-xl font-semibold text-white">What scouts can do</h3>
          <p className="mt-3 text-slate-400">
            Use ShelbyScout like a football-native short-video network with scouting context layered on top.
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Filter prospects by position, role, rating, and profile details.</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Open player pages with stats, bios, and match or training reels.</p>
            </div>
            <div className="rounded-3xl border border-white/5 bg-slate-900/80 p-4">
              <p className="text-sm text-slate-400">Stream media through the Shelby integration layer when credentials are configured.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
