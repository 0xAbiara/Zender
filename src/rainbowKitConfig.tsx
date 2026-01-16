"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, zksync, mainnet, sepolia  } from "wagmi/chains";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!walletConnectProjectId) {
  throw new Error("Error: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not defined. Please set it in your .env.local file");
}

const config = getDefaultConfig({
  appName: "Zender",
  projectId: walletConnectProjectId,
  chains: [anvil, zksync, mainnet, sepolia ],
  ssr: true,
});

export default config;


// "use client"

// import { getDefaultConfig } from "@rainbow-me/rainbowkit"
// import { anvil } from "wagmi/chains"

// export default getDefaultConfig({
//     appName: "NFT Marketplace",
//     projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
//     chains: [anvil],
//     ssr: true,
// })
