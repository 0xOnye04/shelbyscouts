"use client";

import { useCallback, useMemo, useState } from "react";
import { useWallet, WalletReadyState } from "@aptos-labs/wallet-adapter-react";

type AptosWalletName = "Petra" | "Martian";

type AptosWalletAccount = {
  address?: string | { toString: () => string };
  publicKey?: string;
};

type MartianWalletApi = {
  connect: () => Promise<AptosWalletAccount>;
  account?: () => Promise<AptosWalletAccount>;
  disconnect?: () => Promise<void>;
  isConnected?: () => Promise<boolean>;
  network?: () => Promise<{ name?: string; chainId?: string | number }>;
};

type MartianWalletState = {
  address: string | null;
  network: string | null;
};

declare global {
  interface Window {
    martian?: MartianWalletApi;
  }
}

function getMartianApi() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.martian;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeAddress(address: AptosWalletAccount["address"]) {
  if (!address) {
    return null;
  }

  return typeof address === "string" ? address : address.toString();
}

function getErrorMessage(error: unknown, walletName: AptosWalletName) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return `Unable to connect ${walletName}.`;
}

export function useAptosWallet() {
  const {
    account,
    connected,
    connect: connectAdapterWallet,
    disconnect: disconnectAdapterWallet,
    isLoading,
    network,
    wallet,
    wallets,
  } = useWallet();
  const [martianWallet, setMartianWallet] = useState<MartianWalletState>({
    address: null,
    network: null,
  });
  const [error, setError] = useState<string | null>(null);

  const petraWallet = useMemo(
    () => wallets.find((availableWallet) => availableWallet.name === "Petra"),
    [wallets]
  );

  const installedWallets = useMemo(() => {
    const installed: AptosWalletName[] = [];

    if (petraWallet?.readyState === WalletReadyState.Installed) {
      installed.push("Petra");
    }

    if (typeof window !== "undefined" && window.martian) {
      installed.push("Martian");
    }

    return installed;
  }, [petraWallet]);

  const connectMartian = useCallback(async () => {
    const api = getMartianApi();

    if (!api) {
      throw new Error("Martian wallet is not installed.");
    }

    const connectedAccount = await api.connect();
    const accountInfo = connectedAccount.address
      ? connectedAccount
      : await api.account?.();
    const address = normalizeAddress(accountInfo?.address);
    const walletNetwork = await api.network?.();

    if (!address) {
      throw new Error("Martian did not return a wallet address.");
    }

    setMartianWallet({
      address,
      network: walletNetwork?.name ?? null,
    });
  }, []);

  const connect = useCallback(
    async (name: AptosWalletName) => {
      setError(null);

      try {
        if (name === "Petra") {
          if (!petraWallet) {
            throw new Error("Petra wallet is not installed.");
          }

          await connectAdapterWallet("Petra");
          setMartianWallet({ address: null, network: null });
          return;
        }

        await connectMartian();

        if (connected) {
          await disconnectAdapterWallet();
        }
      } catch (connectError) {
        setError(getErrorMessage(connectError, name));
      }
    },
    [
      connectAdapterWallet,
      connectMartian,
      connected,
      disconnectAdapterWallet,
      petraWallet,
    ]
  );

  const disconnect = useCallback(async () => {
    setError(null);

    if (martianWallet.address) {
      await getMartianApi()?.disconnect?.();
      setMartianWallet({ address: null, network: null });
      return;
    }

    await disconnectAdapterWallet();
  }, [disconnectAdapterWallet, martianWallet.address]);

  const adapterAddress = account?.address?.toString() ?? null;
  const activeWalletName = martianWallet.address
    ? "Martian"
    : connected
      ? ((wallet?.name as AptosWalletName | undefined) ?? "Petra")
      : null;

  return {
    address: martianWallet.address ?? adapterAddress,
    name: activeWalletName,
    network: martianWallet.network ?? network?.name?.toString() ?? null,
    error,
    connecting: isLoading,
    installedWallets,
    isConnected: Boolean(martianWallet.address || adapterAddress),
    connect,
    disconnect,
  };
}

type AptosWalletPanelProps = ReturnType<typeof useAptosWallet>;

export function AptosWalletPanel({
  address,
  name,
  network,
  error,
  connecting,
  installedWallets,
  connect,
  disconnect,
}: AptosWalletPanelProps) {
  return (
    <section className="rounded-4xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
            Aptos wallet
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white">
            Connect Wallet
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Connect Petra through the Aptos Wallet Standard, or connect Martian
            before publishing clips to Shelby storage.
          </p>
        </div>

        {address ? (
          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
            <p className="font-semibold">{name} connected</p>
            <p className="mt-2 break-all text-cyan-100/80">{address}</p>
            <p className="mt-2 text-cyan-100/70">
              Network: {network || "Unknown"}
            </p>
            <button
              type="button"
              onClick={disconnect}
              className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300/50"
            >
              Disconnect wallet
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            {(["Petra", "Martian"] as AptosWalletName[]).map((walletName) => {
              const installed = installedWallets.includes(walletName);

              return (
                <button
                  key={walletName}
                  type="button"
                  onClick={() => connect(walletName)}
                  disabled={!installed || connecting}
                  className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {installed
                    ? `Connect ${walletName}`
                    : `${walletName} not installed`}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {address && (
        <p className="mt-4 text-sm text-slate-400">
          Connected wallet: {shortenAddress(address)}
        </p>
      )}

      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
    </section>
  );
}
