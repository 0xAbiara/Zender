"use client"

import { useState, useMemo, useEffect } from "react";
import InputField from "@/components/ui/InputField";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from 'wagmi';
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal, formatTokenAmount } from "@/utils";
import { useWaitForTransactionReceipt } from "wagmi"
import { CgSpinner } from "react-icons/cg"
import { useReadContracts } from "wagmi"

export default function AirdropForm() {
    const [isClient, setIsClient] = useState(false)
    const [tokenAddress, setTokenAddress] = useState("")
    const [recipients, setRecipients] = useState("")
    const [amounts, setAmounts] = useState("")
    
    const chainId = useChainId()
    const config = useConfig()
    const account = useAccount()
    const total: number = useMemo(() => calculateTotal(amounts), [amounts])
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed, isError } = useWaitForTransactionReceipt({
        confirmations: 1,
        hash,
    })
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
    })

    async function getApprovedAmount(tSenderAddress: string | null): Promise<number> {
        if (!tSenderAddress) {
            alert("No Address found, Kindly use a supported chain!")
            return 0
        }
        const response = await readContract(config, {
            abi: erc20Abi,
            address: tokenAddress as `0x${string}`,
            functionName: "allowance",
            args: [account.address, tSenderAddress as `0x${string}`],
        })
        return response as number
    }

    function getButtonContent() {
        if (isPending)
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Confirming in wallet...</span>
                </div>
            )
        if (isConfirming)
            return (
                <div className="flex items-center justify-center gap-2 w-full">
                    <CgSpinner className="animate-spin" size={20} />
                    <span>Waiting for transaction to be included...</span>
                </div>
            )
        if (error || isError) {
            console.log(error)
            return <span>Error, see console.</span>
        }
        if (isConfirmed) {
            return "Transaction confirmed."
        }
        return "Send Tokens"
    }

    // Load from localStorage on mount - ONLY ON CLIENT
    useEffect(() => {
        setIsClient(true)
        
        // Only access localStorage after we've confirmed we're on the client
        if (typeof window !== 'undefined') {
            const savedTokenAddress = localStorage.getItem('tokenAddress')
            const savedRecipients = localStorage.getItem('recipients')
            const savedAmounts = localStorage.getItem('amounts')

            if (savedTokenAddress) setTokenAddress(savedTokenAddress)
            if (savedRecipients) setRecipients(savedRecipients)
            if (savedAmounts) setAmounts(savedAmounts)
        }
    }, [])

    // Save to localStorage when values change - only if client-side
    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            localStorage.setItem('tokenAddress', tokenAddress)
        }
    }, [tokenAddress, isClient])

    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            localStorage.setItem('recipients', recipients)
        }
    }, [recipients, isClient])

    useEffect(() => {
        if (isClient && typeof window !== 'undefined') {
            localStorage.setItem('amounts', amounts)
        }
    }, [amounts, isClient])

    async function handleSubmit() {
        const tSenderAddress = chainsToTSender[chainId]["tsender"]
        const approvedAmount = await getApprovedAmount(tSenderAddress)
        console.log(approvedAmount)

        if (approvedAmount < total) {
            const approvalHash = await writeContractAsync({
                abi: erc20Abi,
                address: tokenAddress as `0x${string}`,
                functionName: "approve",
                args: [tSenderAddress as `0x${string}`, BigInt(total)],
            })

            const approvalReceipt = await waitForTransactionReceipt(config, {
                hash: approvalHash,
            })

            console.log("Approval confirmed:", approvalReceipt)
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
        })
    }

    // Don't render anything until we're on the client
    // This prevents hydration mismatches
    if (!isClient) {
        return (
            <div className="min-h-screen pt-4 px-6 flex justify-center">
                <div className="max-w-2xl w-full space-y-6">
                    <div className="animate-pulse">
                        <div className="h-10 bg-gray-200 rounded mb-6"></div>
                        <div className="h-32 bg-gray-200 rounded mb-6"></div>
                        <div className="h-32 bg-gray-200 rounded mb-6"></div>
                        <div className="h-24 bg-gray-200 rounded mb-6"></div>
                        <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-4 px-6 flex justify-center">
            <div className="max-w-2xl w-full space-y-6">
                <InputField
                    label="Token Address"
                    placeholder="0x"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                />
                <InputField
                    label="Recipients"
                    placeholder="0x1234, 0x5678"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    large={true}
                />
                <InputField
                    label="Amount"
                    placeholder="100, 200, 300, ..."
                    value={amounts}
                    onChange={(e) => setAmounts(e.target.value)}
                    large={true}
                />

                <div className="bg-white border border-zinc-300 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">Transaction Details</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Token Name:</span>
                            <span className="font-mono text-zinc-900">
                                {tokenData?.[1]?.result ? (tokenData[1].result as string) : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Amount (wei):</span>
                            <span className="font-mono text-zinc-900">{total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-zinc-600">Amount (tokens):</span>
                            <span className="font-mono text-zinc-900">
                                {tokenData?.[0]?.result !== undefined 
                                    ? formatTokenAmount(total, tokenData[0].result as number)
                                    : '0'}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={isPending || isConfirming}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {getButtonContent()}
                </button>
            </div>
        </div>
    )
}