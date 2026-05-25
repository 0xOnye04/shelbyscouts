"use client";

import {
  ShelbyRPCClient,
  createDefaultErasureCodingProvider,
  generateCommitments,
  type PutBlobProgress,
} from "@shelby-protocol/sdk/browser";
import { Network } from "@aptos-labs/ts-sdk";

type DirectShelbyUploadProgress = {
  phase: "preparing" | "registering" | "uploading" | "finalizing";
  progress: number;
};

type DirectShelbyUploadParams = {
  file: File;
  title: string;
  description?: string;
  walletAddress: string;
  onProgress?: (progress: DirectShelbyUploadProgress) => void;
};

type PrepareResponse = {
  video: {
    id: string;
    url: string;
    storageProof?: string | null;
    storageAssetId?: string | null;
  };
  upload: {
    network: "SHELBYNET" | "TESTNET" | "LOCAL";
    accountAddress: string;
    blobName: string;
    url: string;
    storageAssetId: string;
    storageProof: string;
  };
};

function getShelbyNetwork(network?: PrepareResponse["upload"]["network"]) {
  if (network === "SHELBYNET") {
    return Network.SHELBYNET;
  }

  if (network === "LOCAL") {
    return Network.LOCAL;
  }

  if (network === "TESTNET") {
    return Network.TESTNET;
  }

  if (process.env.NEXT_PUBLIC_SHELBY_NETWORK === "TESTNET") {
    return Network.TESTNET;
  }

  if (process.env.NEXT_PUBLIC_SHELBY_NETWORK === "LOCAL") {
    return Network.LOCAL;
  }

  return Network.SHELBYNET;
}

function getShelbyPublicApiKey() {
  return process.env.NEXT_PUBLIC_SHELBY_API_KEY?.trim() || undefined;
}

function getShelbyPublicRpcBaseUrl() {
  return process.env.NEXT_PUBLIC_SHELBY_RPC_BASE_URL?.trim() || undefined;
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return fallback;
}

async function readJsonResponse<T>(response: Response, fallback: string) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, fallback));
  }

  return payload as T;
}

function mapShelbyProgress(progress: PutBlobProgress): DirectShelbyUploadProgress {
  if (progress.phase === "finalizing") {
    return { phase: "finalizing", progress: 96 };
  }

  const uploadedRatio = progress.totalBytes
    ? progress.uploadedBytes / progress.totalBytes
    : 0;

  return {
    phase: "uploading",
    progress: Math.min(95, 45 + Math.round(uploadedRatio * 50)),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isShelbyRegistrationPropagationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    message.includes("has not been registered onto the L1") ||
    message.includes("Failed to start multipart upload")
  );
}

async function uploadBlobWithRegistrationRetry({
  rpcClient,
  accountAddress,
  blobName,
  file,
  onProgress,
}: {
  rpcClient: ShelbyRPCClient;
  accountAddress: string;
  blobName: string;
  file: File;
  onProgress?: (progress: DirectShelbyUploadProgress) => void;
}) {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await rpcClient.putBlob({
        account: accountAddress,
        blobName,
        blobData: file.stream() as ReadableStream<Uint8Array>,
        totalBytes: file.size,
        onProgress: (progress) => {
          onProgress?.(mapShelbyProgress(progress));
        },
      });
      return;
    } catch (error) {
      if (!isShelbyRegistrationPropagationError(error) || attempt === maxAttempts) {
        throw error;
      }

      onProgress?.({
        phase: "registering",
        progress: Math.min(58, 40 + attempt * 2),
      });
      await sleep(4000);
    }
  }
}

export async function uploadVideoDirectlyToShelby({
  file,
  title,
  description,
  walletAddress,
  onProgress,
}: DirectShelbyUploadParams) {
  onProgress?.({ phase: "preparing", progress: 5 });

  const provider = await createDefaultErasureCodingProvider();
  const commitments = await generateCommitments(
    provider,
    file.stream() as ReadableStream<Uint8Array>,
    () => {
      onProgress?.({ phase: "preparing", progress: 25 });
    }
  );

  onProgress?.({ phase: "registering", progress: 40 });

  const prepareResponse = await fetch("/api/videos/direct/prepare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      description,
      fileName: file.name,
      fileSize: file.size,
      walletAddress,
      blobMerkleRoot: commitments.blob_merkle_root,
    }),
  });
  const prepared = await readJsonResponse<PrepareResponse>(
    prepareResponse,
    "Unable to prepare Shelby upload."
  );

  const apiKey = getShelbyPublicApiKey();
  const rpcClient = new ShelbyRPCClient({
    network: getShelbyNetwork(prepared.upload.network),
    apiKey,
    rpc: {
      apiKey,
      baseUrl: getShelbyPublicRpcBaseUrl(),
    },
  });

  onProgress?.({ phase: "uploading", progress: 45 });

  await uploadBlobWithRegistrationRetry({
    rpcClient,
    accountAddress: prepared.upload.accountAddress,
    blobName: prepared.upload.blobName,
    file,
    onProgress,
  });

  onProgress?.({ phase: "finalizing", progress: 97 });

  const completeResponse = await fetch("/api/videos/direct/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId: prepared.video.id }),
  });
  const completed = await readJsonResponse<{ video: PrepareResponse["video"] }>(
    completeResponse,
    "Shelby upload finished, but the video record could not be finalized."
  );

  onProgress?.({ phase: "finalizing", progress: 100 });

  return {
    video: completed.video,
    upload: prepared.upload,
  };
}
