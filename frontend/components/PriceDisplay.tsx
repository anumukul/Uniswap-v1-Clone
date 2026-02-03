'use client'

import { useReadContract } from 'wagmi'
import { parseEther, formatEther, formatUnits } from '@/lib/utils'
import { EXCHANGE_ABI } from '@/lib/abis'

interface PriceDisplayProps {
  exchangeAddress: string
  inputAmount: string
  swapType: 'ethToToken' | 'tokenToEth' | 'tokenToToken'
  tokenDecimals?: number
}

export default function PriceDisplay({
  exchangeAddress,
  inputAmount,
  swapType,
  tokenDecimals = 18,
}: PriceDisplayProps) {
  const { data: price } = useReadContract({
    address: exchangeAddress as `0x${string}`,
    abi: EXCHANGE_ABI,
    functionName: swapType === 'ethToToken' ? 'getEthToTokenInputPrice' : 'getTokenToEthInputPrice',
    args: inputAmount ? [parseEther(inputAmount)] : undefined,
    query: { enabled: !!inputAmount && parseFloat(inputAmount) > 0 },
  })

  if (!price || !inputAmount) return null

  const outputAmount =
    swapType === 'ethToToken'
      ? formatUnits(price, tokenDecimals)
      : formatEther(price)

  const rate =
    swapType === 'ethToToken'
      ? parseFloat(outputAmount) / parseFloat(inputAmount)
      : parseFloat(outputAmount) / parseFloat(inputAmount)

  return (
    <div className="p-3 bg-[#1c2128] border border-[#30363d] rounded-xl">
      <div className="flex justify-between items-center text-sm">
        <span className="text-[#8b949e]">Price</span>
        <span className="text-white font-medium">
          1 {swapType === 'ethToToken' ? 'ETH' : 'Token'} = {rate.toFixed(6)}{' '}
          {swapType === 'ethToToken' ? 'Tokens' : 'ETH'}
        </span>
      </div>
      <div className="flex justify-between items-center text-xs mt-1 pt-2 border-t border-[#30363d]">
        <span className="text-[#8b949e]">Fee</span>
        <span className="text-[#8b949e]">0.3%</span>
      </div>
    </div>
  )
}
