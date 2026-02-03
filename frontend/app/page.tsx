'use client'

import { useState, useEffect } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import ConnectButton from '@/components/ConnectButton'
import SwapInterface from '@/components/SwapInterface'
import LiquidityInterface from '@/components/LiquidityInterface'
import CreateExchange from '@/components/CreateExchange'
import SettingsModal from '@/components/SettingsModal'

type Tab = 'swap' | 'liquidity' | 'create'

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('swap')
  const [showSettings, setShowSettings] = useState(false)
  const { isConnected, chain } = useAccount()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const [detectedChainId, setDetectedChainId] = useState<number | null>(null)
  
  const currentChainId = chain?.id || detectedChainId
  const isWrongNetwork = isConnected && currentChainId !== undefined && currentChainId !== null && currentChainId !== sepolia.id
  
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return

    const updateChainId = async () => {
      try {
        const chainIdHex = await window.ethereum!.request({ method: 'eth_chainId' })
        const chainId = parseInt(chainIdHex as string, 16)
        setDetectedChainId(chainId)
      } catch (error) {
        // Ignore errors
      }
    }

    updateChainId()

    const handleChainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16)
      setDetectedChainId(chainId)
    }

    if (window.ethereum.on) {
      window.ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#0d1117]">
      {isWrongNetwork && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/50 sticky top-0 z-[60]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-400 font-medium text-sm">
                    Wrong Network
                  </p>
                  <p className="text-yellow-400/80 text-xs">
                    Please switch to Sepolia testnet to use this application
                  </p>
                </div>
              </div>
              <button
                onClick={() => switchChain({ chainId: sepolia.id })}
                disabled={isSwitchingChain}
                className="px-4 py-2 bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-400 font-medium hover:bg-yellow-500/40 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSwitchingChain ? 'Switching...' : 'Switch to Sepolia'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <header className="border-b border-[#30363d] bg-[#161b22]/50 backdrop-blur-sm sticky top-0 z-50" style={{ top: isWrongNetwork ? '60px' : '0' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-lg"></div>
                <span className="text-xl font-bold text-white">Uniswap</span>
              </div>
              
              <nav className="hidden md:flex space-x-1">
                <button
                  onClick={() => setActiveTab('swap')}
                  className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                    activeTab === 'swap'
                      ? 'bg-[#1c2128] text-white'
                      : 'text-[#8b949e] hover:text-white hover:bg-[#1c2128]'
                  }`}
                >
                  Swap
                </button>
                <button
                  onClick={() => setActiveTab('liquidity')}
                  className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                    activeTab === 'liquidity'
                      ? 'bg-[#1c2128] text-white'
                      : 'text-[#8b949e] hover:text-white hover:bg-[#1c2128]'
                  }`}
                >
                  Liquidity
                </button>
                <button
                  onClick={() => setActiveTab('create')}
                  className={`px-4 py-2 rounded-lg font-medium transition-smooth ${
                    activeTab === 'create'
                      ? 'bg-[#1c2128] text-white'
                      : 'text-[#8b949e] hover:text-white hover:bg-[#1c2128]'
                  }`}
                >
                  Create Exchange
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#1c2128] rounded-lg border border-[#30363d]">
                <div className={`w-2 h-2 rounded-full ${currentChainId === sepolia.id ? 'bg-green-500' : currentChainId ? 'bg-yellow-500' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-[#8b949e]">
                  {chain ? chain.name : currentChainId === sepolia.id ? 'Sepolia' : currentChainId ? `Chain ${currentChainId}` : 'Sepolia'}
                </span>
              </div>
              
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-lg mx-auto">
          <div className="glass rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white capitalize">{activeTab}</h2>
              {activeTab === 'swap' && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-[#1c2128] rounded-lg transition-smooth"
                >
                  <svg className="w-5 h-5 text-[#8b949e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              )}
            </div>

            <div>
              {activeTab === 'swap' && <SwapInterface />}
              {activeTab === 'liquidity' && <LiquidityInterface />}
              {activeTab === 'create' && <CreateExchange />}
            </div>
          </div>

          <div className="md:hidden mt-6 flex space-x-2">
            <button
              onClick={() => setActiveTab('swap')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-smooth ${
                activeTab === 'swap'
                  ? 'bg-[#1c2128] text-white border border-[#30363d]'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#30363d]'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActiveTab('liquidity')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-smooth ${
                activeTab === 'liquidity'
                  ? 'bg-[#1c2128] text-white border border-[#30363d]'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#30363d]'
              }`}
            >
              Liquidity
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-smooth ${
                activeTab === 'create'
                  ? 'bg-[#1c2128] text-white border border-[#30363d]'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#30363d]'
              }`}
            >
              Create
            </button>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </main>
  )
}
