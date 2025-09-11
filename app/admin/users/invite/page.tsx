'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InviteEntry {
  email: string;
  role: string;
}

export default function InviteUsersPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [invites, setInvites] = useState<InviteEntry[]>([
    { email: '', role: 'viewer' }
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const roles = [
    { value: 'admin', label: 'Administrator' },
    { value: 'sales_rep', label: 'Sales Representative' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'production', label: 'Production' },
    { value: 'art_team', label: 'Art Team' },
    { value: 'viewer', label: 'Viewer' }
  ];

  const addInvite = () => {
    setInvites([...invites, { email: '', role: 'viewer' }]);
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const updateInvite = (index: number, field: 'email' | 'role', value: string) => {
    const updated = [...invites];
    updated[index][field] = value;
    setInvites(updated);
  };

  const handleSave = async () => {
    if (!isAdmin) {
      setMessage('Only administrators can invite users');
      return;
    }

    // Filter out empty entries
    const validInvites = invites.filter(inv => inv.email.trim());
    
    if (validInvites.length === 0) {
      setMessage('Please enter at least one email address');
      return;
    }

    // Validate email domains
    const invalidEmails = validInvites.filter(inv => {
      const domain = inv.email.split('@')[1];
      return !['shurehw.com', 'shureprint.com', 'thebinyangroup.com'].includes(domain);
    });

    if (invalidEmails.length > 0) {
      setMessage(`Invalid email domains. Only @shurehw.com, @shureprint.com, and @thebinyangroup.com are allowed.`);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invites: validInvites })
      });

      if (response.ok) {
        setMessage(`Successfully pre-configured ${validInvites.length} user(s). They can now sign in with Google.`);
        setTimeout(() => router.push('/admin/users'), 2000);
      } else {
        setMessage('Error saving invites');
      }
    } catch (error) {
      setMessage('Error saving invites');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <p className="text-red-600">Only administrators can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>
        
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Invite Team Members
        </h1>
        <p className="text-gray-600 mt-2">
          Pre-configure team members so they can sign in with their Google accounts.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {invites.map((invite, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={invite.email}
                  onChange={(e) => updateInvite(index, 'email', e.target.value)}
                  placeholder="user@shurehw.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="w-48">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={invite.role}
                  onChange={(e) => updateInvite(index, 'role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => removeInvite(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                disabled={invites.length === 1}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addInvite}
          className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Another
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Invites'}
          </button>
          
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> After saving, invited users can sign in with Google using their company email. 
            They'll automatically receive the role you've assigned here.
          </p>
        </div>
      </div>
    </div>
  );
}