'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { Play, Settings, Clock, CheckCircle, AlertCircle, Database, Zap } from 'lucide-react';

interface SyncStatus {
  lastSync: string | null;
  totalVenues: number;
  newVenuesThisWeek: number;
  isRunning: boolean;
  autoSyncEnabled: boolean;
}

export default function RARSyncPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [settings, setSettings] = useState({
    daysBack: 7,
    autoSync: false
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    totalVenues: 0,
    newVenuesThisWeek: 0,
    isRunning: false,
    autoSyncEnabled: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/rar/sync');
      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const handleSync = async () => {
    if (!credentials.username || !credentials.password) {
      setMessage('Please enter your RAR credentials');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/rar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...credentials,
          ...settings
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage(`Success! Found ${data.venuesFound} new venues`);
        fetchSyncStatus();
      } else {
        setMessage(data.error || 'Sync failed');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CRMLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Database className="h-6 w-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">RAR Data Sync</h1>
          </div>
          <p className="text-gray-600">
            Sync venue data from Restaurant Activity Report into your CRM
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Sync</p>
                <p className="text-2xl font-bold text-gray-900">
                  {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Venues</p>
                <p className="text-2xl font-bold text-gray-900">{syncStatus.totalVenues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-gray-900">{syncStatus.newVenuesThisWeek}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              {syncStatus.autoSyncEnabled ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <AlertCircle className="h-8 w-8 text-gray-400" />
              )}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto Sync</p>
                <p className="text-2xl font-bold text-gray-900">
                  {syncStatus.autoSyncEnabled ? 'On' : 'Off'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Credentials */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">RAR Credentials</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your RAR username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your RAR password"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Sync Settings</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days to Look Back
                </label>
                <select
                  value={settings.daysBack}
                  onChange={(e) => setSettings({...settings, daysBack: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 day</option>
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSync"
                  checked={settings.autoSync}
                  onChange={(e) => setSettings({...settings, autoSync: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSync" className="ml-2 block text-sm text-gray-700">
                  Enable automatic daily sync
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSync}
            disabled={isLoading || syncStatus.isRunning}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || syncStatus.isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Syncing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Sync
              </>
            )}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-4 rounded-md text-center ${
            message.includes('Success') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How it works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Scrapes new venues and activity from your RAR account</li>
                  <li>Automatically creates opportunities for high-value prospects</li>
                  <li>Syncs liquor license data and venue details</li>
                  <li>Generates alerts for new openings and ownership changes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}