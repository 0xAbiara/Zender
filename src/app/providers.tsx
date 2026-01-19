"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type ReactNode, useState, useEffect } from "react"
import { WagmiProvider } from "wagmi"
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { getConfig } from "@/rainbowKitConfig"
import "@rainbow-me/rainbowkit/styles.css"

export function Providers(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())
    const [config, setConfig] = useState<ReturnType<typeof getConfig> | null>(null)

    useEffect(() => {
        setConfig(getConfig())
    }, [])

    if (!config) {
        return null // or a loading spinner
    }

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={lightTheme({ borderRadius: "medium" })}>
                    {props.children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
