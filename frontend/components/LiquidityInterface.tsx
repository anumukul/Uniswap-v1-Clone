'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useBalance } from 'wagmi'
import { parseEther, formatEther, formatUnits, parseUnits, getDeadline } from '@/lib/utils'
import { FACTORY_ABI, EXCHANGE_ABI, ERC20_ABI } from '@/lib/abis'
import { FACTORY_ADDRESS } from '@/config/contracts'
import TokenInput from './TokenInput'
import TokenSelector from './TokenSelector'

type LiquidityAction = 'add' | 'remove'

export default function LiquidityInterface() {
  const { address, isConnected } = useAccount()
  const [action, setAction] = useState<LiquidityAction>('add')
  const [tokenAddress, setTokenAddress] = useState('')
  const [ethAmount, setEthAmount] = useState('')
  const [tokenAmount, setTokenAmount] = useState('')
  const [liquidityAmount, setLiquidityAmount] = useState('')
  const [exchangeAddress, setExchangeAddress] = useState<string | null>(null)
  const [tokenDecimals, setTokenDecimals] = useState(18)

  const { data: exchangeAddr } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'getExchange',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress && tokenAddress.startsWith('0x') },
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress && tokenAddress.startsWith('0x') },
  })

  const { data: ethBalance } = useBalance({ address })
  const { data: tokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress && !!address && tokenAddress.startsWith('0x') },
  })

  const { data: liquidityBalance } = useReadContract({
    address: exchangeAddress as `0x${string}`,
    abi: EXCHANGE_ABI,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!exchangeAddress && !!address },
  })

  const { data: exchangeEthBalance } = useBalance({ address: exchangeAddress as `0x${string}` })
  const { data: exchangeTokenBalance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: exchangeAddress ? [exchangeAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress && !!exchangeAddress && tokenAddress.startsWith('0x') },
  })

  const { data: totalSupply } = useReadContract({
    address: exchangeAddress as `0x${string}`,
    abi: EXCHANGE_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!exchangeAddress },
  })

  useEffect(() => {
    if (exchangeAddr) {
      setExchangeAddress(exchangeAddr as string)
    }
  }, [exchangeAddr])

  useEffect(() => {
    if (decimals !== undefined) {
      setTokenDecimals(Number(decimals))
    }
  }, [decimals])

  useEffect(() => {
    if (action === 'add' && ethAmount && exchangeEthBalance && exchangeTokenBalance && totalSupply && totalSupply > BigInt(0)) {
      const ethReserve = exchangeEthBalance.value
      const tokenReserve = exchangeTokenBalance
      if (ethReserve > BigInt(0)) {
        const calculatedTokenAmount = (parseEther(ethAmount) * tokenReserve) / ethReserve
        setTokenAmount(formatUnits(calculatedTokenAmount, tokenDecimals))
      }
    }
  }, [ethAmount, exchangeEthBalance, exchangeTokenBalance, totalSupply, action, tokenDecimals])

  useEffect(() => {
    if (action === 'remove' && liquidityAmount && totalSupply && exchangeEthBalance && exchangeTokenBalance) {
      const liquidity = parseEther(liquidityAmount)
      const ethAmount = (liquidity * exchangeEthBalance.value) / totalSupply
      const tokenAmount = (liquidity * exchangeTokenBalance) / totalSupply
      setEthAmount(formatEther(ethAmount))
      setTokenAmount(formatUnits(tokenAmount, tokenDecimals))
    }
  }, [liquidityAmount, totalSupply, exchangeEthBalance, exchangeTokenBalance, action, tokenDecimals])

  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const handleAddLiquidity = async () => {
    if (!exchangeAddress || !ethAmount || !tokenAmount || !isConnected) return

    const deadline = getDeadline()
    const minLiquidity = BigInt(0)
    const maxTokens = parseUnits(tokenAmount, tokenDecimals)

    try {
      await writeContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [exchangeAddress as `0x${string}`, maxTokens],
      })

      await writeContract({
        address: exchangeAddress as `0x${string}`,
        abi: EXCHANGE_ABI,
        functionName: 'addLiquidity',
        args: [minLiquidity, maxTokens, BigInt(deadline)],
        value: parseEther(ethAmount),
      })
    } catch (error) {
      console.error('Add liquidity error:', error)
    }
  }

  const handleRemoveLiquidity = async () => {
    if (!exchangeAddress || !liquidityAmount || !isConnected) return

    const deadline = getDeadline()
    const amount = parseEther(liquidityAmount)
    const minEth = BigInt(0)
    const minTokens = BigInt(0)

    try {
      await writeContract({
        address: exchangeAddress as `0x${string}`,
        abi: EXCHANGE_ABI,
        functionName: 'removeLiquidity',
        args: [amount, minEth, minTokens, BigInt(deadline)],
      })
    } catch (error) {
      console.error('Remove liquidity error:', error)
    }
  }

  const displayLiquidityBalance = liquidityBalance
    ? formatEther(liquidityBalance)
    : '0'

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 p-1 bg-[#1c2128] rounded-xl border border-[#30363d]">
        <button
          onClick={() => setAction('add')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-smooth ${
            action === 'add'
              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
              : 'text-[#8b949e] hover:text-white'
          }`}
        >
          Add
        </button>
        <button
          onClick={() => setAction('remove')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-smooth ${
            action === 'remove'
              ? 'bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white'
              : 'text-[#8b949e] hover:text-white'
          }`}
        >
          Remove
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8b949e] mb-2">Token Address</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-4 py-3 bg-[#1c2128] border border-[#30363d] rounded-xl text-white placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
          />
          <TokenSelector
            value={tokenAddress}
            onChange={setTokenAddress}
          />
        </div>
      </div>

      {action === 'add' ? (
        <>
          <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-2xl">
            <TokenInput
              label="ETH Amount"
              value={ethAmount}
              onChange={setEthAmount}
              balance={ethBalance?.value}
              decimals={18}
              isETH={true}
            />
          </div>

          <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-2xl">
            <TokenInput
              label="Token Amount"
              value={tokenAmount}
              onChange={setTokenAmount}
              tokenAddress={tokenAddress}
              onTokenAddressChange={setTokenAddress}
              balance={tokenBalance}
              decimals={tokenDecimals}
            />
          </div>

          <button
            onClick={handleAddLiquidity}
            disabled={!isConnected || !exchangeAddress || !ethAmount || !tokenAmount || isPending || isConfirming}
            className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold rounded-xl hover:from-[#5568d3] hover:to-[#6a3f8f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isPending || isConfirming ? 'Processing...' : isSuccess ? 'Liquidity Added!' : 'Add Liquidity'}
          </button>
        </>
      ) : (
        <>
          <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-2xl">
            <TokenInput
              label="Liquidity Amount"
              value={liquidityAmount}
              onChange={setLiquidityAmount}
              balance={liquidityBalance}
              decimals={18}
            />
          </div>

          {(ethAmount || tokenAmount) && (
            <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-xl">
              <div className="text-sm text-[#8b949e] mb-2">You will receive:</div>
              <div className="space-y-2">
                <div className="flex justify-between text-white">
                  <span>ETH:</span>
                  <span className="font-medium">{parseFloat(ethAmount || '0').toFixed(6)}</span>
                </div>
                <div className="flex justify-between text-white">
                  <span>Tokens:</span>
                  <span className="font-medium">{parseFloat(tokenAmount || '0').toFixed(6)}</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleRemoveLiquidity}
            disabled={!isConnected || !exchangeAddress || !liquidityAmount || isPending || isConfirming}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {isPending || isConfirming ? 'Processing...' : isSuccess ? 'Liquidity Removed!' : 'Remove Liquidity'}
          </button>
        </>
      )}

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

      {exchangeAddress && (
        <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-xl text-sm">
          <div className="space-y-1">
            <div className="flex justify-between text-[#8b949e]">
              <span>Your Liquidity:</span>
              <span className="text-white">{parseFloat(displayLiquidityBalance).toFixed(6)}</span>
            </div>
            <div className="flex justify-between text-[#8b949e]">
              <span>Exchange:</span>
              <span className="text-white text-xs font-mono">{exchangeAddress.slice(0, 10)}...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
