'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Save, Bell, Clock, Mail, Users, AlertCircle, 
  CheckCircle, FileText, Zap, Shield, Plus, X, Edit2, Trash2, Settings 
} from 'lucide-react';

interface SLAPlan {
  id: string;
  name: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  isDefault: boolean;
}

interface Macro {
  id: string;
  name: string;
  category: string;
  body: string;
  isInternal: boolean;
}

export default function TicketSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'sla' | 'macros' | 'automation' | 'permissions'>('general');
  const [settings, setSettings] = useState({
    autoAssign: true,
    autoAcknowledge: false,
    requireCategory: true,
    allowAnonymous: false,
    defaultPriority: 'normal',
    businessHoursOnly: true,
    emailNotifications: true,
    slackIntegration: false,
    webhookUrl: '',
    businessHours: {
      start: '09:00',
      end: '17:00',
      timezone: 'America/New_York',
      weekends: false
    }
  });

  const [slaPlans, setSlaPlans] = useState<SLAPlan[]>([
    { id: '1', name: 'Standard', firstResponseMinutes: 120, resolutionMinutes: 1440, isDefault: true },
    { id: '2', name: 'Priority', firstResponseMinutes: 30, resolutionMinutes: 240, isDefault: false },
    { id: '3', name: 'VIP', firstResponseMinutes: 15, resolutionMinutes: 120, isDefault: false }
  ]);

  const [macros, setMacros] = useState<Macro[]>([
    { id: '1', name: 'Greeting', category: 'general', body: 'Thank you for reaching out...', isInternal: false },
    { id: '2', name: 'Damage Intake', category: 'damage', body: 'To process your damage claim...', isInternal: false },
    { id: '3', name: 'Internal Escalation', category: 'internal', body: 'Escalating to management...', isInternal: true }
  ]);

  const [showNewSLA, setShowNewSLA] = useState(false);
  const [showNewMacro, setShowNewMacro] = useState(false);

  const handleSave = () => {
    // Save settings to API
    alert('Settings saved successfully!');
  };

  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ticket System Settings</h1>
          <p className="text-gray-600">Configure your support ticket system preferences</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'sla', label: 'SLA Plans', icon: Clock },
              { id: 'macros', label: 'Macros', icon: FileText },
              { id: 'automation', label: 'Automation', icon: Zap },
              { id: 'permissions', label: 'Permissions', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Auto-assign tickets</label>
                    <p className="text-sm text-gray-500">Automatically assign new tickets to available agents</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoAssign}
                    onChange={(e) => setSettings({...settings, autoAssign: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Auto-acknowledge</label>
                    <p className="text-sm text-gray-500">Send automatic acknowledgment on ticket creation</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoAcknowledge}
                    onChange={(e) => setSettings({...settings, autoAcknowledge: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Require category</label>
                    <p className="text-sm text-gray-500">Tickets must have a category selected</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.requireCategory}
                    onChange={(e) => setSettings({...settings, requireCategory: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">Default Priority</label>
                  <select
                    value={settings.defaultPriority}
                    onChange={(e) => setSettings({...settings, defaultPriority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={settings.businessHours.start}
                    onChange={(e) => setSettings({
                      ...settings,
                      businessHours: {...settings.businessHours, start: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    type="time"
                    value={settings.businessHours.end}
                    onChange={(e) => setSettings({
                      ...settings,
                      businessHours: {...settings.businessHours, end: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.businessHours.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    businessHours: {...settings.businessHours, timezone: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Email notifications</label>
                    <p className="text-sm text-gray-500">Send email updates for ticket changes</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-gray-700">Slack integration</label>
                    <p className="text-sm text-gray-500">Send notifications to Slack channels</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.slackIntegration}
                    onChange={(e) => setSettings({...settings, slackIntegration: e.target.checked})}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLA Plans */}
        {activeTab === 'sla' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">SLA Plans</h3>
              <button
                onClick={() => setShowNewSLA(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add SLA Plan
              </button>
            </div>

            <div className="space-y-4">
              {slaPlans.map(plan => (
                <div key={plan.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{plan.name}</h4>
                      <div className="mt-1 text-sm text-gray-500">
                        First response: {formatMinutes(plan.firstResponseMinutes)} • 
                        Resolution: {formatMinutes(plan.resolutionMinutes)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {plan.isDefault && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Default</span>
                      )}
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      {!plan.isDefault && (
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Macros */}
        {activeTab === 'macros' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Canned Responses</h3>
              <button
                onClick={() => setShowNewMacro(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Macro
              </button>
            </div>

            <div className="space-y-4">
              {macros.map(macro => (
                <div key={macro.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{macro.name}</h4>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {macro.category}
                        </span>
                        {macro.isInternal && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{macro.body}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Automation */}
        {activeTab === 'automation' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Automation Rules</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Auto-Assignment Rules</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Round-robin assignment</p>
                      <p className="text-xs text-gray-500">Distribute tickets evenly among agents</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Skill-based routing</p>
                      <p className="text-xs text-gray-500">Assign based on agent expertise</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Escalation Rules</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Auto-escalate overdue tickets</p>
                      <p className="text-xs text-gray-500">Escalate to supervisor after SLA breach</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                  </div>
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">VIP customer priority</p>
                      <p className="text-xs text-gray-500">Auto-assign P1 priority for VIP customers</p>
                    </div>
                    <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Permissions */}
        {activeTab === 'permissions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Role Permissions</h3>
            
            <div className="space-y-4">
              {['Admin', 'Supervisor', 'Agent', 'Customer Service'].map(role => (
                <div key={role} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{role}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2 h-4 w-4 text-blue-600 rounded" defaultChecked />
                      View all tickets
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2 h-4 w-4 text-blue-600 rounded" defaultChecked={role === 'Admin'} />
                      Delete tickets
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2 h-4 w-4 text-blue-600 rounded" defaultChecked />
                      Add internal notes
                    </label>
                    <label className="flex items-center text-sm">
                      <input type="checkbox" className="mr-2 h-4 w-4 text-blue-600 rounded" defaultChecked={role !== 'Customer Service'} />
                      Change priority
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}