"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import { FaGithub } from "react-icons/fa"
import Image from "next/image"

export default function Header() {
    return (
        <nav className="px-8 py-6 border-b-[4px] border-zinc-100 bg-white xl:min-h-[90px] animate-slide-down">
            <div className="flex flex-row justify-between items-center">
                <div className="flex items-center gap-4 md:gap-8 animate-fade-in-left">
                    <a href="/" className="flex items-center gap-2 text-zinc-800 hover:scale-105 transition-transform duration-200 group">
                        <div className="relative">
                            <Image src="/Zender.svg" alt="Zender" width={40} height={40} className="group-hover:rotate-12 transition-transform duration-300" />
                        </div>
                        <h1 className="font-bold text-2xl hidden md:block group-hover:text-blue-600 transition-colors">Zender</h1>
                    </a>
                    <a
                        href="https://github.com/0xAbiara/Zender"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden md:block hover:scale-110 transition-transform duration-200"
                    >
                        <FaGithub className="h-7 w-7 text-zinc-800 hover:text-zinc-600 transition-colors" />
                    </a>
                </div>
                
                <h3 className="italic text-left hidden text-zinc-500 lg:block animate-fade-in opacity-0" style={{animationDelay: '200ms', animationFillMode: 'forwards'}}>
                    This was built by Jesutofunmi Christianah Ajobo. T-Sender Replica Project
                </h3>
                
                <div className="flex items-center gap-4 animate-fade-in-right">
                    <ConnectButton />
                </div>
            </div>

            <style jsx>{`
                @keyframes slide-down {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes fade-in-left {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                @keyframes fade-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .animate-slide-down {
                    animation: slide-down 0.5s ease-out;
                }
                
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                
                .animate-fade-in-left {
                    animation: fade-in-left 0.6s ease-out;
                }
                
                .animate-fade-in-right {
                    animation: fade-in-right 0.6s ease-out;
                }
            `}</style>
        </nav>
    )
}