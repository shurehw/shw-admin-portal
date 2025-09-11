'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, Target, Users, Building2, Bell, Shield, 
  Database, Globe, Mail, Calendar, ChevronRight, Workflow, Star
} from 'lucide-react';

interface SettingCard {
  title: string;
  description: string;
  icon: any;
  href: string;
  color: string;
}

export default function CRMSettingsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('general');

  const settingCategories = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'data', name: 'Data & Fields', icon: Database },
    { id: 'workflow', name: 'Workflow', icon: Workflow },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  const settingCards: Record<string, SettingCard[]> = {
    general: [
      {
        title: 'Customer Rankings',
        description: 'Configure customer tiers and ranking criteria',
        icon: Star,
        href: '/crm/settings/customer-rankings',
        color: 'yellow'
      },
      {
        title: 'Touchpoint Settings',
        description: 'Set up follow-up frequencies and reminder schedules',
        icon: Calendar,
        href: '/crm/settings/touchpoints',
        color: 'indigo'
      },
      {
        title: 'Email Channels',
        description: 'Connect Gmail accounts to sync emails and track communications',
        icon: Mail,
        href: '/crm/settings/email-channels',
        color: 'red'
      },
      {
        title: 'Pipeline Management',
        description: 'Create and manage sales pipelines with custom stages',
        icon: Target,
        href: '/crm/settings/pipelines',
        color: 'blue'
      },
      {
        title: 'Team Settings',
        description: 'Manage CRM users, roles, and permissions',
        icon: Users,
        href: '/crm/settings/team',
        color: 'green'
      },
      {
        title: 'Company Information',
        description: 'Update your company details and branding',
        icon: Building2,
        href: '/crm/settings/company',
        color: 'purple'
      },
      {
        title: 'Regional Settings',
        description: 'Configure timezone, currency, and date formats',
        icon: Globe,
        href: '/crm/settings/regional',
        color: 'orange'
      }
    ],
    data: [
      {
        title: 'Field Definitions',
        description: 'Manage custom fields for contacts and companies',
        icon: Database,
        href: '/crm/settings/fields',
        color: 'indigo'
      },
      {
        title: 'Import & Export',
        description: 'Import data or export your CRM data',
        icon: Database,
        href: '/crm/settings/import-export',
        color: 'pink'
      }
    ],
    workflow: [
      {
        title: 'Email Templates',
        description: 'Create and manage email templates',
        icon: Mail,
        href: '/crm/settings/email-templates',
        color: 'blue'
      },
      {
        title: 'Automation Rules',
        description: 'Set up automated workflows and triggers',
        icon: Workflow,
        href: '/crm/settings/automation',
        color: 'green'
      },
      {
        title: 'Activity Types',
        description: 'Customize activity types and categories',
        icon: Calendar,
        href: '/crm/settings/activity-types',
        color: 'purple'
      }
    ],
    notifications: [
      {
        title: 'Email Notifications',
        description: 'Configure when to receive email alerts',
        icon: Mail,
        href: '/crm/settings/email-notifications',
        color: 'blue'
      },
      {
        title: 'In-App Notifications',
        description: 'Manage in-app notification preferences',
        icon: Bell,
        href: '/crm/settings/app-notifications',
        color: 'green'
      }
    ],
    security: [
      {
        title: 'Access Control',
        description: 'Manage user permissions and access levels',
        icon: Shield,
        href: '/crm/settings/access-control',
        color: 'red'
      },
      {
        title: 'API Keys',
        description: 'Manage API keys for integrations',
        icon: Shield,
        href: '/crm/settings/api-keys',
        color: 'orange'
      }
    ]
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CRM Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure your CRM system settings and preferences
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {category.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {settingCategories.find(c => c.id === selectedCategory)?.name} Settings
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settingCards[selectedCategory]?.map((setting, index) => {
                    const Icon = setting.icon;
                    return (
                      <div
                        key={index}
                        onClick={() => router.push(setting.href)}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <div className="flex items-start">
                          <div className={`p-3 rounded-lg ${getColorClasses(setting.color)}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="ml-4 flex-1">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600">
                              {setting.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {setting.description}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Special callout for Pipeline Management */}
                {selectedCategory === 'general' && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-900">
                          Pipeline Management is Essential
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>
                            Pipelines define how deals move through your sales process. 
                            Configure multiple pipelines for different sales workflows, 
                            customize stages, and set win probabilities.
                          </p>
                          <button
                            onClick={() => router.push('/crm/pipelines')}
                            className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            Go to Pipeline Settings →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}