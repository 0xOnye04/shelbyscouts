"use client";

import { Network } from "@aptos-labs/ts-sdk";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { SessionProvider } from "next-auth/react";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
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
