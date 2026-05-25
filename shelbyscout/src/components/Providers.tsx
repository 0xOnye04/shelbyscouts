"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { SessionProvider, type SessionProviderProps } from "next-auth/react";

export default function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: SessionProviderProps["session"];
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus>
      <AptosWalletAdapterProvider
        autoConnect
        dappConfig={{ network: Network.TESTNET }}
        onError={(error) => {
          console.error("Aptos wallet adapter error:", error);
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </SessionProvider>
  );
}
