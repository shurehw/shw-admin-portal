import { statusProgress } from '@/utils/status';
import type { OrderStatus } from '@/types/orders';

export default function ProgressBar({ status }: { status: OrderStatus }) {
  const pct = statusProgress[status] ?? 0;
  
  return (
    <div className="mb-4" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>Order Placed</span>
        <span>Delivered</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-gray-600 to-gray-900 h-2 rounded-full transition-all duration-500" 
          style={{ width: `${pct}%` }} 
        />
      </div>
    </div>
  );
}