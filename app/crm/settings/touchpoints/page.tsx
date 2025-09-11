'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building, Mail, Phone, MessageSquare, Save, ArrowLeft,
  Clock, Bell, Calendar, Settings
} from 'lucide-react';

interface TouchpointSettings {
  type: 'visit' | 'email' | 'phone' | 'message';
  enabled: boolean;
  defaultFrequencyDays: number;
  reminderDaysBefore: number;
  escalateAfterDays: number;
}

export default function TouchpointSettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [touchpointSettings, setTouchpointSettings] = useState<TouchpointSettings[]>([
    {
      type: 'visit',
      enabled: true,
      defaultFrequencyDays: 30,
      reminderDaysBefore: 7,
      escalateAfterDays: 14
    },
    {
      type: 'email',
      enabled: true,
      defaultFrequencyDays: 14,
      reminderDaysBefore: 3,
      escalateAfterDays: 7
    },
    {
      type: 'phone',
      enabled: true,
      defaultFrequencyDays: 21,
      reminderDaysBefore: 5,
      escalateAfterDays: 10
    },
    {
      type: 'message',
      enabled: false,
      defaultFrequencyDays: 7,
      reminderDaysBefore: 2,
      escalateAfterDays: 3
    }
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return Building;
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
      case 'message':
        return MessageSquare;
      default:
        return Settings;
    }
  };

  const getDescription = (type: string) => {
    switch (type) {
      case 'visit':
        return 'Configure in-person visit reminders and follow-up schedules';
      case 'email':
        return 'Set up automated email touchpoint reminders';
      case 'phone':
        return 'Manage phone call reminder frequencies';
      case 'message':
        return 'Control SMS and messaging touchpoint settings';
      default:
        return '';
    }
  };

  return (
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/crm/settings')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Touchpoint Settings</h1>
              <p className="text-gray-600 mt-1">
                Configure follow-up reminders and touchpoint frequencies for customer engagement
              </p>
            </div>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            Settings saved successfully!
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <Bell className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">About Touchpoint Settings</p>
              <p>
                These settings define default reminder frequencies for customer follow-ups. 
                Individual customer rankings can override these defaults with specific frequencies.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Cards */}
        <div className="space-y-4">
          {touchpointSettings.map((setting) => {
            const Icon = getIcon(setting.type);
            return (
              <div key={setting.type} className="bg-white border rounded-lg shadow-sm">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-6 w-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">
                          {setting.type} Reminders
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getDescription(setting.type)}
                        </p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={setting.enabled}
                        onChange={(e) => {
                          const updated = [...touchpointSettings];
                          const idx = updated.findIndex(s => s.type === setting.type);
                          updated[idx].enabled = e.target.checked;
                          setTouchpointSettings(updated);
                        }}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {setting.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </label>
                  </div>
                  
                  {setting.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          Default Frequency
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={setting.defaultFrequencyDays}
                            onChange={(e) => {
                              const updated = [...touchpointSettings];
                              const idx = updated.findIndex(s => s.type === setting.type);
                              updated[idx].defaultFrequencyDays = parseInt(e.target.value) || 0;
                              setTouchpointSettings(updated);
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 pr-12"
                          />
                          <span className="absolute right-3 top-2.5 text-sm text-gray-500">days</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          How often to follow up
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <Clock className="h-4 w-4 mr-2 text-gray-500" />
                          Reminder Before Due
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={setting.reminderDaysBefore}
                            onChange={(e) => {
                              const updated = [...touchpointSettings];
                              const idx = updated.findIndex(s => s.type === setting.type);
                              updated[idx].reminderDaysBefore = parseInt(e.target.value) || 0;
                              setTouchpointSettings(updated);
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 pr-12"
                          />
                          <span className="absolute right-3 top-2.5 text-sm text-gray-500">days</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          When to send reminder
                        </p>
                      </div>
                      
                      <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <Bell className="h-4 w-4 mr-2 text-gray-500" />
                          Escalate After
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={setting.escalateAfterDays}
                            onChange={(e) => {
                              const updated = [...touchpointSettings];
                              const idx = updated.findIndex(s => s.type === setting.type);
                              updated[idx].escalateAfterDays = parseInt(e.target.value) || 0;
                              setTouchpointSettings(updated);
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 pr-12"
                          />
                          <span className="absolute right-3 top-2.5 text-sm text-gray-500">days</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Escalate if overdue
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Settings */}
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Global Reminder Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" defaultChecked />
              <span className="text-sm text-gray-700">Send reminder emails to sales representatives</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" defaultChecked />
              <span className="text-sm text-gray-700">Show overdue touchpoints in dashboard</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-3" />
              <span className="text-sm text-gray-700">Automatically escalate overdue items to sales manager</span>
            </label>
          </div>
        </div>
      </div>
  );
}