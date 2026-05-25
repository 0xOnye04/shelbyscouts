"use client";

import { useState } from "react";
import Link from "next/link";

async function getErrorMessage(response: Response, fallback: string) {
  const text = await response.text();

  if (!text) {
    return fallback;
  }

  try {
    const payload = JSON.parse(text);
    return payload?.error || fallback;
  } catch {
    return fallback;
  }
}

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("PLAYER");
  const [position, setPosition] = useState("");
  const [age, setAge] = useState(18);
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, position, age, bio }),
      });

      if (!response.ok) {
        setError(await getErrorMessage(response, "Unable to create account."));
        return;
      }
    } catch {
      setError("Unable to reach the signup service. Please try again.");
      return;
    } finally {
      setLoading(false);
    }

    setStatus("Account created successfully. You can now sign in.");
    setName("");
    setEmail("");
    setPassword("");
    setPosition("");
    setAge(18);
    setBio("");
  };

  return (
    <div className="mx-auto max-w-2xl py-16 px-4 sm:px-6 lg:px-8">
      <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-10 shadow-xl shadow-cyan-500/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Create your ShelbyScout account</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Launch your scouting profile.</h1>
        <p className="mt-4 text-slate-400">Players and scouts can sign up today to share footage, filter talent, and stream highlights.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Account type</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              >
                <option value="PLAYER">Player</option>
                <option value="SCOUT">Scout</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Position</span>
              <input
                type="text"
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                placeholder="Forward, Midfielder, Defender"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Age</span>
              <input
                type="number"
                value={age}
                onChange={(event) => setAge(Number(event.target.value))}
                min={14}
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Bio</span>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={4}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
            />
          </label>
          {status && <p className="text-sm text-cyan-300">{status}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Already registered?{' '}
          <Link href="/signin" className="text-cyan-300 hover:text-cyan-200">
            Sign in.
          </Link>
        </p>
      </div>
    </div>
  );
}
