import { ShelbyNodeClient, getShelbyBlobExplorerUrl } from "@shelby-protocol/sdk/node";
import { Account, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";

export type ShelbyUploadResult = {
  url: string;
  thumbnailUrl: string;
  storageProvider: "shelby" | "demo";
  storageAssetId?: string;
  storageProof?: string;
  isShelbyStored: boolean;
};

export type ShelbyFileUploadResult = {
  url: string;
  storageProvider: "shelby" | "demo";
  storageAssetId?: string;
  storageProof?: string;
  isShelbyStored: boolean;
};

export const DEFAULT_VIDEO_THUMBNAIL_URL =
  "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80";

function getShelbyNetwork() {
  if (process.env.SHELBY_NETWORK === "SHELBYNET") {
    return Network.SHELBYNET;
  }

  if (process.env.SHELBY_NETWORK === "LOCAL") {
    return Network.LOCAL;
  }

  return Network.TESTNET;
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function getShelbyApiKey() {
  return readEnv("SHELBY_API_KEY") || readEnv("APTOS_API_KEY");
}

function getShelbyFullnodeUrl() {
  return readEnv("SHELBY_NODE_API_URL") || readEnv("SHELBY_FULLNODE_URL");
}

function createShelbyClient() {
  const network = getShelbyNetwork();
  const apiKey = getShelbyApiKey();
  const fullnode = getShelbyFullnodeUrl();

  return new ShelbyNodeClient({
    network,
    apiKey,
    aptos: {
      network,
      fullnode,
      clientConfig: {
        API_KEY: apiKey,
      },
    },
    rpc: {
      apiKey,
    },
    indexer: {
      apiKey,
    },
  });
}

function createShelbySigner() {
  const privateKey = readEnv("SHELBY_PRIVATE_KEY")?.replace(/^ed25519-priv-/, "");

  if (!privateKey) {
    return null;
  }

  return Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(privateKey),
  });
}

function createBlobName(
  file: { name: string },
  title: string,
  walletAddress?: string,
  folder = "media"
) {
  const extension = file.name.split(".").pop() || "mp4";
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "clip";
  const walletNamespace =
    walletAddress
      ?.toLowerCase()
      .replace(/^0x/, "")
      .replace(/[^a-f0-9]/g, "")
      .slice(0, 16) || "wallet";

  return `shelbyscout/${walletNamespace}/${folder}/${Date.now()}-${slug}.${extension}`;
}

