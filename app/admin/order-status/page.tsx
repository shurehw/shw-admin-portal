'use client';

import AdminLayout from '@/components/AdminLayout';
import OrderStatus from '@/components/OrderStatus';

export default function OrderStatusPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <OrderStatus />
      </div>
    </AdminLayout>
  );
}