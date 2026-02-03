'use client'

import { useState, useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { ERC20_ABI } from '@/lib/abis'
import { formatEther, formatUnits } from '@/lib/utils'
import { useAllTokens } from '@/hooks/useAllTokens'

interface TokenSelectorProps {
  value: string
  onChange: (address: string) => void
  label?: string
  balance?: bigint
  decimals?: number
  isETH?: boolean
}

export default function TokenSelector({
  value,
  onChange,
  label,
  balance,
  decimals = 18,
  isETH = false,
}: TokenSelectorProps) {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { tokens, isLoading } = useAllTokens()

  // Get token info if address is provided
  const { data: tokenSymbol } = useReadContract({
    address: value as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
    query: { enabled: !!value && value.startsWith('0x') && !isETH },
  })

  const displayBalance = balance
    ? decimals === 18
      ? formatEther(balance)
      : formatUnits(balance, decimals)
    : '0'

  const displaySymbol = isETH ? 'ETH' : tokenSymbol || 'Select Token'

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens
    const query = searchQuery.toLowerCase()
    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query)
    )
  }, [tokens, searchQuery])

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center space-x-2 px-4 py-3 bg-[#1c2128] border border-[#30363d] rounded-xl hover:bg-[#21262d] transition-smooth"
      >
        {isETH ? (
          <div className="w-8 h-8 bg-gradient-to-br from-[#627EEA] to-[#EC4899] rounded-full flex items-center justify-center text-white font-bold text-xs">
            Ξ
          </div>
        ) : value ? (
          <div className="w-8 h-8 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-white font-bold text-xs">
            {displaySymbol.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div className="w-8 h-8 bg-[#21262d] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
        <span className="text-white font-medium">{displaySymbol}</span>
        <svg className="w-4 h-4 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Select Token</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#8b949e] hover:text-white transition-smooth"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or paste address"
              className="w-full px-4 py-3 bg-[#1c2128] border border-[#30363d] rounded-xl text-white placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#667eea] mb-4"
            />

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              <button
                onClick={() => {
                  onChange('ETH')
                  setShowModal(false)
                }}
                className="w-full flex items-center space-x-3 p-3 bg-[#1c2128] border border-[#30363d] rounded-xl hover:bg-[#21262d] transition-smooth"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#627EEA] to-[#EC4899] rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  Ξ
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="text-white font-medium truncate">Ethereum</div>
                  <div className="text-xs text-[#8b949e]">ETH</div>
                </div>
              </button>

              {isLoading && (
                <div className="text-center py-8">
                  <p className="text-[#8b949e]">Loading tokens...</p>
                </div>
              )}

              {!isLoading && filteredTokens.length === 0 && tokens.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-[#8b949e]">No tokens found matching "{searchQuery}"</p>
                </div>
              )}

              {!isLoading && tokens.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[#8b949e] mb-2">No tokens found</p>
                  <p className="text-sm text-[#8b949e]">Create an exchange for a token to see it here</p>
                </div>
              )}

              {filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onChange(token.address)
                    setShowModal(false)
                  }}
                  className="w-full flex items-center space-x-3 p-3 bg-[#1c2128] border border-[#30363d] rounded-xl hover:bg-[#21262d] transition-smooth"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {token.symbol.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-white font-medium truncate">{token.name}</div>
                    <div className="text-xs text-[#8b949e] truncate">{token.symbol}</div>
                  </div>
                </button>
              ))}

              <div className="p-4 bg-[#1c2128] border border-[#30363d] rounded-xl mt-4">
                <label className="block text-sm font-medium text-[#8b949e] mb-2">
                  Or enter token address
                </label>
                <input
                  type="text"
                  value={searchQuery.startsWith('0x') ? searchQuery : ''}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    if (e.target.value.startsWith('0x') && e.target.value.length === 42) {
                      onChange(e.target.value)
                      setShowModal(false)
                    }
                  }}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-[#21262d] border border-[#30363d] rounded-lg text-white placeholder-[#8b949e] focus:outline-none focus:ring-2 focus:ring-[#667eea] text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
