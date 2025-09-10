'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Mail, Save, TestTube, Shield, Loader2, Check, X, Info, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function EmailSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [emailConfig, setEmailConfig] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_user: '',
    smtp_pass: '',
    smtp_secure: false,
    from_name: '',
    from_address: '',
    reply_to: '',
    use_for_tickets: true,
    use_for_notifications: true,
  });

  useEffect(() => {
    loadEmailSettings();
  }, []);

  const loadEmailSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/email');
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setEmailConfig(data);
        }
      }
    } catch (error) {
      console.error('Error loading email settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/settings/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailConfig),
      });

      if (response.ok) {
        setTestResult({ success: true, message: 'Email settings saved successfully!' });
      } else {
        const error = await response.json();
        setTestResult({ success: false, message: error.message || 'Failed to save settings' });
      }
    } catch (error) {
      setTestResult({ success: false, message: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/settings/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailConfig,
          test_email: user?.email,
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setTestResult({ 
          success: true, 
          message: `Test email sent successfully to ${user?.email}! Check your inbox.` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: result.error || 'Failed to send test email. Check your configuration.' 
        });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Error testing email configuration' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEmailConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Configuration
          </h1>
          <p className="text-gray-600 mt-2">
            Configure your email settings for sending tickets, notifications, and system emails.
          </p>
        </div>

        {/* Quick Setup Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Gmail Setup Instructions:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Enable 2-Factor Authentication in your Google Account</li>
                <li>Generate an App Password (not your regular password)</li>
                <li>Use smtp.gmail.com as host, port 587</li>
                <li>Enter your Gmail address and the 16-character app password</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 space-y-6">
            {/* SMTP Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                SMTP Server Settings
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={emailConfig.smtp_host}
                    onChange={(e) => handleInputChange('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port
                  </label>
                  <select
                    value={emailConfig.smtp_port}
                    onChange={(e) => handleInputChange('smtp_port', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="25">25 (No encryption)</option>
                    <option value="587">587 (TLS/STARTTLS)</option>
                    <option value="465">465 (SSL)</option>
                    <option value="2525">2525 (Alternative)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={emailConfig.smtp_user}
                    onChange={(e) => handleInputChange('smtp_user', e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Password / App Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={emailConfig.smtp_pass}
                      onChange={(e) => handleInputChange('smtp_pass', e.target.value)}
                      placeholder="••••••••••••••••"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    For Gmail, use an App Password, not your regular password
                  </p>
                </div>
              </div>
            </div>

            {/* Sender Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Sender Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={emailConfig.from_name}
                    onChange={(e) => handleInputChange('from_name', e.target.value)}
                    placeholder="SHW Support"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email Address
                  </label>
                  <input
                    type="email"
                    value={emailConfig.from_address}
                    onChange={(e) => handleInputChange('from_address', e.target.value)}
                    placeholder="support@shurehw.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reply-To Address (optional)
                  </label>
                  <input
                    type="email"
                    value={emailConfig.reply_to}
                    onChange={(e) => handleInputChange('reply_to', e.target.value)}
                    placeholder="replies@shurehw.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Usage Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Usage Settings</h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={emailConfig.use_for_tickets}
                    onChange={(e) => handleInputChange('use_for_tickets', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Use for ticket responses and customer communication
                  </span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={emailConfig.use_for_notifications}
                    onChange={(e) => handleInputChange('use_for_notifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Use for system notifications and alerts
                  </span>
                </label>
              </div>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-4 rounded-lg flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {testResult.success ? (
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <X className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                <p className={`text-sm ${
                  testResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {testResult.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={handleTest}
                disabled={testing || !emailConfig.smtp_host || !emailConfig.smtp_user}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4" />
                    Test Configuration
                  </>
                )}
              </button>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Common Email Providers:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p className="font-medium text-gray-700">Gmail:</p>
              <p>Host: smtp.gmail.com, Port: 587</p>
              <p>Requires App Password with 2FA</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Office 365:</p>
              <p>Host: smtp.office365.com, Port: 587</p>
              <p>Use your full email as username</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">SendGrid:</p>
              <p>Host: smtp.sendgrid.net, Port: 587</p>
              <p>Username: apikey, Password: Your API Key</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Mailgun:</p>
              <p>Host: smtp.mailgun.org, Port: 587</p>
              <p>Use SMTP credentials from dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}