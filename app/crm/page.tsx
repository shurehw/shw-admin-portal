'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Building, Target, CheckSquare, Activity, 
  Calendar, Bell, Star, Phone, Mail, Clock,
  AlertCircle, TrendingUp, DollarSign, ChevronRight,
  MapPin, MessageSquare, Filter, ArrowUpRight
} from 'lucide-react';

interface TouchpointReminder {
  id: string;
  customerName: string;
  companyName: string;
  type: 'visit' | 'email' | 'phone' | 'message';
  dueDate: Date;
  daysOverdue: number;
  ranking: number;
  assignedTo: string;
  lastContact: string;
}

export default function MyDayPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all');
  const [reminders, setReminders] = useState<TouchpointReminder[]>([]);

  // Sample data - in production, fetch from database
  useEffect(() => {
    const sampleReminders: TouchpointReminder[] = [
      {
        id: '1',
        customerName: 'John Smith',
        companyName: 'Luxury Hotels Inc',
        type: 'visit',
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        daysOverdue: 2,
        ranking: 5,
        assignedTo: 'You',
        lastContact: '30 days ago'
      },
      {
        id: '2',
        customerName: 'Sarah Johnson',
        companyName: 'Resort Paradise',
        type: 'email',
        dueDate: new Date(),
        daysOverdue: 0,
        ranking: 4,
        assignedTo: 'You',
        lastContact: '14 days ago'
      },
      {
        id: '3',
        customerName: 'Mike Wilson',
        companyName: 'City Center Hotels',
        type: 'phone',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        daysOverdue: -2,
        ranking: 3,
        assignedTo: 'You',
        lastContact: '21 days ago'
      },
      {
        id: '4',
        customerName: 'Emily Davis',
        companyName: 'Beachfront Resorts',
        type: 'visit',
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        daysOverdue: 5,
        ranking: 5,
        assignedTo: 'You',
        lastContact: '45 days ago'
      }
    ];
    setReminders(sampleReminders);
  }, []);

  const getFilteredReminders = () => {
    switch(selectedFilter) {
      case 'overdue':
        return reminders.filter(r => r.daysOverdue > 0);
      case 'today':
        return reminders.filter(r => r.daysOverdue === 0);
      case 'week':
        return reminders.filter(r => r.daysOverdue <= 7 && r.daysOverdue >= -7);
      default:
        return reminders;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'visit':
        return <MapPin className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (daysOverdue: number) => {
    if (daysOverdue > 0) return 'text-red-600 bg-red-50';
    if (daysOverdue === 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getUrgencyText = (daysOverdue: number) => {
    if (daysOverdue > 0) return `${daysOverdue} days overdue`;
    if (daysOverdue === 0) return 'Due today';
    return `Due in ${Math.abs(daysOverdue)} days`;
  };

  const stats = {
    overdueCount: reminders.filter(r => r.daysOverdue > 0).length,
    todayCount: reminders.filter(r => r.daysOverdue === 0).length,
    weekCount: reminders.filter(r => r.daysOverdue <= 7 && r.daysOverdue >= -7).length,
    totalContacts: 124,
    activeDeals: 23,
    totalRevenue: 450000
  };

  return (
      <div className="p-6 space-y-6">
        {/* Header with Welcome Message */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Day</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what needs your attention today.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Urgent Alert Banner */}
        {stats.overdueCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">
                You have {stats.overdueCount} overdue follow-up{stats.overdueCount > 1 ? 's' : ''} that need immediate attention
              </p>
            </div>
            <button 
              onClick={() => setSelectedFilter('overdue')}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              View Overdue
            </button>
          </div>
        )}

        {/* Follow-up Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => setSelectedFilter('overdue')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedFilter === 'overdue' 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedFilter('today')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedFilter === 'today' 
                ? 'border-yellow-500 bg-yellow-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">Due Today</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.todayCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedFilter('week')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedFilter === 'week' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-blue-600">{stats.weekCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedFilter('all')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedFilter === 'all' 
                ? 'border-gray-500 bg-gray-50' 
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-sm font-medium text-gray-600">All Reminders</p>
                <p className="text-2xl font-bold text-gray-900">{reminders.length}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <Filter className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Follow-up Reminders - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow border border-gray-200">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Follow-up Reminders</h2>
                <Link 
                  href="/crm/follow-ups"
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  View all
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="divide-y">
                {getFilteredReminders().length > 0 ? (
                  getFilteredReminders().slice(0, 5).map((reminder) => (
                    <div key={reminder.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${getUrgencyColor(reminder.daysOverdue)}`}>
                            {getTypeIcon(reminder.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{reminder.customerName}</p>
                              <div className="flex">
                                {[...Array(reminder.ranking)].map((_, i) => (
                                  <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{reminder.companyName}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className={`font-medium ${reminder.daysOverdue > 0 ? 'text-red-600' : ''}`}>
                                {getUrgencyText(reminder.daysOverdue)}
                              </span>
                              <span>Last contact: {reminder.lastContact}</span>
                              <span className="capitalize">{reminder.type} follow-up</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                            Complete
                          </button>
                          <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
                            Snooze
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No reminders to show</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Performance Snapshot */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Today's Snapshot</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm text-gray-600">New Contacts</span>
                  </div>
                  <span className="font-semibold">+3</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm text-gray-600">Deals Closed</span>
                  </div>
                  <span className="font-semibold">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                  <span className="font-semibold">$45,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="text-sm text-gray-600">Activities</span>
                  </div>
                  <span className="font-semibold">12</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href="/crm/contacts/new"
                  className="p-3 text-center border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs font-medium">Add Contact</span>
                </Link>
                <Link 
                  href="/crm/deals/new"
                  className="p-3 text-center border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Target className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <span className="text-xs font-medium">New Deal</span>
                </Link>
                <Link 
                  href="/crm/activities/new"
                  className="p-3 text-center border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Activity className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                  <span className="text-xs font-medium">Log Activity</span>
                </Link>
                <Link 
                  href="/crm/tasks/new"
                  className="p-3 text-center border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckSquare className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                  <span className="text-xs font-medium">Create Task</span>
                </Link>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">VIP Customers</h3>
                <Link 
                  href="/crm/customer-rankings"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Luxury Hotels Inc</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Resort Paradise</p>
                    <div className="flex mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Beachfront Resorts</p>
                    <div className="flex mt-1">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link href="/crm/activities" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">New contact added: John Doe from Luxury Hotels Inc</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Deal closed: Resort Paradise - $25,000</p>
                <p className="text-xs text-gray-500">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-full">
                <Phone className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Call completed with City Center Hotels</p>
                <p className="text-xs text-gray-500">Yesterday at 3:30 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}