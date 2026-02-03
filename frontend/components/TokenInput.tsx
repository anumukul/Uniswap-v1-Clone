'use client'

import { formatEther, formatUnits } from '@/lib/utils'
import TokenSelector from './TokenSelector'

interface TokenInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  tokenAddress?: string
  onTokenAddressChange?: (address: string) => void
  balance?: bigint
  decimals?: number
  readOnly?: boolean
  isETH?: boolean
}

export default function TokenInput({
  label,
  value,
  onChange,
  tokenAddress,
  onTokenAddressChange,
  balance,
  decimals = 18,
  readOnly = false,
  isETH = false,
}: TokenInputProps) {
  const displayBalance = balance
    ? decimals === 18
      ? formatEther(balance)
      : formatUnits(balance, decimals)
    : '0'

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        {label && <label className="text-[#8b949e] text-sm font-medium">{label}</label>}
        {balance !== undefined && (
          <span className="text-xs text-[#8b949e]">
            Balance: {parseFloat(displayBalance).toFixed(6)}
          </span>
        )}
      </div>
      <div className="flex space-x-2">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value
            if (val === '' || /^\d*\.?\d*$/.test(val)) {
              onChange(val)
            }
          }}
          placeholder="0.0"
          readOnly={readOnly}
          className={`flex-1 px-4 py-4 bg-[#1c2128] border border-[#30363d] rounded-xl text-white text-2xl font-semibold placeholder-[#484f58] focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
            readOnly ? 'cursor-not-allowed opacity-70' : ''
          }`}
        />
        <div className="w-32">
          {tokenAddress !== undefined && onTokenAddressChange ? (
            <TokenSelector
              value={isETH ? 'ETH' : (tokenAddress || '')}
              onChange={(addr) => {
                if (addr === 'ETH') {
                  onTokenAddressChange('ETH')
                } else {
                  onTokenAddressChange(addr)
                }
              }}
              balance={balance}
              decimals={decimals}
              isETH={isETH}
            />
          ) : (
            <div className="h-full flex items-center justify-center px-4 bg-[#1c2128] border border-[#30363d] rounded-xl">
              <span className="text-[#8b949e] text-sm">ETH</span>
            </div>
          )}
        </div>
      </div>
      {!readOnly && balance !== undefined && (
        <button
          onClick={() => onChange(displayBalance)}
          className="text-xs text-[#667eea] hover:text-[#79c0ff] transition-smooth"
        >
          Max
        </button>
      )}
    </div>
  )
}
