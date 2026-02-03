'use client'

import { WagmiProvider, createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

const connectors = [
  metaMask(),
  injected({ shimDisconnect: true }),
]

if (projectId) {
  try {
    connectors.push(walletConnect({ projectId }))
  } catch (error) {
    console.warn('WalletConnect connector failed to initialize:', error)
  }
}

try {
  connectors.push(coinbaseWallet({ appName: 'Uniswap V1 Clone' }))
} catch (error) {
  console.warn('Coinbase Wallet connector failed to initialize:', error)
}

const config = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
