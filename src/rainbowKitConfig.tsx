"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { arbitrum, base, mainnet, optimism, anvil, zksync, sepolia } from "wagmi/chains"

let config: ReturnType<typeof getDefaultConfig> | null = null

export function getConfig() {
    if (!config) {
        config = getDefaultConfig({
            appName: "Zender",
            projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
            chains: [mainnet, optimism, arbitrum, base, zksync, sepolia, anvil],
            ssr: false,
        })
    }
    return config
}

export default config