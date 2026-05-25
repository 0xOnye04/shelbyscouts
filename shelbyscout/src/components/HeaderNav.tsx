"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

const linkClass =
  "rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-cyan-400/40 hover:text-white";

export function HeaderNav() {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated" && Boolean(session?.user);

  return (
    <nav className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
      <Link href="/dashboard" className={linkClass}>
        Discover
      </Link>
      {isSignedIn && (
        <>
          <Link href="/upload" className={linkClass}>
            Upload
          </Link>
          <Link href="/profile" className={linkClass}>
            Profile
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 transition hover:border-cyan-400/40 hover:text-white"
          >
            Sign out
          </button>
        </>
      )}
      {!isSignedIn && (
        <Link
          href="/signin"
          className="rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}
