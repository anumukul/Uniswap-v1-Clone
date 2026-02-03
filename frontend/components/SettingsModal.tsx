'use client'

import { useState } from 'react'

interface SettingsModalProps {
  onClose: () => void
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const [slippage, setSlippage] = useState('0.5')
  const [deadline, setDeadline] = useState('20')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Transaction Settings</h3>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white transition-smooth"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#8b949e] mb-2">
              Slippage Tolerance
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setSlippage('0.1')}
                className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                  slippage === '0.1'
                    ? 'bg-[#667eea] text-white'
                    : 'bg-[#1c2128] text-[#8b949e] hover:text-white'
                }`}
              >
                0.1%
              </button>
              <button
                onClick={() => setSlippage('0.5')}
                className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                  slippage === '0.5'
                    ? 'bg-[#667eea] text-white'
                    : 'bg-[#1c2128] text-[#8b949e] hover:text-white'
                }`}
              >
                0.5%
              </button>
              <button
                onClick={() => setSlippage('1.0')}
                className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                  slippage === '1.0'
                    ? 'bg-[#667eea] text-white'
                    : 'bg-[#1c2128] text-[#8b949e] hover:text-white'
                }`}
              >
                1.0%
              </button>
              <input
                type="text"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#1c2128] border border-[#30363d] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
                placeholder="Custom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#8b949e] mb-2">
              Transaction Deadline
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#1c2128] border border-[#30363d] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#667eea]"
              />
              <span className="text-[#8b949e]">minutes</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold rounded-xl hover:from-[#5568d3] hover:to-[#6a3f8f] transition-all"
        >
          Save Settings
        </button>
      </div>
    </div>
  )
}
