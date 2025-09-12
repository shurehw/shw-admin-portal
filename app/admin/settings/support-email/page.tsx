'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Mail, Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface EmailAccount {
  id: string;
  email: string;
  department: string;
  status: 'connected' | 'disconnected';
  lastSync?: string;
  autoCreateTickets: boolean;
}

export default function SupportEmailSetup() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('support');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
    checkForMessages();
  }, []);

  const checkForMessages = () => {
    // Check URL parameters for success/error messages
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const details = params.get('details');
    const success = params.get('success');
    const email = params.get('email');
    
    if (error) {
      setErrorMessage(`Error: ${error}${details ? ` - ${details}` : ''}`);
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    } else if (success === 'connected' && email) {
      setSuccessMessage(`Successfully connected ${email}`);
      loadAccounts(); // Reload to show new connection
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/admin/support-email/accounts');
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      // Redirect to Gmail OAuth flow with department parameter
      window.location.href = `/api/auth/gmail/connect?userId=admin&department=${selectedDepartment}&type=support`;
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      alert('Failed to initiate Gmail connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async (accountId: string, accountEmail?: string) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) return;
    
    try {
      // Try both ID and email for backwards compatibility
      const identifier = accountId || accountEmail;
      const response = await fetch(`/api/admin/support-email/accounts/${identifier}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setAccounts(accounts.filter(a => a.id !== accountId && a.email !== accountEmail));
        setSuccessMessage('Account disconnected successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
      setErrorMessage(`Error disconnecting account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const handleToggleAutoCreate = async (accountId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/support-email/accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoCreateTickets: enabled }),
      });
      
      if (response.ok) {
        setAccounts(accounts.map(a => 
          a.id === accountId ? { ...a, autoCreateTickets: enabled } : a
        ));
      }
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleSync = async (accountId: string) => {
    try {
      const response = await fetch(`/api/admin/support-email/accounts/${accountId}/sync`, {
        method: 'POST',
      });
      
      if (response.ok) {
        alert('Sync initiated successfully');
        loadAccounts();
      }
    } catch (error) {
      alert('Error syncing account');
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Support Email Configuration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect shared support inboxes to automatically create and manage tickets for the entire team
          </p>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note for CS Managers:</strong> Connect your shared support email accounts here (e.g., support@shurehw.com, info@shurehw.com). 
              These will create tickets visible to all customer service team members.
            </p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{errorMessage}</p>
              <button 
                onClick={() => setErrorMessage(null)}
                className="text-xs text-red-600 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-green-800">{successMessage}</p>
              <button 
                onClick={() => setSuccessMessage(null)}
                className="text-xs text-green-600 underline mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Connected Accounts */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Connected Email Accounts</h2>
            <button
              onClick={() => {
                // Show department selector modal or just use default
                handleConnectGmail();
              }}
              disabled={connecting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Connect Gmail Account
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
              <p className="text-gray-500 mt-2">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No email accounts connected</h3>
              <p className="text-gray-500 mb-6">
                Connect a Gmail account to start receiving support tickets via email
              </p>
              <button
                onClick={handleConnectGmail}
                disabled={connecting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Connect Your First Account
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {accounts.map((account) => (
                <div key={account.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                        <Mail className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{account.email}</div>
                        <div className="text-sm text-gray-500">
                          Department: {account.department} • 
                          {account.status === 'connected' ? (
                            <span className="text-green-600 ml-1">Connected</span>
                          ) : (
                            <span className="text-red-600 ml-1">Disconnected</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Auto-create tickets toggle */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">Auto-create tickets</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={account.autoCreateTickets}
                            onChange={(e) => handleToggleAutoCreate(account.id, e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSync(account.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Sync now"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDisconnect(account.id, account.email)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Disconnect"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {account.lastSync && (
                    <div className="mt-2 text-xs text-gray-500">
                      Last synced: {new Date(account.lastSync).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Selection Modal (could be shown before connecting) */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Default Department for New Tickets</h3>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="support">Support</option>
            <option value="sales">Sales</option>
            <option value="billing">Billing</option>
            <option value="technical">Technical</option>
            <option value="general">General</option>
          </select>
          <p className="text-sm text-gray-500 mt-2">
            New tickets from emails will be assigned to this department by default
          </p>
        </div>

        {/* How it works */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">How Gmail Integration Works</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Click "Connect Gmail Account" to authorize access via Google OAuth</li>
            <li>Emails sent to the connected account will be monitored</li>
            <li>New emails can automatically create support tickets when enabled</li>
            <li>Replies to ticket emails will be logged in the ticket history</li>
            <li>No passwords are stored - authentication is handled securely by Google</li>
          </ul>
        </div>

        {/* Google Cloud Setup Required */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-900 mb-2">⚠️ Google OAuth Verification Required</h3>
          
          <div className="mb-4 p-3 bg-white border border-amber-300 rounded">
            <p className="text-sm font-medium text-amber-900 mb-2">Immediate Solution - Add Test Users:</p>
            <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" className="underline">OAuth consent screen</a></li>
              <li>Scroll down to "Test users" section</li>
              <li>Click "+ ADD USERS"</li>
              <li>Add email addresses that need access (e.g., jacob@shurehw.com, support@shurehw.com)</li>
              <li>Save changes</li>
            </ol>
            <p className="text-xs text-amber-700 mt-2">Test users can use the app immediately without verification (up to 100 users)</p>
          </div>

          <div className="mb-4 p-3 bg-white border border-amber-300 rounded">
            <p className="text-sm font-medium text-amber-900 mb-2">For Production Use - Submit for Verification:</p>
            <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials/consent" target="_blank" className="underline">OAuth consent screen</a></li>
              <li>Click "PUBLISH APP" button</li>
              <li>Submit for Google verification (may take 1-2 weeks)</li>
            </ol>
          </div>

          <div className="bg-white border border-amber-300 rounded p-2 mb-3">
            <p className="text-xs text-amber-900 font-medium mb-1">Required Redirect URIs:</p>
            <code className="text-xs text-amber-900 break-all">https://admin.shurehw.com/api/auth/gmail/callback</code><br/>
            <code className="text-xs text-amber-900 break-all">http://localhost:3000/api/auth/gmail/callback</code>
          </div>
          
          <p className="text-xs text-amber-700">
            Client ID: 140253713351-bca1i1ivjr4oj6u74rv1bmfbog2917j6.apps.googleusercontent.com
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}