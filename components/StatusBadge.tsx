import { prettyStatus, statusColors, statusIcons } from '@/utils/status';
import type { OrderStatus } from '@/types/orders';

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800';
  const icon = statusIcons[status] || '•';
  const label = prettyStatus(status);
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${colorClass}`}>
      <span className="mr-1">{icon}</span>
      <span className="capitalize">{label}</span>
    </span>
  );
}