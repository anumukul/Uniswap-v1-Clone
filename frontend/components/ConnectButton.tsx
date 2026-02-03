'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { sepolia } from 'wagmi/chains'

interface EthereumProvider {
  isMetaMask?: boolean
  request?: (args: { method: string; params?: any[] }) => Promise<any>
  on?: (event: string, handler: (chainId: string) => void) => void
  removeListener?: (event: string, handler: (chainId: string) => void) => void
}

export default function ConnectButton() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const [showModal, setShowModal] = useState(false)
  const [detectedChainId, setDetectedChainId] = useState<number | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  
  const currentChainId = chain?.id || detectedChainId
  const isWrongNetwork = currentChainId && currentChainId !== sepolia.id

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return

    const ethereum = (window as any).ethereum as EthereumProvider

    const updateChainId = async () => {
      try {
        const chainIdHex = await ethereum.request!({ method: 'eth_chainId' })
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

    if (ethereum.on) {
      ethereum.on('chainChanged', handleChainChanged)
    }

    return () => {
      if (ethereum && ethereum.removeListener) {
        ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const availableConnectors = connectors.filter((connector) => {
    try {
      return true
    } catch {
      return false
    }
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowModal(false)
      }
    }

    if (showModal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showModal])

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-3">
        {isWrongNetwork && (
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isSwitchingChain}
            className="px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-400 text-xs hover:bg-yellow-500/30 transition-smooth disabled:opacity-50"
          >
            {isSwitchingChain ? 'Switching...' : 'Switch to Sepolia'}
          </button>
        )}
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 bg-[#1c2128] border border-[#30363d] rounded-xl text-white font-medium hover:bg-[#21262d] transition-smooth"
        >
          {address.slice(0, 6)}...{address.slice(-4)}
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowModal(!showModal)}
        className="px-6 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white font-semibold rounded-xl hover:from-[#5568d3] hover:to-[#6a3f8f] transition-all shadow-lg hover:shadow-xl"
      >
        Connect Wallet
      </button>

      {showModal && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          
          <div
            ref={modalRef}
            className="absolute right-0 top-full mt-2 z-50 w-80 bg-[#161b22] border border-[#30363d] rounded-2xl shadow-2xl overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Connect Wallet</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-[#8b949e] hover:text-white transition-smooth p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {availableConnectors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-[#8b949e] mb-2">No wallets detected</p>
                    <p className="text-sm text-[#8b949e] mb-4">Please install MetaMask or another wallet extension</p>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-[#667eea] text-white rounded-lg hover:bg-[#5568d3] transition-smooth"
                    >
                      Install MetaMask
                    </a>
                  </div>
                ) : (
                  availableConnectors.map((connector) => {
                    const connectorName = connector.name === 'Injected' 
                      ? (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask ? 'MetaMask' : 'Browser Wallet')
                      : connector.name
                    
                    return (
                      <button
                        key={connector.uid}
                        onClick={async () => {
                          try {
                            await connect({ connector })
                            setShowModal(false)
                          } catch (error) {
                            console.error('Connection error:', error)
                          }
                        }}
                        disabled={isPending}
                        className="w-full flex items-center justify-between p-3 bg-[#1c2128] border border-[#30363d] rounded-xl hover:bg-[#21262d] transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#21262d] rounded-lg flex items-center justify-center flex-shrink-0">
                            {(connectorName === 'MetaMask' || (typeof window !== 'undefined' && (window as any).ethereum?.isMetaMask && connector.name === 'Injected')) && (
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#E2761B"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#E4761B"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#E4761B"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#E4761B"/>
                              </svg>
                            )}
                            {connectorName === 'Browser Wallet' && connectorName !== 'MetaMask' && (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            )}
                            {connectorName === 'WalletConnect' && (
                              <div className="w-5 h-5 bg-[#3b99fc] rounded-full"></div>
                            )}
                            {connectorName === 'Coinbase Wallet' && (
                              <div className="w-5 h-5 bg-[#0052ff] rounded-full"></div>
                            )}
                          </div>
                          <div className="text-left min-w-0">
                            <div className="text-white font-medium text-sm truncate">{connectorName}</div>
                            <div className="text-xs text-[#8b949e] truncate">
                              {connectorName === 'Browser Wallet' ? 'Browser extension' : `Connect using ${connectorName}`}
                            </div>
                          </div>
                        </div>
                        <svg className="w-4 h-4 text-[#8b949e] flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )
                  })
                )}
              </div>

              <p className="mt-4 text-xs text-center text-[#8b949e] pt-4 border-t border-[#30363d]">
                By connecting, you agree to Uniswap's Terms of Service
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
