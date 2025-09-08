'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import OrderStatus from '@/components/OrderStatus';
import { Building, Users, FileText, Package, TrendingUp, CreditCard, AlertCircle, Clock } from 'lucide-react';

interface DashboardStats {
  totalCustomers: number;
  activeQuotes: number;
  pendingOrders: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  newCustomers: number;
  artProofsPending: number;
  quotesRequested: number;
}

interface RecentActivity {
  id: number;
  type: string;
  message: string;
  time: string;
  urgent?: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'dashboard' | 'orders'>('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeQuotes: 0,
    pendingOrders: 0,
    overdueInvoices: 0,
    monthlyRevenue: 0,
    newCustomers: 0,
    artProofsPending: 0,
    quotesRequested: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // Mock data for now
      setStats({
        totalCustomers: 48,
        activeQuotes: 12,
        pendingOrders: 7,
        overdueInvoices: 3,
        monthlyRevenue: 125430,
        newCustomers: 5,
        artProofsPending: 4,
        quotesRequested: 8
      });

      setRecentActivities([
        { id: 1, type: 'quote', message: 'New quote request from Marriott Hotels', time: '5 minutes ago', urgent: true },
        { id: 2, type: 'order', message: 'Order #1247 approved by Hilton', time: '1 hour ago' },
        { id: 3, type: 'payment', message: 'Payment received from Caesars - $45,678', time: '2 hours ago' },
        { id: 4, type: 'artproof', message: 'Art proof approved by Local Restaurant Group', time: '3 hours ago' },
        { id: 5, type: 'customer', message: 'New customer registered: Boutique Hotel Chain', time: '5 hours ago' }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, Admin
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'dashboard'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveView('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'orders'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Order Status
            </button>
          </nav>
        </div>

        {/* Conditional Content */}
        {activeView === 'dashboard' ? (
          <>
            {/* Dashboard Overview Content */}

        {/* Quick Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              <span className="text-blue-900 font-medium">Quick Actions Needed:</span>
            </div>
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                View Quote Requests ({stats.quotesRequested})
              </button>
              <button className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700">
                Review Art Proofs ({stats.artProofsPending})
              </button>
              <button className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700">
                Overdue Invoices ({stats.overdueInvoices})
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Customers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                <p className="text-xs text-green-600 mt-1">+{stats.newCustomers} this month</p>
              </div>
              <Building className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeQuotes}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.quotesRequested} new requests</p>
              </div>
              <FileText className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
              </div>
              <Package className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">+12% vs last month</p>
              </div>
              <TrendingUp className="h-10 w-10 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start">
                    <div className={`p-2 rounded-full mr-3 ${
                      activity.urgent ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {activity.type === 'quote' && <FileText className="h-4 w-4 text-gray-600" />}
                      {activity.type === 'order' && <Package className="h-4 w-4 text-gray-600" />}
                      {activity.type === 'payment' && <CreditCard className="h-4 w-4 text-gray-600" />}
                      {activity.type === 'customer' && <Users className="h-4 w-4 text-gray-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {activity.time}
                      </p>
                    </div>
                    {activity.urgent && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Urgent</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Quick Links</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/admin/customers')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Building className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Customers</p>
                      <p className="text-xs text-gray-500">View and edit customer accounts</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/admin/quotes')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Process Quotes</p>
                      <p className="text-xs text-gray-500">Create and manage quotes</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/admin/orders')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Order Management</p>
                      <p className="text-xs text-gray-500">Track and process orders</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => router.push('/admin/invoices')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <CreditCard className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Invoices & Payments</p>
                      <p className="text-xs text-gray-500">Manage billing and payments</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
          </>
        ) : (
          <OrderStatus />
        )}
      </div>
    </AdminLayout>
  );
}