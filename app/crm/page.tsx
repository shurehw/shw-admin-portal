import Link from 'next/link';
import { 
  Users, 
  Building, 
  Target, 
  CheckSquare, 
  Activity, 
  Ticket, 
  TrendingUp,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';

export default function CRMOverviewPage() {
  // Sample data - in production, fetch from database
  const stats = {
    contacts: 124,
    companies: 45,
    deals: 23,
    tasks: 18,
    totalRevenue: 450000,
    conversionRate: 23.5
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">CRM Overview</h1>
        <p className="text-gray-600">Welcome to your CRM dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.contacts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Companies</p>
              <p className="text-2xl font-bold text-gray-900">{stats.companies}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Deals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.deals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckSquare className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Revenue Pipeline</h2>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Total Pipeline Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-semibold">{stats.conversionRate}%</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${stats.conversionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">New contact added</p>
                <p className="text-xs text-gray-500">John Doe - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 bg-green-100 rounded-full">
                <Target className="h-4 w-4 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Deal closed</p>
                <p className="text-xs text-gray-500">Acme Corp - $25,000</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 rounded-full">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">Meeting scheduled</p>
                <p className="text-xs text-gray-500">Tomorrow at 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link 
            href="/crm/contacts/new"
            className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <span className="text-sm font-medium">Add Contact</span>
          </Link>
          <Link 
            href="/crm/companies/new"
            className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">Add Company</span>
          </Link>
          <Link 
            href="/crm/deals/new"
            className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Target className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Create Deal</span>
          </Link>
          <Link 
            href="/crm/tasks"
            className="p-4 text-center border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-orange-600" />
            <span className="text-sm font-medium">View Tasks</span>
          </Link>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Tasks</h2>
          <Link href="/crm/tasks" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Follow up with Acme Corp</p>
              <p className="text-sm text-gray-500">Due tomorrow</p>
            </div>
            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
              Pending
            </span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Send proposal to Tech Solutions</p>
              <p className="text-sm text-gray-500">Due in 3 days</p>
            </div>
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              In Progress
            </span>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="font-medium">Quarterly review meeting</p>
              <p className="text-sm text-gray-500">Due next week</p>
            </div>
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
              Scheduled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}