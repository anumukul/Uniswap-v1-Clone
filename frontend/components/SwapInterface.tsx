'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi'
import { parseEther, formatEther, formatUnits, parseUnits, getDeadline } from '@/lib/utils'
import { FACTORY_ABI, EXCHANGE_ABI, ERC20_ABI } from '@/lib/abis'
import { FACTORY_ADDRESS } from '@/config/contracts'
import TokenInput from './TokenInput'
import PriceDisplay from './PriceDisplay'

export default function SwapInterface() {
  const { address, isConnected } = useAccount()
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount, setOutputAmount] = useState('')
  const [inputToken, setInputToken] = useState<string>('ETH')
  const [outputToken, setOutputToken] = useState<string>('')
  const [exchangeAddress, setExchangeAddress] = useState<string | null>(null)
  const [outputExchangeAddress, setOutputExchangeAddress] = useState<string | null>(null)
  const [inputTokenDecimals, setInputTokenDecimals] = useState(18)
  const [outputTokenDecimals, setOutputTokenDecimals] = useState(18)

  const isETHToToken = inputToken === 'ETH' && outputToken !== ''
  const isTokenToETH = inputToken !== 'ETH' && outputToken === 'ETH'
  const isTokenToToken = inputToken !== 'ETH' && outputToken !== '' && outputToken !== 'ETH'

  const { data: inputExchangeAddr } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getExchange',
    args: inputToken !== 'ETH' && inputToken ? [inputToken as `0x${string}`] : undefined,
    query: { enabled: inputToken !== 'ETH' && !!inputToken && inputToken.startsWith('0x') },
  })

  const { data: outputExchangeAddr } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getExchange',
    args: outputToken !== 'ETH' && outputToken ? [outputToken as `0x${string}`] : undefined,
    query: { enabled: outputToken !== 'ETH' && !!outputToken && outputToken.startsWith('0x') },
  })

  const { data: inputDecimals } = useReadContract({
    address: inputToken !== 'ETH' ? (inputToken as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: inputToken !== 'ETH' && inputToken.startsWith('0x') },
  })

  const { data: outputDecimals } = useReadContract({
    address: outputToken !== 'ETH' ? (outputToken as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: outputToken !== 'ETH' && outputToken.startsWith('0x') },
  })

  const { data: ethBalance } = useBalance({ address })
  const { data: inputTokenBalance } = useReadContract({
    address: inputToken !== 'ETH' ? (inputToken as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: inputToken !== 'ETH' && !!address && inputToken.startsWith('0x') },
  })

  const { data: outputTokenBalance } = useReadContract({
    address: outputToken !== 'ETH' ? (outputToken as `0x${string}`) : undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: outputToken !== 'ETH' && !!address && outputToken.startsWith('0x') },
  })

  const activeExchange = isETHToToken || isTokenToETH 
    ? (isETHToToken ? outputExchangeAddr : inputExchangeAddr)
    : (isTokenToToken ? inputExchangeAddr : null)

  const { data: price } = useReadContract({
    address: activeExchange as `0x${string}`,
    abi: EXCHANGE_ABI,
    functionName: isETHToToken ? 'getEthToTokenInputPrice' : 'getTokenToEthInputPrice',
    args: inputAmount && parseFloat(inputAmount) > 0 
      ? [isETHToToken ? parseEther(inputAmount) : parseUnits(inputAmount, inputTokenDecimals)]
      : undefined,
    query: { enabled: !!activeExchange && !!inputAmount && parseFloat(inputAmount) > 0 },
  })

  useEffect(() => {
    if (inputExchangeAddr) {
      setExchangeAddress(inputExchangeAddr as string)
    }
  }, [inputExchangeAddr])

  useEffect(() => {
    if (outputExchangeAddr) {
      setOutputExchangeAddress(outputExchangeAddr as string)
    }
  }, [outputExchangeAddr])

  useEffect(() => {
    if (inputDecimals !== undefined) {
      setInputTokenDecimals(Number(inputDecimals))
    }
  }, [inputDecimals])

  useEffect(() => {
    if (outputDecimals !== undefined) {
      setOutputTokenDecimals(Number(outputDecimals))
    }
  }, [outputDecimals])

  useEffect(() => {
    if (price && inputAmount && parseFloat(inputAmount) > 0) {
      if (isETHToToken) {
        setOutputAmount(formatUnits(price, outputTokenDecimals))
      } else if (isTokenToETH) {
        setOutputAmount(formatEther(price))
      } else if (isTokenToToken) {
        // For token to token, we'd need to calculate through ETH
        // For now, show the ETH equivalent
        setOutputAmount(formatEther(price))
      }
    } else {
      setOutputAmount('')
    }
  }, [price, inputAmount, isETHToToken, isTokenToETH, isTokenToToken, outputTokenDecimals])

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleSwap = async () => {
    if (!activeExchange || !inputAmount || !isConnected) return

    const deadline = getDeadline()

    try {
      if (isETHToToken && outputExchangeAddress) {
        const minTokens = price ? (price * BigInt(995)) / BigInt(1000) : BigInt(0)
        await writeContract({
          address: outputExchangeAddress as `0x${string}`,
          abi: EXCHANGE_ABI,
          functionName: 'ethToTokenSwapInput',
          args: [minTokens, BigInt(deadline)],
          value: parseEther(inputAmount),
        })
      } else if (isTokenToETH && exchangeAddress) {
        const tokensSold = parseUnits(inputAmount, inputTokenDecimals)
        const minEth = price ? (price * BigInt(995)) / BigInt(1000) : BigInt(0)
        
        await writeContract({
          address: inputToken as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [exchangeAddress as `0x${string}`, tokensSold],
        })

        await writeContract({
          address: exchangeAddress as `0x${string}`,
          abi: EXCHANGE_ABI,
          functionName: 'tokenToEthSwapInput',
          args: [tokensSold, minEth, BigInt(deadline)],
        })
      } else if (isTokenToToken && exchangeAddress && outputExchangeAddress) {
        const tokensSold = parseUnits(inputAmount, inputTokenDecimals)
        const minEthBought = BigInt(0)
        const minTokensBought = BigInt(0)

        await writeContract({
          address: inputToken as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [exchangeAddress as `0x${string}`, tokensSold],
        })

        await writeContract({
          address: exchangeAddress as `0x${string}`,
          abi: EXCHANGE_ABI,
          functionName: 'tokenToTokenSwapInput',
          args: [tokensSold, minTokensBought, minEthBought, BigInt(deadline), outputToken as `0x${string}`],
        })
      }
    } catch (error) {
      console.error('Swap error:', error)
    }
  }

  const handleSwitchTokens = () => {
    const tempToken = inputToken
    const tempAmount = inputAmount
    setInputToken(outputToken === '' ? 'ETH' : outputToken)
    setOutputToken(tempToken === 'ETH' ? '' : tempToken)
    setInputAmount(outputAmount)
    setOutputAmount(tempAmount)
  }

  const canSwap = isConnected && activeExchange && inputAmount && parseFloat(inputAmount) > 0 && outputAmount

  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-2xl">
        <TokenInput
          value={inputAmount}
          onChange={setInputAmount}
          tokenAddress={inputToken}
          onTokenAddressChange={(addr) => setInputToken(addr || 'ETH')}
          balance={inputToken === 'ETH' ? ethBalance?.value : inputTokenBalance}
          decimals={inputTokenDecimals}
          isETH={inputToken === 'ETH'}
        />
      </div>

      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleSwitchTokens}
          className="p-2 bg-[#161b22] border-2 border-[#30363d] rounded-full hover:border-[#667eea] transition-smooth"
        >
          <svg className="w-5 h-5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-2xl">
        <TokenInput
          value={outputAmount}
          onChange={() => {}}
          tokenAddress={outputToken || 'ETH'}
          onTokenAddressChange={(addr) => setOutputToken(addr === 'ETH' ? '' : addr)}
          balance={outputToken === 'ETH' ? ethBalance?.value : outputTokenBalance}
          decimals={outputTokenDecimals}
          readOnly
          isETH={outputToken === 'ETH' || outputToken === ''}
        />
      </div>

      {activeExchange && inputAmount && parseFloat(inputAmount) > 0 && outputAmount && (
        <PriceDisplay
          exchangeAddress={activeExchange as string}
          inputAmount={inputAmount}
          swapType={isETHToToken ? 'ethToToken' : isTokenToETH ? 'tokenToEth' : 'tokenToToken'}
          tokenDecimals={isETHToToken ? outputTokenDecimals : inputTokenDecimals}
        />
      )}

      <button
        onClick={handleSwap}
        disabled={!canSwap || isPending || isConfirming}
        className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold rounded-xl hover:from-[#5568d3] hover:to-[#6a3f8f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
      >
        {!isConnected
          ? 'Connect Wallet'
          : !activeExchange
          ? 'Select Tokens'
          : !inputAmount
          ? 'Enter Amount'
          : isPending || isConfirming
          ? 'Processing...'
          : isSuccess
          ? 'Swap Successful!'
          : 'Swap'}
      </button>

      {isSuccess && hash && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-center text-sm">
          Transaction confirmed!{' '}
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-green-300"
          >
            View on Etherscan
          </a>
        </div>
      )}
    </div>
  )
}
