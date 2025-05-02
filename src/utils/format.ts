/**
 * Utility functions for formatting data in the UI
 */

/**
 * Truncates an Ethereum address for display
 * Example: 0x1234...5678
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address) return '';
  
  const start = address.substring(0, startChars);
  const end = address.substring(address.length - endChars);
  
  return `${start}...${end}`;
} 