'use client';

import { Plus, Upload, Download, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ContactsHeaderProps {
  totalCount: number;
}

export default function ContactsHeader({ totalCount }: ContactsHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    router.push(`/crm/contacts?${params.toString()}`);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
          <p className="mt-1 text-sm text-gray-500">
            {totalCount} total contacts in your organization
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </form>

          {/* Actions */}
          <button
            onClick={() => router.push('/crm/contacts/import')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </button>

          <button
            onClick={() => {
              // Export functionality
              alert('Export functionality coming soon!');
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>

          <button
            onClick={() => router.push('/crm/contacts/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Contact
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-gray-500">Quick filters:</span>
        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('lifecycle_stage', 'lead');
            router.push(`/crm/contacts?${params.toString()}`);
          }}
          className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Leads
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('lifecycle_stage', 'customer');
            router.push(`/crm/contacts?${params.toString()}`);
          }}
          className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 hover:bg-green-200"
        >
          Customers
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams(window.location.search);
            params.set('lifecycle_stage', 'opportunity');
            router.push(`/crm/contacts?${params.toString()}`);
          }}
          className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
        >
          Opportunities
        </button>
        <button
          onClick={() => {
            router.push('/crm/contacts');
          }}
          className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}