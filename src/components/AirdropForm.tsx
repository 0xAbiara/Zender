"use client"

import { useState, useMemo, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from 'wagmi';
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal, formatTokenAmount } from "@/utils";
import { useWaitForTransactionReceipt } from "wagmi";
import { CgSpinner } from "react-icons/cg";
import { useReadContracts } from "wagmi";

export default function AirdropForm() {
    const [isClient, setIsClient] = useState(false);
    const [tokenAddress, setTokenAddress] = useState("");
    const [recipients, setRecipients] = useState("");
    const [amounts, setAmounts] = useState("");
    const [validationError, setValidationError] = useState("");
    
    const chainId = useChainId();
    const config = useConfig();
    const account = useAccount();
    const total: number = useMemo(() => calculateTotal(amounts), [amounts]);
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({
        confirmations: 1,
        hash,
    });
    const { data: tokenData } = useReadContracts({
        contracts: [
            {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "decimals",
            },
            {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "name",
            },
        ],
    });

    async function getApprovedAmount(tSenderAddress: string | null): Promise<number> {
        if (!tSenderAddress) {
            setValidationError("Zender contract not found for this chain. Please switch to a supported network.");
            return 0;
        }

        try {
            const response = await readContract(config, {
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "allowance",
                args: [account.address, tSenderAddress as `0x${string}`],
            });
            return response as number;
        } catch (error) {
            console.error("Error getting approved amount:", error);
            return 0;
        }
    }

    function getButtonContent() {
        if (isPending)
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Confirming in wallet...</span>
                </div>
            );
        if (isConfirming)
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Waiting for confirmation...</span>
                </div>
            );
        if (error || isError) {
            return <span>Transaction Failed - Try Again</span>;
        }
        if (isConfirmed) {
            return "✓ Transaction Confirmed!";
        }
        return "Send Tokens";
    }

    // Load from localStorage on mount - ONLY ON CLIENT
    useEffect(() => {
        setIsClient(true);
        
        if (typeof window !== 'undefined') {
            const savedTokenAddress = localStorage.getItem('zender_tokenAddress');
            const savedRecipients = localStorage.getItem('zender_recipients');
            const savedAmounts = localStorage.getItem('zender_amounts');

            if (savedTokenAddress) setTokenAddress(savedTokenAddress);
            if (savedRecipients) setRecipients(savedRecipients);
            if (savedAmounts) setAmounts(savedAmounts);
        }
    }, []);

    // Save to localStorage when values change - only if client-side
    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            localStorage.setItem('zender_tokenAddress', tokenAddress);
        }
    }, [tokenAddress, isClient]);

    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            localStorage.setItem('zender_recipients', recipients);
        }
    }, [recipients, isClient]);

    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            localStorage.setItem('zender_amounts', amounts);
        }
    }, [amounts, isClient]);

    // Validate inputs
    function validateInputs(): { isValid: boolean; error?: string } {
        if (!tokenAddress || !tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            return { isValid: false, error: "Invalid token address format" };
        }
        
        const recipientList = recipients.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== '');
        const amountList = amounts.split(/[,\n]+/).map(amt => amt.trim()).filter(amt => amt !== '');
        
        if (recipientList.length === 0) {
            return { isValid: false, error: "Please provide at least one recipient address" };
        }
        
        if (amountList.length === 0) {
            return { isValid: false, error: "Please provide at least one amount" };
        }
        
        if (recipientList.length !== amountList.length) {
            return { isValid: false, error: `Mismatch: ${recipientList.length} recipients but ${amountList.length} amounts` };
        }
        
        // Validate each recipient address
        for (const addr of recipientList) {
            if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
                return { isValid: false, error: `Invalid recipient address: ${addr.slice(0, 10)}...` };
            }
        }
        
        // Validate each amount
        for (const amt of amountList) {
            if (isNaN(Number(amt)) || Number(amt) <= 0) {
                return { isValid: false, error: `Invalid amount: ${amt}` };
            }
        }
        
        return { isValid: true };
    }

    async function handleSubmit() {
        // Clear previous errors
        setValidationError("");

        // Validate inputs
        const validation = validateInputs();
        if (!validation.isValid) {
            setValidationError(validation.error || "Invalid input");
            return;
        }

        try {
            const tSenderAddress = chainsToTSender[chainId]["tsender"];
            
            if (!tSenderAddress) {
                setValidationError("Zender contract not deployed on this network");
                return;
            }

            const approvedAmount = await getApprovedAmount(tSenderAddress);
            console.log("Current approved amount:", approvedAmount);

            if (approvedAmount < total) {
                console.log("Requesting approval for:", total);
                
                const approvalHash = await writeContractAsync({
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "approve",
                    args: [tSenderAddress as `0x${string}`, BigInt(total)],
                });

                const approvalReceipt = await waitForTransactionReceipt(config, {
                    hash: approvalHash,
                });

                if (approvalReceipt.status !== 'success') {
                    throw new Error("Approval transaction failed");
                }

                console.log("Approval confirmed:", approvalReceipt);
            }
            
            // Always send the airdrop transaction after approval (or if already approved)
            await writeContractAsync({
                abi: tsenderAbi,
                address: tSenderAddress as `0x${string}`,
                functionName: "airdropERC20",
                args: [
                    tokenAddress,
                    recipients.split(/[,\n]+/).map(addr => addr.trim()).filter(addr => addr !== ''),
                    amounts.split(/[,\n]+/).map(amt => amt.trim()).filter(amt => amt !== ''),
                    BigInt(total),
                ],
            });
        } catch (error: any) {
            console.error("Transaction error:", error);
            setValidationError(error?.message || "Transaction failed. Please try again.");
        }
    }

    function resetForm() {
        setTokenAddress("");
        setRecipients("");
        setAmounts("");
        setValidationError("");
    }

    const recipientCount = recipients.split(/[,\n]+/).filter(addr => addr.trim() !== '').length;

    // Don't render anything until we're on the client
    // This prevents hydration mismatches
    if (!isClient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950 pt-4 px-6 flex justify-center">
                <div className="max-w-2xl w-full space-y-6">
                    <div className="animate-pulse">
                        <div className="h-10 bg-zinc-800/50 rounded-xl mb-6"></div>
                        <div className="h-32 bg-zinc-800/50 rounded-xl mb-6"></div>
                        <div className="h-32 bg-zinc-800/50 rounded-xl mb-6"></div>
                        <div className="h-24 bg-zinc-800/50 rounded-xl mb-6"></div>
                        <div className="h-12 bg-zinc-800/50 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-blue-950 pt-4 px-6 flex justify-center relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-2xl w-full space-y-6 relative z-10 animate-fade-in pb-16">
                {/* Validation Error Display */}
                {validationError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 transform transition-all duration-300">
                        <div className="flex items-start gap-2">
                            <span className="text-lg">⚠️</span>
                            <div>
                                <p className="font-semibold">Error</p>
                                <p className="text-sm mt-1">{validationError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {isConfirmed && hash && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-400 transform transition-all duration-300">
                        <p className="font-semibold">✅ Transaction Confirmed!</p>
                        <p className="text-sm mt-1 font-mono">Hash: {hash?.slice(0, 10)}...{hash?.slice(-8)}</p>
                        <button 
                            onClick={resetForm}
                            className="mt-3 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-sm transition-colors"
                        >
                            Send Another Airdrop
                        </button>
                    </div>
                )}

                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <InputField
                        label="Token Address"
                        placeholder="0xc4685b9...593b8921"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                    />
                </div>
                
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <InputField
                        label="Recipients"
                        placeholder="0x1234.., 0x2b8a.."
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        large={true}
                    />
                    <p className="text-xs text-zinc-500 mt-2">Separate addresses with commas or new lines</p>
                </div>
                
                <div className="transform transition-all duration-300 hover:scale-[1.01]">
                    <InputField
                        label="Amount"
                        placeholder="20000, 75000, 1000000, ..."
                        value={amounts}
                        onChange={(e) => setAmounts(e.target.value)}
                        large={true}
                    />
                    <p className="text-xs text-zinc-500 mt-2">Enter amounts in wei (smallest unit). Separate with commas or new lines</p>
                </div>

                <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-zinc-700/50 rounded-xl p-4 shadow-2xl transform transition-all duration-300 hover:scale-[1.01] hover:border-blue-500/30">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <h3 className="text-sm font-medium text-zinc-100">Transaction Details</h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                            <span className="text-sm text-zinc-400">Token Name:</span>
                            <span className="font-mono text-blue-400">
                                {tokenData?.[1]?.result ? (tokenData[1].result as string) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                            <span className="text-sm text-zinc-400">Recipients:</span>
                            <span className="font-mono text-green-400">{recipientCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                            <span className="text-sm text-zinc-400">Total Amount (wei):</span>
                            <span className="font-mono text-purple-400">{total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors">
                            <span className="text-sm text-zinc-400">Total Amount (tokens):</span>
                            <span className="font-mono text-cyan-400">
                                {tokenData?.[0]?.result !== undefined 
                                    ? formatTokenAmount(total, tokenData[0].result as number)
                                    : '0'}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isPending || isConfirming || isConfirmed}
                    className="group w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/20 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/30 relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">{getButtonContent()}</span>
                </button>

                {(error || isError) && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                        <p className="font-semibold">Transaction Error</p>
                        <p className="text-sm mt-1">{error?.message || "Transaction failed. Please check console for details."}</p>
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out forwards;
                }
            `}</style>
        </div>
    );
}