function toHex(bytes?: Uint8Array) {
  if (!bytes) {
    return undefined;
  }

  return `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

async function getShelbyTimestamps(client: ShelbyNodeClient) {
  const ledgerInfo = await client.aptos.getLedgerInfo();
  const ledgerMicros = BigInt(ledgerInfo.ledger_timestamp);
  const microsPerSecond = BigInt(1_000_000);
  const thirtyDaysMicros =
    BigInt(30) * BigInt(24) * BigInt(60) * BigInt(60) * microsPerSecond;
  const ledgerSeconds = Number(ledgerMicros / microsPerSecond);

  return {
    blobExpirationMicros: Number(ledgerMicros + thirtyDaysMicros),
    transactionExpirationSeconds: ledgerSeconds + 60 * 60,
  };
}

export async function uploadVideoToShelby(
  file: File,
  title: string,
  description?: string,
  walletAddress?: string
): Promise<ShelbyUploadResult> {
  return uploadVideoBytesToShelby({
    blobData: new Uint8Array(await file.arrayBuffer()),
    fileName: file.name,
    title,
    description,
    walletAddress,
  });
}

export async function uploadVideoBytesToShelby({
  blobData,
  fileName,
  title,
  description,
  walletAddress,
}: {
  blobData: Uint8Array;
  fileName: string;
  title: string;
  description?: string;
  walletAddress?: string;
}): Promise<ShelbyUploadResult> {
  void description;

  const shelbyApiKey = getShelbyApiKey();
  const signer = createShelbySigner();

  if (!shelbyApiKey || !signer) {
    return {
      url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      thumbnailUrl: DEFAULT_VIDEO_THUMBNAIL_URL,
      storageProvider: "demo",
      storageAssetId: "demo-fallback-video",
      storageProof:
        "Shelby SDK is installed, but SHELBY_API_KEY and SHELBY_PRIVATE_KEY are required for real Shelby storage.",
      isShelbyStored: false,
    };
  }

  const client = createShelbyClient();
  const blobName = createBlobName({ name: fileName }, title, walletAddress, "videos");
  const { blobExpirationMicros, transactionExpirationSeconds } =
    await getShelbyTimestamps(client);

  await client.upload({
    blobData,
    signer,
    blobName,
    expirationMicros: blobExpirationMicros,
    options: {
      build: {
        options: {
          expireTimestamp: transactionExpirationSeconds,
        },
      },
    },
  });

  const metadata = await client.coordination.getBlobMetadata({
    account: signer.accountAddress,
    name: blobName,
  });
  const accountAddress = signer.accountAddress.toString();
  const storageAssetId = `${accountAddress}/${blobName}`;
  const storageProof =
    toHex(metadata?.blobMerkleRoot) ||
    getShelbyBlobExplorerUrl(getShelbyNetwork(), accountAddress, blobName);

  return {
    url: `/api/shelby/blob?account=${encodeURIComponent(accountAddress)}&name=${encodeURIComponent(blobName)}`,
    thumbnailUrl: DEFAULT_VIDEO_THUMBNAIL_URL,
    storageProvider: "shelby",
    storageAssetId,
    storageProof,
    isShelbyStored: true,
  };
}

export async function uploadImageFileToShelby({
  file,
  title,
  walletAddress,
}: {
  file: File;
  title: string;
  walletAddress?: string;
}): Promise<ShelbyFileUploadResult> {
  const shelbyApiKey = getShelbyApiKey();
  const signer = createShelbySigner();

  if (!shelbyApiKey || !signer) {
    return {
      url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=60",
      storageProvider: "demo",
      storageAssetId: "demo-profile-image",
      storageProof:
        "Shelby SDK is installed, but SHELBY_API_KEY and SHELBY_PRIVATE_KEY are required for real Shelby image storage.",
      isShelbyStored: false,
    };
  }

  const client = createShelbyClient();
  const blobName = createBlobName(file, title, walletAddress, "profile-images");
  const blobData = new Uint8Array(await file.arrayBuffer());
  const { blobExpirationMicros, transactionExpirationSeconds } =
    await getShelbyTimestamps(client);

  await client.upload({
    blobData,
    signer,
    blobName,
    expirationMicros: blobExpirationMicros,
    options: {
      build: {
        options: {
          expireTimestamp: transactionExpirationSeconds,
        },
      },
    },
  });

  const metadata = await client.coordination.getBlobMetadata({
    account: signer.accountAddress,
    name: blobName,
  });
  const accountAddress = signer.accountAddress.toString();
  const storageAssetId = `${accountAddress}/${blobName}`;
  const storageProof =
    toHex(metadata?.blobMerkleRoot) ||
    getShelbyBlobExplorerUrl(getShelbyNetwork(), accountAddress, blobName);

  return {
    url: `/api/shelby/blob?account=${encodeURIComponent(accountAddress)}&name=${encodeURIComponent(blobName)}`,
    storageProvider: "shelby",
    storageAssetId,
    storageProof,
    isShelbyStored: true,
  };
}

export async function downloadShelbyBlob(
  account: string,
  blobName: string,
  range?: { start: number; end?: number }
) {
  const client = createShelbyClient();

  return client.download({
    account,
    blobName,
    range,
  });
}

export async function getShelbyBlobSize(account: string, blobName: string) {
  const client = createShelbyClient();
  const metadata = await client.coordination.getBlobMetadata({
    account,
    name: blobName,
  });

  return metadata?.size;
}

export function getStreamableUrl(url: string) {
  return `${url}`;
}

export function getThumbnailUrl(url?: string) {
  return url || DEFAULT_VIDEO_THUMBNAIL_URL;
}
