'use client';

import { Plus, Download, Upload, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface CompaniesHeaderProps {
  totalCount: number;
}

export default function CompaniesHeader({ totalCount }: CompaniesHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="border-b bg-white">
      <div className="flex items-center justify-between p-6">
        <div>
          <h1 className="text-2xl font-semibold">Companies</h1>
          <p className="text-sm text-gray-600 mt-1">
            {totalCount} {totalCount === 1 ? 'company' : 'companies'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import
          </button>
          
          <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </button>
          
          <Link
            href="/crm/companies/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Company
          </Link>
        </div>
      </div>
      
      <div className="px-6 pb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}