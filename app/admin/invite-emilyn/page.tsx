'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Send, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function InviteEmilynPage() {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkResult, setCheckResult] = useState<any>(null);

  const handleInvite = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/admin/users/quick-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        alert(`Invite sent to ${email}!`);
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      setResult({ error: 'Failed to send invite' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    setCheckResult(null);
    
    try {
      const response = await fetch(`/api/admin/users/quick-invite?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setCheckResult(data);
    } catch (error) {
      console.error('Error checking invite:', error);
      setCheckResult({ error: 'Failed to check invite' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Quick Invite User</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="emilyn@shurehw.com"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="admin">Admin</option>
              <option value="sales_rep">Sales Rep</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="customer_service">Customer Service</option>
              <option value="cs_manager">CS Manager</option>
              <option value="production">Production</option>
              <option value="production_manager">Production Manager</option>
              <option value="art_team">Art Team</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleInvite}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Invite via Supabase
            </button>

            <button
              onClick={handleCheck}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              Check Status
            </button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <Check className="h-5 w-5 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{result.message || result.error}</p>
                  {result.details && (
                    <pre className="mt-2 text-xs">{JSON.stringify(result.details, null, 2)}</pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {checkResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Status for {checkResult.email}:</h3>
              <ul className="space-y-1 text-sm">
                <li>Has Pending Invite: {checkResult.hasPendingInvite ? '✅ Yes' : '❌ No'}</li>
                <li>Exists in Supabase Auth: {checkResult.existsInAuth ? '✅ Yes' : '❌ No'}</li>
                {checkResult.inviteDetails && (
                  <li>Role: {checkResult.inviteDetails.role}</li>
                )}
                {checkResult.authUser && (
                  <li>User ID: {checkResult.authUser.id}</li>
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Alternative: Manual Access</h3>
          <p className="text-sm text-yellow-700">
            If the invite doesn't work, Emilyn can still sign in directly at the login page.
            The system will check for her pending invite and grant access automatically.
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            Login URL: https://admin-dashboard-mixki9gk6-shureprint.vercel.app/admin/login
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}