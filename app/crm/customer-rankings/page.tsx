'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { 
  Star, Users, Calendar, Mail, Phone, MessageSquare, 
  Building, TrendingUp, DollarSign, Clock, Bell,
  Settings, Save, Plus, Trash2, Edit2, Check, X
} from 'lucide-react';

interface CustomerRank {
  id: string;
  name: string;
  color: string;
  icon: string;
  visitFrequencyDays: number;
  emailFrequencyDays: number;
  phoneFrequencyDays: number;
  minOrderValue: number;
  minOrdersPerYear: number;
  description: string;
}

interface Customer {
  id: string;
  name: string;
  company: string;
  rankId: string;
  lastVisit?: string;
  lastEmail?: string;
  lastPhone?: string;
  totalOrders: number;
  totalRevenue: number;
  assignedTo: string;
}

interface TouchpointSettings {
  type: 'visit' | 'email' | 'phone' | 'message';
  enabled: boolean;
  defaultFrequencyDays: number;
  reminderDaysBefore: number;
  escalateAfterDays: number;
}

export default function CustomerRankingsPage() {
  const [activeTab, setActiveTab] = useState<'rankings' | 'customers' | 'settings'>('rankings');
  const [ranks, setRanks] = useState<CustomerRank[]>([
    {
      id: '5',
      name: '5 Stars - VIP',
      color: 'bg-yellow-500',
      icon: 'star',
      visitFrequencyDays: 30,
      emailFrequencyDays: 7,
      phoneFrequencyDays: 14,
      minOrderValue: 50000,
      minOrdersPerYear: 12,
      description: 'Top priority customers - white glove service'
    },
    {
      id: '4', 
      name: '4 Stars - Premium',
      color: 'bg-blue-500',
      icon: 'star',
      visitFrequencyDays: 45,
      emailFrequencyDays: 14,
      phoneFrequencyDays: 21,
      minOrderValue: 25000,
      minOrdersPerYear: 8,
      description: 'High-value customers requiring regular attention'
    },
    {
      id: '3',
      name: '3 Stars - Standard',
      color: 'bg-green-500',
      icon: 'star',
      visitFrequencyDays: 60,
      emailFrequencyDays: 21,
      phoneFrequencyDays: 30,
      minOrderValue: 10000,
      minOrdersPerYear: 6,
      description: 'Core customers with steady business'
    },
    {
      id: '2',
      name: '2 Stars - Growth',
      color: 'bg-gray-400',
      icon: 'star',
      visitFrequencyDays: 90,
      emailFrequencyDays: 30,
      phoneFrequencyDays: 45,
      minOrderValue: 5000,
      minOrdersPerYear: 4,
      description: 'Developing accounts with potential'
    },
    {
      id: '1',
      name: '1 Star - Prospect',
      color: 'bg-gray-300',
      icon: 'star',
      visitFrequencyDays: 120,
      emailFrequencyDays: 45,
      phoneFrequencyDays: 60,
      minOrderValue: 1000,
      minOrdersPerYear: 2,
      description: 'New or low-volume customers'
    }
  ]);

  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'John Doe',
      company: 'ABC Hotel Group',
      rankId: '5',
      lastVisit: '2024-01-15',
      lastEmail: '2024-02-01',
      lastPhone: '2024-01-28',
      totalOrders: 24,
      totalRevenue: 125000,
      assignedTo: 'Sarah Smith'
    },
    {
      id: '2',
      name: 'Jane Smith',
      company: 'XYZ Resorts',
      rankId: '4',
      lastVisit: '2024-01-20',
      lastEmail: '2024-02-05',
      lastPhone: '2024-02-01',
      totalOrders: 15,
      totalRevenue: 75000,
      assignedTo: 'Mike Johnson'
    },
    {
      id: '3',
      name: 'Bob Wilson',
      company: 'City Center Hotels',
      rankId: '3',
      lastVisit: '2024-01-25',
      lastEmail: '2024-02-03',
      lastPhone: '2024-01-30',
      totalOrders: 10,
      totalRevenue: 35000,
      assignedTo: 'Sarah Smith'
    },
    {
      id: '4',
      name: 'Alice Brown',
      company: 'Boutique Stays',
      rankId: '2',
      lastVisit: '2024-01-10',
      lastEmail: '2024-01-20',
      lastPhone: '2024-01-15',
      totalOrders: 5,
      totalRevenue: 12000,
      assignedTo: 'Mike Johnson'
    }
  ]);

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
      escalateAfterDays: 5
    }
  ]);

  const [editingRank, setEditingRank] = useState<string | null>(null);
  const [newRank, setNewRank] = useState<Partial<CustomerRank>>({});
  const [showAddRankModal, setShowAddRankModal] = useState(false);
  const [editRankData, setEditRankData] = useState<CustomerRank | null>(null);

  const getOverdueCustomers = () => {
    const now = new Date();
    return customers.filter(customer => {
      const rank = ranks.find(r => r.id === customer.rankId);
      if (!rank) return false;

      if (customer.lastVisit) {
        const lastVisitDate = new Date(customer.lastVisit);
        const daysSinceVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceVisit > rank.visitFrequencyDays) return true;
      }

      if (customer.lastEmail) {
        const lastEmailDate = new Date(customer.lastEmail);
        const daysSinceEmail = Math.floor((now.getTime() - lastEmailDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceEmail > rank.emailFrequencyDays) return true;
      }

      return false;
    });
  };

  const getUpcomingReminders = () => {
    const now = new Date();
    const reminders: any[] = [];

    customers.forEach(customer => {
      const rank = ranks.find(r => r.id === customer.rankId);
      if (!rank) return;

      // Check visit reminders
      if (customer.lastVisit) {
        const lastVisitDate = new Date(customer.lastVisit);
        const nextVisitDate = new Date(lastVisitDate.getTime() + rank.visitFrequencyDays * 24 * 60 * 60 * 1000);
        const reminderDate = new Date(nextVisitDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
        
        if (reminderDate <= now && nextVisitDate > now) {
          reminders.push({
            customer,
            type: 'visit',
            dueDate: nextVisitDate,
            daysUntilDue: Math.ceil((nextVisitDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }

      // Check email reminders
      if (customer.lastEmail) {
        const lastEmailDate = new Date(customer.lastEmail);
        const nextEmailDate = new Date(lastEmailDate.getTime() + rank.emailFrequencyDays * 24 * 60 * 60 * 1000);
        const reminderDate = new Date(nextEmailDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before
        
        if (reminderDate <= now && nextEmailDate > now) {
          reminders.push({
            customer,
            type: 'email',
            dueDate: nextEmailDate,
            daysUntilDue: Math.ceil((nextEmailDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  };

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Customer Rankings & Follow-up</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage customer tiers and automated follow-up reminders
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-semibold">{customers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Overdue Follow-ups</p>
                <p className="text-2xl font-semibold text-red-600">{getOverdueCustomers().length}</p>
              </div>
              <Bell className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-semibold text-yellow-600">{getUpcomingReminders().filter(r => r.daysUntilDue <= 7).length}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ranking Tiers</p>
                <p className="text-2xl font-semibold">{ranks.length}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('rankings')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'rankings'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Star className="h-4 w-4 inline mr-2" />
                Customer Rankings
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'customers'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Customer List
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                Touchpoint Settings
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Rankings Tab */}
            {activeTab === 'rankings' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Customer Ranking Tiers</h2>
                  <button 
                    onClick={() => {
                      setEditRankData({
                        id: String(ranks.length + 1),
                        name: '',
                        color: 'bg-gray-400',
                        icon: 'star',
                        visitFrequencyDays: 30,
                        emailFrequencyDays: 14,
                        phoneFrequencyDays: 21,
                        minOrderValue: 0,
                        minOrdersPerYear: 0,
                        description: ''
                      });
                      setShowAddRankModal(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Tier
                  </button>
                </div>

                <div className="space-y-4">
                  {ranks.map((rank) => (
                    <div key={rank.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-1">
                            {[...Array(parseInt(rank.id))].map((_, i) => (
                              <Star key={i} className={`h-6 w-6 ${rank.color.replace('bg-', 'text-')} fill-current`} />
                            ))}
                            {[...Array(5 - parseInt(rank.id))].map((_, i) => (
                              <Star key={i + parseInt(rank.id)} className="h-6 w-6 text-gray-300" />
                            ))}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{rank.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{rank.description}</p>
                            
                            <div className="grid grid-cols-3 gap-4 mt-3">
                              <div className="text-sm">
                                <span className="text-gray-500">Visit every:</span>
                                <span className="ml-2 font-medium">{rank.visitFrequencyDays} days</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Email every:</span>
                                <span className="ml-2 font-medium">{rank.emailFrequencyDays} days</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Call every:</span>
                                <span className="ml-2 font-medium">{rank.phoneFrequencyDays} days</span>
                              </div>
                            </div>
                            
                            <div className="flex gap-4 mt-2">
                              <div className="text-sm">
                                <span className="text-gray-500">Min. order value:</span>
                                <span className="ml-2 font-medium">${rank.minOrderValue.toLocaleString()}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-500">Min. orders/year:</span>
                                <span className="ml-2 font-medium">{rank.minOrdersPerYear}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditRankData(rank);
                              setShowAddRankModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete the "${rank.name}" tier?`)) {
                                setRanks(ranks.filter(r => r.id !== rank.id));
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customers Tab */}
            {activeTab === 'customers' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium">Customer Follow-up Status</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Export Reminders
                  </button>
                </div>

                {/* Upcoming Reminders */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-3">Upcoming Reminders</h3>
                  <div className="space-y-2">
                    {getUpcomingReminders().slice(0, 5).map((reminder, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-3">
                          {reminder.type === 'visit' && <Building className="h-5 w-5 text-yellow-600" />}
                          {reminder.type === 'email' && <Mail className="h-5 w-5 text-yellow-600" />}
                          {reminder.type === 'phone' && <Phone className="h-5 w-5 text-yellow-600" />}
                          
                          <div>
                            <p className="font-medium text-gray-900">
                              {reminder.customer.name} - {reminder.customer.company}
                            </p>
                            <p className="text-sm text-gray-500">
                              {reminder.type === 'visit' && 'Schedule visit'}
                              {reminder.type === 'email' && 'Send follow-up email'}
                              {reminder.type === 'phone' && 'Make follow-up call'}
                              {' - Due in '}{reminder.daysUntilDue} days
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                            Mark Done
                          </button>
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                            Snooze
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {customers.map((customer) => {
                        const rank = ranks.find(r => r.id === customer.rankId);
                        const now = new Date();
                        
                        const daysSinceVisit = customer.lastVisit 
                          ? Math.floor((now.getTime() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        
                        const daysSinceEmail = customer.lastEmail
                          ? Math.floor((now.getTime() - new Date(customer.lastEmail).getTime()) / (1000 * 60 * 60 * 24))
                          : null;
                        
                        const daysSincePhone = customer.lastPhone
                          ? Math.floor((now.getTime() - new Date(customer.lastPhone).getTime()) / (1000 * 60 * 60 * 24))
                          : null;

                        return (
                          <tr key={customer.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <p className="font-medium text-gray-900">{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.company}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {rank && (
                                <div className="flex items-center gap-0.5">
                                  {[...Array(parseInt(rank.id))].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                                  ))}
                                  {[...Array(5 - parseInt(rank.id))].map((_, i) => (
                                    <Star key={i + parseInt(rank.id)} className="h-4 w-4 text-gray-300" />
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <p className={daysSinceVisit && rank && daysSinceVisit > rank.visitFrequencyDays ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                  {daysSinceVisit !== null ? `${daysSinceVisit} days ago` : 'Never'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <p className={daysSinceEmail && rank && daysSinceEmail > rank.emailFrequencyDays ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                  {daysSinceEmail !== null ? `${daysSinceEmail} days ago` : 'Never'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <p className={daysSincePhone && rank && daysSincePhone > rank.phoneFrequencyDays ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                  {daysSincePhone !== null ? `${daysSincePhone} days ago` : 'Never'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {customer.assignedTo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex gap-2">
                                <button className="text-blue-600 hover:text-blue-800">
                                  <Calendar className="h-4 w-4" />
                                </button>
                                <button className="text-green-600 hover:text-green-800">
                                  <Mail className="h-4 w-4" />
                                </button>
                                <button className="text-purple-600 hover:text-purple-800">
                                  <Phone className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-medium mb-4">Touchpoint Configuration</h2>
                
                <div className="space-y-4">
                  {touchpointSettings.map((setting) => (
                    <div key={setting.type} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {setting.type === 'visit' && <Building className="h-5 w-5 text-gray-600" />}
                          {setting.type === 'email' && <Mail className="h-5 w-5 text-gray-600" />}
                          {setting.type === 'phone' && <Phone className="h-5 w-5 text-gray-600" />}
                          {setting.type === 'message' && <MessageSquare className="h-5 w-5 text-gray-600" />}
                          
                          <h3 className="font-medium text-gray-900 capitalize">{setting.type} Reminders</h3>
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
                        </label>
                      </div>
                      
                      {setting.enabled && (
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Default Frequency (days)
                            </label>
                            <input
                              type="number"
                              value={setting.defaultFrequencyDays}
                              onChange={(e) => {
                                const updated = [...touchpointSettings];
                                const idx = updated.findIndex(s => s.type === setting.type);
                                updated[idx].defaultFrequencyDays = parseInt(e.target.value);
                                setTouchpointSettings(updated);
                              }}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Remind Before (days)
                            </label>
                            <input
                              type="number"
                              value={setting.reminderDaysBefore}
                              onChange={(e) => {
                                const updated = [...touchpointSettings];
                                const idx = updated.findIndex(s => s.type === setting.type);
                                updated[idx].reminderDaysBefore = parseInt(e.target.value);
                                setTouchpointSettings(updated);
                              }}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Escalate After (days)
                            </label>
                            <input
                              type="number"
                              value={setting.escalateAfterDays}
                              onChange={(e) => {
                                const updated = [...touchpointSettings];
                                const idx = updated.findIndex(s => s.type === setting.type);
                                updated[idx].escalateAfterDays = parseInt(e.target.value);
                                setTouchpointSettings(updated);
                              }}
                              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Settings
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Rank Modal */}
        {showAddRankModal && editRankData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editRankData.id && ranks.find(r => r.id === editRankData.id) ? 'Edit' : 'Add'} Customer Ranking Tier
                </h2>
                <button
                  onClick={() => {
                    setShowAddRankModal(false);
                    setEditRankData(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Information */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tier Name
                      </label>
                      <input
                        type="text"
                        value={editRankData.name || ''}
                        onChange={(e) => setEditRankData({ ...editRankData, name: e.target.value })}
                        placeholder="e.g., 5 Stars - VIP"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Star Rating (1-5)
                      </label>
                      <select
                        value={editRankData.id || ''}
                        onChange={(e) => setEditRankData({ ...editRankData, id: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editRankData.description || ''}
                      onChange={(e) => setEditRankData({ ...editRankData, description: e.target.value })}
                      placeholder="Describe this customer tier..."
                      rows={2}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Follow-up Frequencies */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Follow-up Schedule</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Visit Frequency (days)
                      </label>
                      <input
                        type="number"
                        value={editRankData.visitFrequencyDays || 30}
                        onChange={(e) => setEditRankData({ ...editRankData, visitFrequencyDays: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Frequency (days)
                      </label>
                      <input
                        type="number"
                        value={editRankData.emailFrequencyDays || 14}
                        onChange={(e) => setEditRankData({ ...editRankData, emailFrequencyDays: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Frequency (days)
                      </label>
                      <input
                        type="number"
                        value={editRankData.phoneFrequencyDays || 21}
                        onChange={(e) => setEditRankData({ ...editRankData, phoneFrequencyDays: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Qualification Criteria */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Qualification Criteria</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Order Value ($)
                      </label>
                      <input
                        type="number"
                        value={editRankData.minOrderValue || 0}
                        onChange={(e) => setEditRankData({ ...editRankData, minOrderValue: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Minimum Orders Per Year
                      </label>
                      <input
                        type="number"
                        value={editRankData.minOrdersPerYear || 0}
                        onChange={(e) => setEditRankData({ ...editRankData, minOrdersPerYear: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tier Color
                  </label>
                  <div className="flex gap-2">
                    {['bg-yellow-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500', 'bg-gray-400'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditRankData({ ...editRankData, color })}
                        className={`w-10 h-10 rounded-lg ${color} ${editRankData.color === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddRankModal(false);
                    setEditRankData(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!editRankData.name) {
                      alert('Please enter a tier name');
                      return;
                    }

                    const existingIndex = ranks.findIndex(r => r.id === editRankData.id);
                    if (existingIndex >= 0) {
                      // Update existing
                      const updatedRanks = [...ranks];
                      updatedRanks[existingIndex] = editRankData as CustomerRank;
                      setRanks(updatedRanks);
                    } else {
                      // Add new
                      setRanks([...ranks, editRankData as CustomerRank]);
                    }
                    
                    setShowAddRankModal(false);
                    setEditRankData(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {ranks.find(r => r.id === editRankData.id) ? 'Update' : 'Add'} Tier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}