'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import TicketWorkspace from '@/components/ticketing/TicketWorkspace';

export default function TicketsPage() {
  return (
    <AdminLayout>
      <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
        <TicketWorkspace />
      </div>
    </AdminLayout>
  );
}