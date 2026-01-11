"use client"

import HomeContent from "@/components/HomeContent";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div>
      {!isConnected ? (
        <div className="flex items-center justify-center">
          <h2 className="text-xl font-medium text-white-600 pt-10 italic text-left">
            Please connect a wallet...
          </h2>
        </div>
      ) : (
        <div>
          <HomeContent/>
        </div>
      )}
    </div>
  );
}
