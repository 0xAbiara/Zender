"use client"

import HomeContent from "@/components/HomeContent";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen">
      {!isConnected ? (
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 blur-xl bg-blue-500/20 rounded-full animate-pulse"></div>
              <h2 className="relative text-2xl font-medium text-gray-300 italic">
                Please connect a wallet...
              </h2>
            </div>
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <HomeContent/>
        </div>
      )}
      
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
