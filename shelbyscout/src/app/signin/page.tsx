"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError("Unable to sign in. Check your credentials.");
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="mx-auto max-w-2xl py-16 px-4 sm:px-6 lg:px-8">
      <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-10 shadow-xl shadow-cyan-500/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Scout or player login</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Welcome back to ShelbyScout.</h1>
        <p className="mt-4 text-slate-400">Enter your credentials to discover or upload talent instantly.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          New to ShelbyScout?{' '}
          <Link href="/signup" className="text-cyan-300 hover:text-cyan-200">
            Create an account.
          </Link>
        </p>
      </div>
    </div>
  );
}
