'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import { 
  Mail, Plus, Check, X, AlertCircle, Settings, 
  RefreshCw, Trash2, Power, Clock, Send, Calendar,
  Eye, Link2, ArrowLeft, Shield, CheckCircle, CalendarCheck
} from 'lucide-react';
import Image from 'next/image';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  addDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where
} from 'firebase/firestore';

interface EmailAccount {
  id: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'other';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: Date;
  syncEnabled: boolean;
  trackingEnabled: boolean;
  calendarEnabled: boolean;
  calendarSyncEnabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  createdAt: Date;
}

export default function EmailIntegrationPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<'gmail' | 'outlook' | null>(null);
  const [syncStatus, setSyncStatus] = useState<Record<string, 'syncing' | 'idle'>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadEmailAccounts();
    
    // Check for OAuth callback status
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      setNotification({ type: 'success', message: 'Email account connected successfully!' });
      // Clean URL
      window.history.replaceState({}, '', '/crm/settings/email-integration');
    } else if (urlParams.get('error')) {
      const error = urlParams.get('error');
      const errorMessages: Record<string, string> = {
        'access_denied': 'Access was denied. Please try again.',
        'no_code': 'Authorization failed. Please try again.',
        'oauth_failed': 'Failed to connect account. Please try again.'
      };
      setNotification({ 
        type: 'error', 
        message: errorMessages[error as string] || 'An error occurred. Please try again.' 
      });
      window.history.replaceState({}, '', '/crm/settings/email-integration');
    }
  }, []);

  const loadEmailAccounts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'emailAccounts'));
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastSync: doc.data().lastSync?.toDate(),
        createdAt: doc.data().createdAt?.toDate()
      })) as EmailAccount[];
      setAccounts(accountsData);
    } catch (error) {
      console.error('Error loading email accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectGmail = async () => {
    setConnectingProvider('gmail');
    
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      alert('Google OAuth is not configured. Please set up your Google Cloud Project first.');
      setConnectingProvider(null);
      return;
    }
    
    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const scope = [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    // Redirect to Google OAuth
    window.location.href = authUrl;
  };

  const toggleSync = async (accountId: string, enabled: boolean) => {
    try {
      await updateDoc(doc(db, 'emailAccounts', accountId), {
        syncEnabled: enabled,
        updatedAt: Timestamp.now()
      });
      
      setAccounts(accounts.map(acc => 
        acc.id === accountId ? { ...acc, syncEnabled: enabled } : acc
      ));
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  };

  const toggleTracking = async (accountId: string, enabled: boolean) => {
    try {
      await updateDoc(doc(db, 'emailAccounts', accountId), {
        trackingEnabled: enabled,
        updatedAt: Timestamp.now()
      });
      
      setAccounts(accounts.map(acc => 
        acc.id === accountId ? { ...acc, trackingEnabled: enabled } : acc
      ));
    } catch (error) {
      console.error('Error updating tracking status:', error);
    }
  };

  const toggleCalendarSync = async (accountId: string, enabled: boolean) => {
    try {
      await updateDoc(doc(db, 'emailAccounts', accountId), {
        calendarSyncEnabled: enabled,
        updatedAt: Timestamp.now()
      });
      
      setAccounts(accounts.map(acc => 
        acc.id === accountId ? { ...acc, calendarSyncEnabled: enabled } : acc
      ));
    } catch (error) {
      console.error('Error updating calendar sync status:', error);
    }
  };

  const syncAccount = async (accountId: string) => {
    setSyncStatus({ ...syncStatus, [accountId]: 'syncing' });
    
    // Simulate sync process
    setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'emailAccounts', accountId), {
          lastSync: Timestamp.now()
        });
        
        setAccounts(accounts.map(acc => 
          acc.id === accountId ? { ...acc, lastSync: new Date() } : acc
        ));
        
        setSyncStatus({ ...syncStatus, [accountId]: 'idle' });
      } catch (error) {
        console.error('Error syncing account:', error);
        setSyncStatus({ ...syncStatus, [accountId]: 'idle' });
      }
    }, 2000);
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) return;
    
    try {
      await deleteDoc(doc(db, 'emailAccounts', accountId));
      setAccounts(accounts.filter(acc => acc.id !== accountId));
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  const formatLastSync = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Notification */}
        {notification && (
          <div className={`mb-4 p-4 rounded-lg flex items-center justify-between ${
            notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {notification.message}
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/crm/settings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email & Calendar Integration</h1>
              <p className="text-gray-600 mt-1">
                Connect Gmail to log emails, track opens, sync calendar events, and manage all communications in the CRM
              </p>
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Email Account
            </button>
          </div>
        </div>

        {/* Connected Accounts */}
        {accounts.length > 0 ? (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="p-3 bg-gray-100 rounded-lg mr-4">
                      {account.provider === 'gmail' ? (
                        <svg className="h-6 w-6" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                        </svg>
                      ) : (
                        <Mail className="h-6 w-6 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{account.email}</h3>
                      <div className="flex items-center mt-1">
                        <div className={`flex items-center text-sm ${
                          account.status === 'connected' ? 'text-green-600' : 
                          account.status === 'error' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {account.status === 'connected' ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : account.status === 'error' ? (
                            <AlertCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <X className="h-4 w-4 mr-1" />
                          )}
                          {account.status === 'connected' ? 'Connected' : 
                           account.status === 'error' ? 'Connection Error' : 'Disconnected'}
                        </div>
                        <span className="text-gray-400 mx-2">•</span>
                        <span className="text-sm text-gray-500">
                          Last synced: {formatLastSync(account.lastSync)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => syncAccount(account.id)}
                      disabled={syncStatus[account.id] === 'syncing'}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      title="Sync now"
                    >
                      <RefreshCw className={`h-4 w-4 ${
                        syncStatus[account.id] === 'syncing' ? 'animate-spin' : ''
                      }`} />
                    </button>
                    <button
                      onClick={() => router.push(`/crm/settings/email-integration/${account.id}`)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => disconnectAccount(account.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Disconnect"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Features */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Email Sync</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={account.syncEnabled}
                        onChange={(e) => toggleSync(account.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Eye className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Email Tracking</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={account.trackingEnabled}
                        onChange={(e) => toggleTracking(account.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Calendar Sync</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={account.calendarSyncEnabled}
                        onChange={(e) => toggleCalendarSync(account.id, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Send className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">Send from CRM</span>
                    </div>
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Emails Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Sent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">Received</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">0%</div>
                    <div className="text-xs text-gray-500">Open Rate</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No email accounts connected</h3>
            <p className="text-gray-500 mb-4">
              Connect your email to start logging and tracking emails in the CRM
            </p>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First Email
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Integration Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Logging</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Automatically log all emails with contacts and deals
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Tracking</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Know when your emails are opened and links are clicked
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Send from CRM</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Send emails directly from contact and deal records
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email Templates</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Use templates to save time on common emails
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 bg-pink-100 rounded-lg mr-3">
                <Link2 className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Auto-Association</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Emails automatically linked to the right contacts
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Secure OAuth</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Industry-standard OAuth 2.0 authentication
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Calendar Sync</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Sync Google Calendar events with CRM activities
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-2 bg-cyan-100 rounded-lg mr-3">
                <CalendarCheck className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Meeting Scheduler</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Schedule meetings directly from deals and contacts
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="p-2 bg-red-100 rounded-lg mr-3">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Activity Auto-Log</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Calendar events automatically create CRM activities
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Connect Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">Connect Email Account</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose your email provider to get started
                </p>
              </div>
              
              <div className="p-6 space-y-3">
                <button
                  onClick={connectGmail}
                  disabled={connectingProvider === 'gmail'}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <div className="flex items-center">
                    <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                    <span className="font-medium">Gmail</span>
                  </div>
                  {connectingProvider === 'gmail' ? (
                    <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                  ) : (
                    <Plus className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                <button
                  disabled
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <svg className="h-6 w-6 mr-3" viewBox="0 0 24 24">
                      <path fill="#0078D4" d="M21.86 12.48L24 10.35v7.31l-2.14-2.14v-3.04zm0-5.19l2.14-2.13v7.19l-2.14-2.14V7.29zM1.85 5.17L0 7.31v7.03l1.85-1.84V5.17zm0 10.35L0 17.66v-7.31l1.85 1.85v3.32zM12 4.71l6.5 6.48v7.64L12 12.35l-6.5 6.48V11.19L12 4.71z"/>
                    </svg>
                    <span className="font-medium">Outlook</span>
                  </div>
                  <span className="text-xs text-gray-500">Coming Soon</span>
                </button>
                
                <button
                  disabled
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                >
                  <div className="flex items-center">
                    <Mail className="h-6 w-6 mr-3 text-gray-600" />
                    <span className="font-medium">Other Provider</span>
                  </div>
                  <span className="text-xs text-gray-500">Coming Soon</span>
                </button>
              </div>
              
              <div className="p-6 border-t flex justify-end">
                <button
                  onClick={() => {
                    setShowConnectModal(false);
                    setConnectingProvider(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}