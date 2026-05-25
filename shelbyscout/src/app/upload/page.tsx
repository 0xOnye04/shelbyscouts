"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  AptosWalletPanel,
  useAptosWallet,
} from "@/components/AptosWalletPanel";

type UploadResponse = {
  queued?: boolean;
  video?: {
    url?: string;
    isShelbyStored?: boolean;
    storageProof?: string;
    storageAssetId?: string;
  };
};

type ManagedVideo = {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  storageProvider: string;
  storageProof?: string | null;
  isShelbyStored: boolean;
};

const MAX_VIDEO_BYTES = 75 * 1024 * 1024;

function uploadClip(
  formData: FormData,
  onProgress: (progress: number) => void
) {
  return new Promise<UploadResponse>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.open("POST", "/api/videos");
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        onProgress(35);
        return;
      }

      onProgress(Math.max(10, Math.round((event.loaded / event.total) * 90)));
    };
    request.onload = () => {
      let payload: UploadResponse & { error?: string } = {};

      try {
        payload = JSON.parse(request.responseText || "{}");
      } catch {
        payload = {};
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(payload.error || "Upload failed."));
        return;
      }

      resolve(payload);
    };
    request.onerror = () =>
      reject(new Error("Unable to reach the upload service."));
    request.send(formData);
  });
}

