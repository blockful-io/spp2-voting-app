import { useState, useEffect } from 'react';
import { providers } from 'ethers';

// Mapping to cache ENS results to avoid redundant lookups
const ensCache: Record<string, { name: string | null; avatar: string | null }> = {};

interface EnsData {
  name: string | null;
  avatar: string | null;
}

export function useEnsData(address: string | undefined): {
  ensName: string | null;
  ensAvatar: string | null;
  isLoading: boolean;
} {
  const [ensData, setEnsData] = useState<EnsData>({ name: null, avatar: null });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchEnsData() {
      if (!address) return;
      
      // Check cache first
      if (ensCache[address]) {
        setEnsData(ensCache[address]);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Connect to Ethereum mainnet using a public provider
        const provider = new providers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo');
        
        // Try to resolve ENS name
        const name = await provider.lookupAddress(address);
        
        // If name exists, try to get avatar
        let avatar = null;
        if (name) {
          try {
            const resolver = await provider.getResolver(name);
            if (resolver) {
              avatar = await resolver.getText('avatar');
            }
          } catch (error) {
            console.error('Error fetching ENS avatar:', error);
          }
        }
        
        // Store in cache and state
        const result = { name, avatar };
        ensCache[address] = result;
        setEnsData(result);
      } catch (error) {
        console.error('Error fetching ENS data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchEnsData();
  }, [address]);
  
  return {
    ensName: ensData.name,
    ensAvatar: ensData.avatar,
    isLoading
  };
} 