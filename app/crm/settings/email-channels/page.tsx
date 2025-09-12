'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, Plus, Settings, Trash2, CheckCircle, XCircle, 
  RefreshCw, Link2, Unlink, AlertCircle, Loader2, 
  Send, Inbox, Archive, Users, Building2, HelpCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EmailChannel {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'other';
  status: 'connected' | 'disconnected' | 'error';
  connectedTo: string;
  department: 'sales' | 'customer_service' | 'support';
  lastSync?: string;
  syncEnabled: boolean;
  autoCreateTickets: boolean;
  autoLogActivities: boolean;
  userId: string;
  userName: string;
  createdAt: string;
}

export default function EmailChannelsPage() {
  const { user } = useAuth();
  const [channels, setChannels] = useState<EmailChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<EmailChannel | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'manual'>('oauth');

  useEffect(() => {
    loadChannels();
    
    // Check for OAuth callback parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'connected') {
      const email = params.get('email');
      alert(`Successfully connected ${email}!`);
      // Clean up URL
      window.history.replaceState({}, '', '/crm/settings/email-channels');
    } else if (params.get('error')) {
      const errorMessages: Record<string, string> = {
        'oauth_denied': 'Gmail authorization was denied',
        'token_exchange_failed': 'Failed to complete Gmail authentication',
        'user_info_failed': 'Could not retrieve Gmail account information',
        'callback_error': 'An error occurred during authentication',
      };
      const error = params.get('error') || 'unknown';
      alert(errorMessages[error] || 'Failed to connect Gmail account');
      window.history.replaceState({}, '', '/crm/settings/email-channels');
    }
  }, []);

  const loadChannels = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/email-channels');
      const data = await response.json();
      
      // Transform data to match our interface
      const transformedChannels = data.map((channel: any) => ({
        id: channel.id,
        email: channel.email,
        provider: channel.provider,
        status: channel.status,
        connectedTo: channel.connected_to || 'Support Pipeline',
        department: channel.department,
        lastSync: channel.last_sync,
        syncEnabled: channel.sync_enabled,
        autoCreateTickets: channel.auto_create_tickets,
        autoLogActivities: channel.auto_log_activities,
        userId: channel.user_id,
        userName: channel.user_name,
        createdAt: channel.created_at,
      }));
      
      setChannels(transformedChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
      // If API fails, show empty state
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      // Get current user info
      const userId = user?.id || 'unknown';
      const department = 'support'; // Default, could be selected by user
      
      // Redirect to Gmail OAuth flow
      window.location.href = `/api/auth/gmail/connect?userId=${userId}&department=${department}`;
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      alert('Failed to initiate Gmail connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async (channelId: string) => {
    if (!confirm('Are you sure you want to disconnect this email channel?')) return;
    
    try {
      const response = await fetch(`/api/crm/email-channels/${channelId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setChannels(channels.filter(c => c.id !== channelId));
        alert('Channel disconnected successfully');
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting channel:', error);
      alert('Error disconnecting channel');
    }
  };

  const handleSync = async (channelId: string) => {
    try {
      const response = await fetch(`/api/crm/email-channels/${channelId}/sync`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Synced ${result.emails_processed || 0} emails successfully`);
        loadChannels(); // Reload to show updated sync time
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing emails:', error);
      alert('Error syncing emails');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getProviderIcon = (provider: string) => {
    // Gmail logo
    if (provider === 'gmail') {
      return (
        <svg className="w-10 h-10" viewBox="0 0 48 48">
          <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"/>
          <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"/>
          <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
          <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"/>
          <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"/>
        </svg>
      );
    }
    // Default mail icon for other providers
    return (
      <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
        <Mail className="h-6 w-6 text-white" />
      </div>
    );
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Email Channels</h1>
          <p className="text-sm text-gray-500 mt-1">
            Connect email accounts to automatically log communications and create tickets
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button className="py-2 px-1 border-b-2 border-blue-500 text-sm font-medium text-blue-600">
              Channels
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              SLAs
            </button>
            <button className="py-2 px-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Access
            </button>
          </nav>
        </div>

        {/* Channels Section */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Channels</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 flex items-center gap-2"
            >
              Connect a channel
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" />
              <p className="text-gray-500 mt-2">Loading channels...</p>
            </div>
          ) : channels.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No channels connected</h3>
              <p className="text-gray-500 mb-6">
                Connect your email accounts to start logging communications automatically
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Connect your first channel
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Table Header */}
              <div className="px-6 py-3 bg-gray-50 grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div>Name</div>
                <div>Connected To</div>
                <div>Status</div>
                <div></div>
              </div>

              {/* Channel Rows */}
              {channels.map((channel) => (
                <div key={channel.id} className="px-6 py-4 grid grid-cols-4 gap-4 items-center">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(channel.provider)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{channel.email}</div>
                      <div className="text-sm text-gray-500 capitalize">{channel.provider}</div>
                    </div>
                  </div>

                  <div>
                    <a href="#" className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1">
                      {channel.connectedTo}
                      <Link2 className="h-3 w-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusIcon(channel.status)}
                    {channel.status === 'connected' && (
                      <CheckCircle className="h-5 w-5 text-teal-500" />
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleSync(channel.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Sync now"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChannel(channel);
                        setShowSettingsModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDisconnect(channel.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                      title="Disconnect"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <HelpCircle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How email channels work</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Connect your Gmail or Outlook account using secure OAuth</li>
                  <li>Emails are automatically synced and logged to related contacts and deals</li>
                  <li>Incoming emails can create tickets based on your rules</li>
                  <li>Team members can see all communications in one place</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Add Channel Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Connect Email Channel</h2>
              
              {/* Connection Method Tabs */}
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setConnectionMethod('oauth')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    connectionMethod === 'oauth'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  OAuth (Recommended)
                </button>
                <button
                  onClick={() => setConnectionMethod('manual')}
                  className={`flex-1 py-2 px-4 text-sm font-medium ${
                    connectionMethod === 'manual'
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  App Password
                </button>
              </div>

              {connectionMethod === 'oauth' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      OAuth provides secure access without sharing your password. 
                      Your emails will be automatically tracked and logged to contacts.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleConnectGmail}
                    disabled={connecting}
                    className="w-full p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-3"
                  >
                    <svg className="w-10 h-10" viewBox="0 0 48 48">
                      <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"/>
                      <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"/>
                      <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
                      <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"/>
                      <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"/>
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-medium">Connect with Gmail</div>
                      <div className="text-sm text-gray-500">Secure OAuth authentication</div>
                    </div>
                    {connecting && <Loader2 className="h-5 w-5 animate-spin" />}
                  </button>

                  <div className="text-xs text-gray-500">
                    <p className="font-medium mb-1">What happens next:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Emails automatically logged to contacts</li>
                      <li>Track email opens and responses</li>
                      <li>Create deals from email conversations</li>
                      <li>Team visibility on all communications</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Manual setup using app-specific password. Limited tracking capabilities.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email-input"
                      placeholder="your-email@gmail.com"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App Password
                    </label>
                    <input
                      type="password"
                      id="password-input"
                      placeholder="Enter app-specific password"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      For Gmail, use an <a href="https://support.google.com/accounts/answer/185833" target="_blank" className="text-blue-600 hover:underline">app-specific password</a>
                    </p>
                  </div>

                  <button
                    onClick={async () => {
                      const email = (document.getElementById('email-input') as HTMLInputElement)?.value;
                      const password = (document.getElementById('password-input') as HTMLInputElement)?.value;
                      
                      if (!email || !password) {
                        alert('Please enter email and app password');
                        return;
                      }

                      setConnecting(true);
                      try {
                        const response = await fetch('/api/crm/email-channels/simple', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, password, provider: 'gmail' })
                        });

                        if (response.ok) {
                          alert('Email channel connected successfully!');
                          setShowAddModal(false);
                          loadChannels();
                        } else {
                          const error = await response.json();
                          alert(`Failed to connect: ${error.error}`);
                        }
                      } catch (error) {
                        alert('Failed to connect email channel');
                      } finally {
                        setConnecting(false);
                      }
                    }}
                    disabled={connecting}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {connecting ? 'Connecting...' : 'Connect with App Password'}
                  </button>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setConnectionMethod('oauth');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && selectedChannel && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold mb-4">Channel Settings</h2>
              <p className="text-sm text-gray-500 mb-6">{selectedChannel.email}</p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Sync Enabled</div>
                    <div className="text-sm text-gray-500">Automatically sync emails</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={selectedChannel.syncEnabled} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto-create Tickets</div>
                    <div className="text-sm text-gray-500">Create tickets from incoming emails</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={selectedChannel.autoCreateTickets} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Log Activities</div>
                    <div className="text-sm text-gray-500">Log emails as CRM activities</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={selectedChannel.autoLogActivities} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Pipeline
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                    <option>Support Pipeline</option>
                    <option>Sales Pipeline</option>
                    <option>Customer Success Pipeline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Ticket Priority
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('Settings saved');
                    setShowSettingsModal(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}