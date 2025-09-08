'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { 
  Building, Users, CreditCard, Package, FileText, 
  Search, Filter, Download, Plus, MoreVertical,
  TrendingUp, AlertCircle, CheckCircle, Clock
} from 'lucide-react';

interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  status: 'active' | 'pending' | 'suspended';
  creditLimit: number;
  currentBalance: number;
  paymentTerms: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  assignedTo: string;
  createdAt: string;
}

export default function AdminCustomers() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // In production, fetch based on user role and assigned customers
      const mockCustomers: Customer[] = [
        {
          id: '1',
          companyName: 'Marriott International',
          contactName: 'John Smith',
          email: 'purchasing@marriott.com',
          phone: '(555) 123-4567',
          status: 'active',
          creditLimit: 100000,
          currentBalance: 45678,
          paymentTerms: 'NET 30',
          totalOrders: 47,
          totalSpent: 567890,
          lastOrderDate: '2025-01-28',
          assignedTo: session?.user?.email || 'sales@shurehw.com',
          createdAt: '2023-06-15'
        },
        {
          id: '2',
          companyName: 'Hilton Hotels',
          contactName: 'Sarah Johnson',
          email: 'orders@hilton.com',
          phone: '(555) 234-5678',
          status: 'active',
          creditLimit: 75000,
          currentBalance: 12340,
          paymentTerms: 'NET 45',
          totalOrders: 35,
          totalSpent: 423567,
          lastOrderDate: '2025-01-25',
          assignedTo: session?.user?.email || 'sales@shurehw.com',
          createdAt: '2023-08-20'
        },
        {
          id: '3',
          companyName: 'Local Restaurant Group',
          contactName: 'Mike Chen',
          email: 'mike@localrestaurants.com',
          phone: '(555) 345-6789',
          status: 'pending',
          creditLimit: 25000,
          currentBalance: 0,
          paymentTerms: 'PREPAID',
          totalOrders: 3,
          totalSpent: 12450,
          lastOrderDate: '2025-01-20',
          assignedTo: session?.user?.email || 'sales@shurehw.com',
          createdAt: '2024-12-10'
        }
      ];

      // Filter customers based on user role
      const userRole = session?.user?.role || 'sales_rep';
      if (userRole === 'admin') {
        setCustomers(mockCustomers);
      } else {
        // Sales reps only see their assigned customers
        const assigned = mockCustomers.filter(c => 
          c.assignedTo === session?.user?.email
        );
        setCustomers(assigned);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filterStatus]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      suspended: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const handleCustomerAction = (action: string, customer: Customer) => {
    switch (action) {
      case 'place-order':
        router.push(`/admin/customers/${customer.id}/place-order`);
        break;
      case 'view':
        router.push(`/admin/customers/${customer.id}`);
        break;
      case 'edit':
        router.push(`/admin/customers/${customer.id}/edit`);
        break;
      case 'orders':
        router.push(`/admin/customers/${customer.id}/orders`);
        break;
      case 'quotes':
        router.push(`/admin/customers/${customer.id}/quotes`);
        break;
      case 'invoices':
        router.push(`/admin/customers/${customer.id}/invoices`);
        break;
      case 'users':
        router.push(`/admin/customers/${customer.id}/users`);
        break;
    }
    setShowActionMenu(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading customers...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">
            Manage your assigned B2B customers and their accounts
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Accounts</p>
                <p className="text-2xl font-bold">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold">
                  ${customers.reduce((sum, c) => sum + c.currentBalance, 0).toLocaleString()}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
                <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </button>
              </div>
            </div>
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.companyName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.paymentTerms} • ${customer.creditLimit.toLocaleString()} limit
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{customer.contactName}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        ${customer.currentBalance.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.totalOrders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{customer.lastOrderDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === customer.id ? null : customer.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {showActionMenu === customer.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                            <button
                              onClick={() => handleCustomerAction('place-order', customer)}
                              className="block w-full text-left px-4 py-2 text-sm text-white bg-gray-900 hover:bg-gray-800 font-medium"
                            >
                              🛒 Place Order
                            </button>
                            <hr className="my-1" />
                            <button
                              onClick={() => handleCustomerAction('view', customer)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => handleCustomerAction('edit', customer)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Edit Customer
                            </button>
                            <button
                              onClick={() => handleCustomerAction('orders', customer)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Orders
                            </button>
                            <button
                              onClick={() => handleCustomerAction('quotes', customer)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Quotes
                            </button>
                            <button
                              onClick={() => handleCustomerAction('invoices', customer)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              View Invoices
                            </button>
                            <button
                              onClick={() => handleCustomerAction('users', customer)}
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Manage Users
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}