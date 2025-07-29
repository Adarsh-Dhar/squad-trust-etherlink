'use client'

import { createConfig, http, WagmiProvider } from 'wagmi'
import { defineChain } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { injected } from 'wagmi/connectors'
import {etherlinkTestnet} from 'viem/chains'

// Define the Anvil local network
export const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'GoChain Testnet',
    symbol: 'Go'
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545']
    },
    public: {
      http: ['http://127.0.0.1:8545']
    }
  }
})

const config = createConfig({
  chains: [anvil, etherlinkTestnet],
  transports: {
    [anvil.id]: http('http://127.0.0.1:8545'),
    [etherlinkTestnet.id]: http('https://node.ghostnet.etherlink.com'),
  },
  connectors: [
    injected({
      target: 'metaMask'
    }),
  ],
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}