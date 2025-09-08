'use client';

import AdminLayout from '@/components/AdminLayout';
import TicketWorkspace from '@/components/ticketing/TicketWorkspace';

export default function TicketsPage() {
  return (
    <AdminLayout>
      <div className="h-full bg-gray-50">
        <TicketWorkspace />
      </div>
    </AdminLayout>
  );
}