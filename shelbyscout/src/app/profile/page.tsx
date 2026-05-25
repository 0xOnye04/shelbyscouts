"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useAptosWallet } from "@/components/AptosWalletPanel";

type PlayerProfile = {
  name?: string | null;
  age?: number | null;
  ageLocked?: boolean;
  nationality?: string | null;
  nationalityLocked?: boolean;
  position?: string | null;
  height?: string | null;
  preferredFoot?: string | null;
  academyClub?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  rating: number;
  speed: number;
  agility: number;
  goals: number;
  assists: number;
  socialInstagram?: string | null;
  socialX?: string | null;
  socialTikTok?: string | null;
  socialYouTube?: string | null;
};

const emptyProfile: PlayerProfile = {
  name: "",
  age: null,
  ageLocked: false,
  nationality: "",
  nationalityLocked: false,
  position: "",
  height: "",
  preferredFoot: "",
  academyClub: "",
  bio: "",
  profileImage: "",
  rating: 75,
  speed: 75,
  agility: 75,
  goals: 0,
  assists: 0,
  socialInstagram: "",
  socialX: "",
  socialTikTok: "",
  socialYouTube: "",
};

const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
const feet = ["Right", "Left", "Both"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function ProfilePage() {
  const { data: session } = useSession();
  const wallet = useAptosWallet();
  const [profile, setProfile] = useState<PlayerProfile>(emptyProfile);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadProof, setImageUploadProof] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/profile");
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error || "Unable to load profile.");
        return;
      }

      setProfile({ ...emptyProfile, ...payload.profile });
    }

    if (session) {
      loadProfile().catch(() => setError("Unable to load profile."));
    }
  }, [session]);

  function updateField(field: keyof PlayerProfile, value: string | number) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to save profile.");
      }

      setProfile({ ...emptyProfile, ...payload.profile });
      setStatus("Profile saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfilePicture() {
    if (!profileImageFile) {
      setError("Choose a profile picture first.");
      return;
    }

    if (profileImageFile.size > MAX_IMAGE_BYTES) {
      setError("Profile picture must be 5 MB or smaller.");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", profileImageFile);
    if (wallet.address) {
      formData.append("walletAddress", wallet.address);
    }

    setImageUploading(true);
    setStatus(null);
    setError(null);
    setImageUploadProof(null);

    try {
      const response = await fetch("/api/profile/image", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to upload profile picture.");
      }

      setProfile((current) => ({
        ...current,
        profileImage: payload.profileImage,
      }));
      setProfileImageFile(null);
      setImageUploadProof(
        payload.isShelbyStored
          ? `Shelby proof: ${payload.storageProof || payload.profileImage}`
          : payload.storageProof || "Profile image saved with demo storage."
      );
      setStatus("Profile picture uploaded.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Profile picture upload failed."
      );
    } finally {
      setImageUploading(false);
    }
  }

  if (!session) {
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-xl font-semibold text-white">
          Sign in to manage your player profile.
        </p>
        <Link
          href="/signin"
          className="inline-flex rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (session.user.role !== "PLAYER") {
    return (
      <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 text-center">
        <p className="text-xl font-semibold text-white">
          Scout accounts can browse players from Discover.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-10">
      <section className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-cyan-500/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
          Player profile
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white">
          Manage your scouting details.
        </h1>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-4xl border border-white/10 bg-slate-950/80 p-8"
      >
        <section className="rounded-3xl border border-white/10 bg-slate-900 p-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-3xl bg-slate-950">
                <Image
                  src={profile.profileImage || "/player-placeholder.svg"}
                  alt={profile.name || "Player profile picture"}
                  fill
                  sizes="96px"
                  unoptimized={profile.profileImage?.startsWith("/api/shelby/blob")}
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
                  Profile picture
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Upload a JPG, PNG, WebP, or GIF image up to 5 MB.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:min-w-80">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const selectedFile = event.target.files?.[0] ?? null;
                  setProfileImageFile(selectedFile);
                  setError(
                    selectedFile && selectedFile.size > MAX_IMAGE_BYTES
                      ? "Profile picture must be 5 MB or smaller."
                      : null
                  );
                }}
                className="w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none file:cursor-pointer file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:text-slate-950"
              />
              <button
                type="button"
                onClick={uploadProfilePicture}
                disabled={!profileImageFile || imageUploading}
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                {imageUploading ? "Uploading picture..." : "Upload picture"}
              </button>
            </div>
          </div>
          {imageUploadProof && (
            <p className="mt-4 break-all text-sm text-cyan-200">
              {imageUploadProof}
            </p>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">
              Full name
            </span>
            <input
              value={profile.name ?? ""}
              onChange={(event) => updateField("name", event.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Age</span>
            <input
              type="number"
              min="8"
              max="60"
              disabled={profile.ageLocked}
              value={profile.age ?? ""}
              onChange={(event) => updateField("age", event.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none disabled:text-slate-500 focus:border-cyan-400/50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">
              Nationality
            </span>
            <input
              disabled={profile.nationalityLocked}
              value={profile.nationality ?? ""}
              onChange={(event) =>
                updateField("nationality", event.target.value)
              }
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none disabled:text-slate-500 focus:border-cyan-400/50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">
              Position
            </span>
            <select
              value={profile.position ?? ""}
              onChange={(event) => updateField("position", event.target.value)}
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
            >
              <option value="">Select position</option>
              {positions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Height</span>
            <input
              value={profile.height ?? ""}
              onChange={(event) => updateField("height", event.target.value)}
              placeholder="Example: 178 cm"
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">
              Preferred foot
            </span>
            <select
              value={profile.preferredFoot ?? ""}
              onChange={(event) =>
                updateField("preferredFoot", event.target.value)
              }
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
            >
              <option value="">Select foot</option>
              {feet.map((foot) => (
                <option key={foot} value={foot}>
                  {foot}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">
              Academy/club
            </span>
            <input
              value={profile.academyClub ?? ""}
              onChange={(event) =>
                updateField("academyClub", event.target.value)
              }
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Bio</span>
          <textarea
            rows={5}
            value={profile.bio ?? ""}
            onChange={(event) => updateField("bio", event.target.value)}
            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-5">
          {(["rating", "speed", "agility", "goals", "assists"] as const).map(
            (field) => (
              <label key={field} className="block">
                <span className="text-sm font-medium capitalize text-slate-200">
                  {field}
                </span>
                <input
                  type="number"
                  min="0"
                  max={field === "goals" || field === "assists" ? 999 : 100}
                  value={profile[field]}
                  onChange={(event) => updateField(field, event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                />
              </label>
            )
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["socialInstagram", "Instagram"],
            ["socialX", "X"],
            ["socialTikTok", "TikTok"],
            ["socialYouTube", "YouTube"],
          ].map(([field, label]) => (
            <label key={field} className="block">
              <span className="text-sm font-medium text-slate-200">
                {label} link
              </span>
              <input
                type="url"
                value={String(profile[field as keyof PlayerProfile] ?? "")}
                onChange={(event) =>
                  updateField(field as keyof PlayerProfile, event.target.value)
                }
                className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          {status && <p className="text-sm text-cyan-300">{status}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>
      </form>
    </div>
  );
}
