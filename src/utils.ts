export function formatCurrency(amount: number) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}k`;
  return `$${amount}`;
};

export function formatNumber(amount: number) {
  if (amount >= 1000000) return `${Math.round(amount / 1000000)}M`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K`;
  return amount.toString();
}