'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { FACTORY_ABI } from '@/lib/abis'
import { FACTORY_ADDRESS } from '@/config/contracts'
import TokenSelector from './TokenSelector'

export default function CreateExchange() {
  const { address, isConnected } = useAccount()
  const [tokenAddress, setTokenAddress] = useState('')
  const [exchangeAddress, setExchangeAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: existingExchange } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: FACTORY_ABI,
    functionName: 'getExchange',
    args: tokenAddress ? [tokenAddress as `0x${string}`] : undefined,
    query: { enabled: !!tokenAddress && tokenAddress.startsWith('0x') },
  })

  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract({
    mutation: {
      onError: (error) => {
        console.error('Create exchange error:', error)
        let errorMessage = 'Failed to create exchange'
        
        if (error.message) {
          errorMessage = error.message
        } else if (error.cause) {
          errorMessage = String(error.cause)
        }
        
        if (errorMessage.includes('Exchange already exists') || errorMessage.includes('EXCHANGE_EXISTS')) {
          errorMessage = 'Exchange already exists for this token'
        } else if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
          errorMessage = 'Transaction was rejected'
        } else if (errorMessage.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds for transaction'
        }
        
        setError(errorMessage)
      },
      onSuccess: () => {
        setError(null)
      }
    }
  })
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (existingExchange && existingExchange !== '0x0000000000000000000000000000000000000000') {
      setExchangeAddress(existingExchange as string)
    } else {
      setExchangeAddress(null)
    }
  }, [existingExchange])

  useEffect(() => {
    if (writeError) {
      let errorMessage = 'Failed to create exchange'
      
      if (writeError.message) {
        errorMessage = writeError.message
      }
      
      if (errorMessage.includes('Exchange already exists') || errorMessage.includes('EXCHANGE_EXISTS')) {
        errorMessage = 'Exchange already exists for this token'
      } else if (errorMessage.includes('user rejected') || errorMessage.includes('User rejected')) {
        errorMessage = 'Transaction was rejected'
      } else if (errorMessage.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      }
      
      setError(errorMessage)
    } else {
      setError(null)
    }
  }, [writeError])

  const handleCreateExchange = () => {
    if (!tokenAddress || !isConnected) {
      setError('Please connect wallet and enter a token address')
      return
    }

    const normalizedAddress = tokenAddress.trim().toLowerCase()
    
    if (!normalizedAddress.startsWith('0x') || normalizedAddress.length !== 42) {
      setError('Invalid token address. Must be a valid Ethereum address (0x...)')
      return
    }

    if (exchangeAddress) {
      setError('Exchange already exists for this token')
      return
    }

    setError(null)
    
    try {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'createExchange',
        args: [normalizedAddress as `0x${string}`],
      })
    } catch (err: any) {
      console.error('Create exchange error:', err)
      setError(err?.message || 'Failed to create exchange')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Create New Exchange</h3>
        <p className="text-sm text-[#8b949e]">
          Deploy a new exchange for any ERC20 token
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#8b949e] mb-2">Token Address</label>
        <div className="flex space-x-2">
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => {
              let value = e.target.value.trim()
              if (value.startsWith('0x')) {
                value = value.toLowerCase()
              }
              setTokenAddress(value)
              setError(null)
            }}
            placeholder="0x..."
            className="flex-1 px-4 py-3 bg-[#1c2128] border border-[#30363d] rounded-xl text-white placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#667eea]"
          />
          <TokenSelector
            value={tokenAddress}
            onChange={setTokenAddress}
          />
        </div>
        <p className="mt-2 text-xs text-[#8b949e]">
          Enter a valid ERC20 token contract address
        </p>
      </div>

      {exchangeAddress && (
        <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
          <div className="text-sm text-blue-400">
            <div className="font-semibold mb-2">Exchange Already Exists!</div>
            <div className="break-all text-xs font-mono">{exchangeAddress}</div>
            <a
              href={`https://sepolia.etherscan.io/address/${exchangeAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline mt-2 inline-block hover:text-blue-300"
            >
              View on Etherscan
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCreateExchange}
        disabled={!isConnected || !tokenAddress || !!exchangeAddress || isPending || isConfirming}
        className="w-full py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-bold rounded-xl hover:from-[#5568d3] hover:to-[#6a3f8f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
      >
        {isPending || isConfirming
          ? 'Creating Exchange...'
          : isSuccess
          ? 'Exchange Created!'
          : 'Create Exchange'}
      </button>

      {isSuccess && hash && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-400 text-center text-sm">
          <div className="mb-2">Exchange created successfully!</div>
          <a
            href={`https://sepolia.etherscan.io/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-green-300"
          >
            View Transaction on Etherscan
          </a>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-smooth"
          >
            Refresh to see new exchange
          </button>
        </div>
      )}

      {(isPending || isConfirming) && (
        <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl text-blue-400 text-center text-sm">
          {isPending ? 'Waiting for transaction...' : 'Confirming transaction...'}
        </div>
      )}

      <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-xl text-sm text-[#8b949e]">
        <div className="font-semibold text-white mb-2">How it works:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Enter a valid ERC20 token address</li>
          <li>Click "Create Exchange" to deploy a new exchange contract</li>
          <li>Once created, you can add liquidity and start trading</li>
          <li>Each token can only have one exchange</li>
        </ul>
      </div>
    </div>
  )
}
