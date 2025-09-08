'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import TicketSettings from '@/components/ticketing/TicketSettings';

export default function TicketSettingsPage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ticket Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure ticketing system preferences, SLAs, and routing rules
          </p>
        </div>
        
        <TicketSettings />
      </div>
    </AdminLayout>
  );
}