export default function UploadPage() {
  const { data: session } = useSession();
  const wallet = useAptosWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [storageProof, setStorageProof] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videos, setVideos] = useState<ManagedVideo[]>([]);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function loadVideos() {
    const response = await fetch("/api/videos");
    const payload = await response.json();

    if (response.ok) {
      setVideos(payload.videos ?? []);
    }
  }

  useEffect(() => {
    if (session) {
      const timeout = window.setTimeout(() => {
        loadVideos().catch(() => undefined);
      }, 0);

      return () => window.clearTimeout(timeout);
    }
  }, [session]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!wallet.address) {
      setError("Connect Petra or Martian wallet before uploading.");
      return;
    }

    if (!files.length) {
      setError("Please choose at least one video file to upload.");
      return;
    }

    const oversizedFile = files.find((selectedFile) => selectedFile.size > MAX_VIDEO_BYTES);
    if (oversizedFile) {
      setError("Choose a short clip up to 75 MB for faster Shelby uploads.");
      return;
    }

    setStatus("Preparing Shelby upload...");
    setUploadProgress(5);
    setStreamUrl(null);
    setStorageProof(null);
    setError(null);
    setIsUploading(true);

    try {
      let lastPayload: UploadResponse | null = null;

      for (const [index, selectedFile] of files.entries()) {
        const formData = new FormData();
        formData.append(
          "title",
          files.length > 1 ? `${title} ${index + 1}` : title
        );
        formData.append("description", description);
        formData.append("videoFile", selectedFile);
        formData.append("walletAddress", wallet.address);
        formData.append("walletName", wallet.name || "Aptos wallet");

        lastPayload = await uploadClip(formData, (progress) => {
          const fileShare = 100 / files.length;
          const totalProgress = Math.round(index * fileShare + (progress / 100) * fileShare);
          setUploadProgress(Math.min(95, totalProgress));
          setStatus(`Sending clip ${index + 1} of ${files.length}...`);
        });
      }

      setUploadProgress(95);
      setStatus("Clips accepted. Shelby storage is finishing in the background...");

      const video = lastPayload?.video;
      setStreamUrl(video?.url ?? null);
      setStorageProof(
        "Shelby upload accepted. Refresh the player profile shortly to see final storage proofs."
      );
      setUploadProgress(100);
      await loadVideos();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Upload failed."
      );
      setStatus(null);
      setUploadProgress(0);
      setIsUploading(false);
      return;
    }

    setStatus("Video accepted successfully.");
    setIsUploading(false);
    setTitle("");
    setDescription("");
    setFiles([]);
  };

  async function saveVideoEdit(videoId: string) {
    setError(null);
    const response = await fetch(`/api/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDescription }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Unable to update video.");
      return;
    }

    setVideos((current) =>
      current.map((video) => (video.id === videoId ? payload.video : video))
    );
    setEditingVideoId(null);
    setStatus("Video details saved.");
  }

  async function deleteVideo(videoId: string) {
    setError(null);
    const response = await fetch(`/api/videos/${videoId}`, {
      method: "DELETE",
    });
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error || "Unable to delete video.");
      return;
    }

    setVideos((current) => current.filter((video) => video.id !== videoId));
    setStatus("Video deleted.");
  }

  if (!session) {
    return (
      <div className="space-y-6 py-12 text-center">
        <p className="text-xl font-semibold text-white">
          Sign in to upload player content.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signin"
            className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/30"
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-10">
      <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-cyan-500/10">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
          Shelby-backed upload
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-white sm:text-5xl">
          Publish football clips for scouts worldwide.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
          Add highlight videos, training moments, match reels, or
          crypto-football content. Connect Petra or Martian on Aptos testnet
          before publishing to Shelby.
        </p>
      </div>

      <AptosWalletPanel {...wallet} />

      <section className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Testnet faucet
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Track Shelbynet activity
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Open the Shelbynet explorer to check network activity, account
              state, and Shelby upload transactions.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="https://explorer.shelby.xyz/shelbynet"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Get faucet tokens
            </a>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/10"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-200">
              Clip title
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: 45-second goal reel"
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">
              Player role
            </span>
            <input
              type="text"
              placeholder="Forward, Midfielder, Defender"
              className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
              disabled
              value={
                session.user.role === "SCOUT"
                  ? "Scout account"
                  : "Player account"
              }
            />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            Description
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Add location, match context, position, key skills, or crypto community context"
            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-200">
            Video file
          </span>
          <input
            type="file"
            accept="video/*"
            multiple
            onChange={(event) => {
              const selectedFiles = Array.from(event.target.files ?? []);
              setFiles(selectedFiles);
              setError(
                selectedFiles.some(
                  (selectedFile) => selectedFile.size > MAX_VIDEO_BYTES
                )
                  ? "Choose a short clip up to 75 MB for faster Shelby uploads."
                  : null
              );
            }}
            className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none file:cursor-pointer file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-sm file:text-slate-950"
          />
          {files.length > 0 && (
            <span className="mt-2 block text-sm text-slate-400">
              {files.length} file{files.length === 1 ? "" : "s"} selected
            </span>
          )}
        </label>

        {uploadProgress > 0 && (
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-4">
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400 transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="mt-3 text-sm text-slate-400">
              {uploadProgress}% complete
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={!wallet.address || isUploading}
            className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isUploading ? "Uploading..." : "Publish clip"}
          </button>
          {status && <p className="text-sm text-cyan-300">{status}</p>}
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </div>

        {streamUrl && (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
            <p className="font-semibold">Streamable URL generated</p>
            <p className="mt-2 break-all">{streamUrl}</p>
          </div>
        )}

        {storageProof && (
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100">
            {storageProof}
          </div>
        )}
      </form>

      <section className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
              Your videos
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              Edit or delete uploaded clips
            </h2>
          </div>
          <button
            type="button"
            onClick={() => loadVideos()}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-cyan-400/40"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {videos.length ? (
            videos.map((video) => {
              const isEditing = editingVideoId === video.id;

              return (
                <article
                  key={video.id}
                  className="rounded-3xl border border-white/10 bg-slate-900 p-5"
                >
                  {isEditing ? (
                    <div className="grid gap-4">
                      <input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        rows={3}
                        className="w-full rounded-3xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-white">
                        {video.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {video.description || "No description."}
                      </p>
                      <p className="mt-3 text-sm text-cyan-300">
                        {video.isShelbyStored
                          ? "Stored on Shelby"
                          : video.storageProvider === "shelby-pending"
                            ? "Processing on Shelby"
                            : "Storage pending"}
                      </p>
                    </>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveVideoEdit(video.id)}
                          className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingVideoId(null)}
                          className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40"
                        >
                          Stream
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVideoId(video.id);
                            setEditTitle(video.title);
                            setEditDescription(video.description ?? "");
                          }}
                          className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:border-cyan-400/40"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteVideo(video.id)}
                          className="rounded-full border border-rose-400/30 px-5 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900 p-8 text-slate-400">
              No uploaded clips yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
