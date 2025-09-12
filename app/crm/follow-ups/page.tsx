'use client';

import { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle, AlertCircle, Phone, Mail, Building } from 'lucide-react';

export default function FollowUpsPage() {
  const [filter, setFilter] = useState('all');

  const followUps = [
    {
      id: 1,
      type: 'call',
      contact: 'John Smith',
      company: 'ABC Corp',
      dueDate: 'Today',
      priority: 'high',
      status: 'overdue',
      notes: 'Discuss Q1 pricing'
    },
    {
      id: 2,
      type: 'email',
      contact: 'Sarah Johnson',
      company: 'XYZ Ltd',
      dueDate: 'Tomorrow',
      priority: 'medium',
      status: 'upcoming',
      notes: 'Send product catalog'
    },
    {
      id: 3,
      type: 'visit',
      contact: 'Mike Davis',
      company: 'Tech Solutions',
      dueDate: 'Next Week',
      priority: 'low',
      status: 'scheduled',
      notes: 'Annual review meeting'
    }
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'visit': return <Building className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'upcoming': return 'text-yellow-600 bg-yellow-50';
      case 'scheduled': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
        <p className="text-gray-600 mt-1">Manage your scheduled follow-ups and reminders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'overdue', 'today', 'upcoming'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === f 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Follow-ups List */}
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y">
          {followUps.map((followUp) => (
            <div key={followUp.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(followUp.status)}`}>
                    {getIcon(followUp.type)}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{followUp.contact}</div>
                    <div className="text-sm text-gray-500">{followUp.company}</div>
                    <div className="text-sm text-gray-600 mt-1">{followUp.notes}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{followUp.dueDate}</div>
                  <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                    followUp.priority === 'high' ? 'bg-red-100 text-red-700' :
                    followUp.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {followUp.priority} priority
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}