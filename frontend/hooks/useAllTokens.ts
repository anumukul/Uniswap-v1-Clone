import { useReadContract, useReadContracts } from 'wagmi'
import { FACTORY_ABI, ERC20_ABI } from '@/lib/abis'
import { FACTORY_ADDRESS } from '@/config/contracts'
import { useMemo } from 'react'

export interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
}

export function useAllTokens() {
  const { data: tokenCount, isLoading: isLoadingCount } = useReadContract({
    address: FACTORY_ADDRESS as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: 'tokenCount',
  })

  const tokenIds = useMemo(() => {
    if (!tokenCount || tokenCount === BigInt(0)) return []
    const count = Number(tokenCount)
    return Array.from({ length: Math.min(count, 50) }, (_, i) => i + 1)
  }, [tokenCount])

  const tokenAddressContracts = useMemo(() => {
    if (tokenIds.length === 0) return []
    return tokenIds.map((id) => ({
      address: FACTORY_ADDRESS as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'getTokenWithId' as const,
      args: [BigInt(id)],
    }))
  }, [tokenIds])

  const { data: tokenAddresses, isLoading: isLoadingAddresses } = useReadContracts({
    contracts: tokenAddressContracts,
    query: { enabled: tokenIds.length > 0 },
  })

  const addresses = useMemo(() => {
    if (!tokenAddresses) return []
    return tokenAddresses
      .map((result) => (result.status === 'success' ? result.result : null))
      .filter((addr): addr is string => addr !== null && addr !== '0x0000000000000000000000000000000000000000')
  }, [tokenAddresses])

  const tokenInfoContracts = useMemo(() => {
    if (addresses.length === 0) return []
    return addresses.slice(0, 20).flatMap((address) => [
      {
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol' as const,
      },
      {
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'name' as const,
      },
      {
        address: address as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals' as const,
      },
    ])
  }, [addresses])

  const { data: tokenInfos, isLoading: isLoadingInfos } = useReadContracts({
    contracts: tokenInfoContracts,
    query: { enabled: addresses.length > 0 && tokenInfoContracts.length > 0 },
  })

  const tokens = useMemo(() => {
    if (!tokenInfos || addresses.length === 0) return []
    
    const result: TokenInfo[] = []
    const addressesToProcess = addresses.slice(0, 20)
    
    for (let i = 0; i < addressesToProcess.length; i++) {
      const symbolResult = tokenInfos[i * 3]
      const nameResult = tokenInfos[i * 3 + 1]
      const decimalsResult = tokenInfos[i * 3 + 2]

      if (
        symbolResult?.status === 'success' &&
        nameResult?.status === 'success' &&
        decimalsResult?.status === 'success'
      ) {
        result.push({
          address: addressesToProcess[i],
          symbol: symbolResult.result as string,
          name: nameResult.result as string,
          decimals: Number(decimalsResult.result),
        })
      }
    }
    return result
  }, [tokenInfos, addresses])

  return { 
    tokens, 
    isLoading: isLoadingCount || isLoadingAddresses || isLoadingInfos,
    totalCount: tokenCount ? Number(tokenCount) : 0
  }
}
