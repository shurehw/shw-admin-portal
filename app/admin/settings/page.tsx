'use client';

import { useState } from 'react';
import { 
  Settings, Bell, Shield, Mail, Globe, Database, 
  CreditCard, Package, Users, Save, RefreshCw,
  Check, AlertCircle, Lock, Palette, Smartphone
} from 'lucide-react';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: any;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Shure Hospitality Worldwide',
    companyEmail: 'info@shurehw.com',
    companyPhone: '1-800-555-0100',
    companyAddress: '123 Business St, Suite 100',
    companyCity: 'New York',
    companyState: 'NY',
    companyZip: '10001',
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    
    // Notifications
    emailNotifications: true,
    orderNotifications: true,
    quoteNotifications: true,
    customerNotifications: true,
    systemAlerts: true,
    notificationEmail: 'admin@shurehw.com',
    
    // Security
    twoFactorAuth: false,
    sessionTimeout: '30',
    passwordExpiry: '90',
    minPasswordLength: '8',
    requireSpecialChars: true,
    requireNumbers: true,
    
    // Payment Settings
    stripeEnabled: true,
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalEnabled: false,
    paypalClientId: '',
    paypalSecret: '',
    
    // Inventory Settings
    lowStockThreshold: '10',
    autoReorderEnabled: false,
    reorderPoint: '20',
    reorderQuantity: '50'
  });

  const sections: SettingSection[] = [
    { id: 'general', title: 'General', description: 'Basic company information', icon: Settings },
    { id: 'notifications', title: 'Notifications', description: 'Email and alert preferences', icon: Bell },
    { id: 'security', title: 'Security', description: 'Authentication and password policies', icon: Shield },
    { id: 'email', title: 'Email Integration', description: 'OAuth-based email connections', icon: Mail },
    { id: 'payment', title: 'Payment Methods', description: 'Payment gateway configuration', icon: CreditCard },
    { id: 'inventory', title: 'Inventory', description: 'Stock and reorder settings', icon: Package }
  ];

  const handleSave = () => {
    setSaveStatus('saving');
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  const handleInputChange = (field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">Configure your system preferences and options</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          {saveStatus === 'saved' && <Check className="h-4 w-4 mr-2" />}
          {saveStatus === 'idle' && <Save className="h-4 w-4 mr-2" />}
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-md p-4">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-start px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <div>{section.title}</div>
                      <div className="text-xs font-normal text-gray-500 mt-1">
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* General Settings */}
            {activeSection === 'general' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">General Settings</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={settings.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Email
                      </label>
                      <input
                        type="email"
                        value={settings.companyEmail}
                        onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={settings.companyPhone}
                        onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={settings.companyAddress}
                      onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={settings.companyCity}
                        onChange={(e) => handleInputChange('companyCity', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={settings.companyState}
                        onChange={(e) => handleInputChange('companyState', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code
                      </label>
                      <input
                        type="text"
                        value={settings.companyZip}
                        onChange={(e) => handleInputChange('companyZip', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={settings.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        value={settings.dateFormat}
                        onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notification Email Address
                    </label>
                    <input
                      type="email"
                      value={settings.notificationEmail}
                      onChange={(e) => handleInputChange('notificationEmail', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Enable email notifications</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.orderNotifications}
                        onChange={(e) => handleInputChange('orderNotifications', e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">New order notifications</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.quoteNotifications}
                        onChange={(e) => handleInputChange('quoteNotifications', e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">Quote request notifications</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.customerNotifications}
                        onChange={(e) => handleInputChange('customerNotifications', e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">New customer registrations</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.systemAlerts}
                        onChange={(e) => handleInputChange('systemAlerts', e.target.checked)}
                        className="mr-3"
                      />
                      <span className="text-sm text-gray-700">System alerts and warnings</span>
                    </label>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Notification Frequency</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Email notifications are sent immediately when events occur. You can manage individual notification types above.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Security Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.twoFactorAuth}
                        onChange={(e) => handleInputChange('twoFactorAuth', e.target.checked)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Two-Factor Authentication</span>
                        <p className="text-xs text-gray-500">Require 2FA for all admin accounts</p>
                      </div>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password Expiry (days)
                      </label>
                      <input
                        type="number"
                        value={settings.passwordExpiry}
                        onChange={(e) => handleInputChange('passwordExpiry', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Password Requirements</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Password Length
                        </label>
                        <input
                          type="number"
                          value={settings.minPasswordLength}
                          onChange={(e) => handleInputChange('minPasswordLength', e.target.value)}
                          className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.requireSpecialChars}
                          onChange={(e) => handleInputChange('requireSpecialChars', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">Require special characters</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.requireNumbers}
                          onChange={(e) => handleInputChange('requireNumbers', e.target.checked)}
                          className="mr-3"
                        />
                        <span className="text-sm text-gray-700">Require numbers</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex">
                      <Lock className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-900">Security Notice</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Changes to security settings will apply to all new user sessions. Existing sessions will not be affected until users log in again.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeSection === 'email' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Email Configuration</h2>
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-blue-900 mb-2">OAuth-Based Email Integration</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      We now use Google OAuth for secure email integration. No passwords are stored.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {/* Support Email Setup */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Support Email Setup</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Connect Gmail accounts to receive and manage support tickets automatically
                          </p>
                        </div>
                        <a
                          href="/admin/settings/support-email"
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Configure
                        </a>
                      </div>
                    </div>

                    {/* Sales Team Email (CRM) */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Sales Team Email Channels</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Sales team members should connect their Gmail accounts in the CRM
                          </p>
                        </div>
                        <a
                          href="/crm/settings/email-channels"
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Go to CRM
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex">
                      <Mail className="h-5 w-5 text-gray-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">How it works</h4>
                        <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                          <li>Support emails: Admin connects support@shurehw.com for ticket creation</li>
                          <li>Sales emails: Each sales rep connects their own Gmail in CRM</li>
                          <li>All connections use secure Google OAuth - no passwords stored</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeSection === 'payment' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Payment Methods</h2>
                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Stripe</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.stripeEnabled}
                          onChange={(e) => handleInputChange('stripeEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {settings.stripeEnabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Public Key
                          </label>
                          <input
                            type="text"
                            value={settings.stripePublicKey}
                            onChange={(e) => handleInputChange('stripePublicKey', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="pk_test_..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret Key
                          </label>
                          <input
                            type="password"
                            value={settings.stripeSecretKey}
                            onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="sk_test_..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">PayPal</h3>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.paypalEnabled}
                          onChange={(e) => handleInputChange('paypalEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    {settings.paypalEnabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Client ID
                          </label>
                          <input
                            type="text"
                            value={settings.paypalClientId}
                            onChange={(e) => handleInputChange('paypalClientId', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Secret
                          </label>
                          <input
                            type="password"
                            value={settings.paypalSecret}
                            onChange={(e) => handleInputChange('paypalSecret', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Settings */}
            {activeSection === 'inventory' && (
              <div>
                <h2 className="text-xl font-semibold mb-6">Inventory Settings</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Alert Threshold
                    </label>
                    <input
                      type="number"
                      value={settings.lowStockThreshold}
                      onChange={(e) => handleInputChange('lowStockThreshold', e.target.value)}
                      className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Alert when stock falls below this quantity
                    </p>
                  </div>
                  
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.autoReorderEnabled}
                        onChange={(e) => handleInputChange('autoReorderEnabled', e.target.checked)}
                        className="mr-3"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">Enable Auto-Reorder</span>
                        <p className="text-xs text-gray-500">Automatically create purchase orders when stock is low</p>
                      </div>
                    </label>
                  </div>
                  
                  {settings.autoReorderEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reorder Point
                        </label>
                        <input
                          type="number"
                          value={settings.reorderPoint}
                          onChange={(e) => handleInputChange('reorderPoint', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Trigger reorder when stock reaches this level
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Reorder Quantity
                        </label>
                        <input
                          type="number"
                          value={settings.reorderQuantity}
                          onChange={(e) => handleInputChange('reorderQuantity', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Default quantity to order
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}