export const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  sampling: 'bg-purple-100 text-purple-800',
  in_production: 'bg-orange-100 text-orange-800',
  finishing: 'bg-indigo-100 text-indigo-800',
  quality_check: 'bg-pink-100 text-pink-800',
  shipping: 'bg-cyan-100 text-cyan-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

export const statusIcons: Record<string, string> = {
  pending: '⏳',
  confirmed: '✅',
  sampling: '🎨',
  in_production: '🏭',
  finishing: '✂️',
  quality_check: '🔍',
  shipping: '📦',
  out_for_delivery: '🚚',
  delivered: '✓',
  cancelled: '❌'
};

export function prettyStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}