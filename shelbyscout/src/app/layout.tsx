import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { HeaderNav } from "@/components/HeaderNav";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShelbyScout | Decentralized Football Talent Clips",
  description:
    "Discover emerging football talent through short videos, scouting data, and Shelby-powered decentralized storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#030509] text-slate-100 antialiased">
        <Providers>
          <div className="mx-auto min-h-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-4xl border border-white/10 bg-slate-950/80 px-6 py-5 shadow-xl shadow-cyan-500/10 backdrop-blur-xl">
              <div>
                <Link href="/" className="text-xl font-semibold tracking-tight text-white">
                  ShelbyScout
                </Link>
                <p className="text-sm text-slate-400">Football clips, scouting data, and Shelby storage.</p>
              </div>
              <HeaderNav />
            </header>
            <main>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
