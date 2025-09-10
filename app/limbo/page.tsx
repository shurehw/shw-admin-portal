'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import LimboRequestForm from '@/components/limbo/LimboRequestForm';
import LimboRequestList from '@/components/limbo/LimboRequestList';
import { Plus, List, Archive } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LimboPage() {
  const [activeView, setActiveView] = useState<'list' | 'new'>('list');
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (activeView === 'list') {
      fetchRequests();
    }
  }, [activeView]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/limbo/requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/limbo/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setActiveView('list');
        fetchRequests();
      } else {
        const error = await response.json();
        alert(`Error creating request: ${error.message}`);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this request?')) return;

    try {
      const response = await fetch(`/api/limbo/requests/${id}/archive`, {
        method: 'PUT',
      });

      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error archiving request:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/limbo/requests/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `limbo-requests-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting requests:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Archive className="h-8 w-8 text-gray-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Limbo Requests</h1>
                <p className="text-gray-600">Sales team item requests and sourcing</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              {activeView === 'list' ? (
                <>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                  >
                    Export CSV
                  </button>
                  <button
                    onClick={() => setActiveView('new')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    New Request
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <List className="h-5 w-5 mr-2" />
                  Back to List
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        {activeView === 'new' ? (
          <LimboRequestForm 
            onSubmit={handleRequestSubmit}
            onCancel={() => setActiveView('list')}
          />
        ) : (
          <LimboRequestList 
            requests={requests}
            loading={loading}
            onArchive={handleArchive}
            onRefresh={fetchRequests}
            currentUser={user}
          />
        )}
      </div>
    </AdminLayout>
  );
}