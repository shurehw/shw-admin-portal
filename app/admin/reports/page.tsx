'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, DollarSign, Package, Users, 
  Calendar, Download, Filter, RefreshCw, ArrowUp,
  ArrowDown, Building2, ShoppingCart, FileText
} from 'lucide-react';

interface ReportMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('30days');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  const reportTypes = [
    { id: 'overview', name: 'Overview', description: 'General business metrics' },
    { id: 'sales', name: 'Sales Report', description: 'Sales performance and trends' },
    { id: 'customers', name: 'Customer Report', description: 'Customer analytics and insights' },
    { id: 'products', name: 'Product Report', description: 'Product performance metrics' },
    { id: 'financial', name: 'Financial Report', description: 'Revenue and financial data' }
  ];

  const metrics: ReportMetric[] = [
    {
      label: 'Total Revenue',
      value: '$247,580',
      change: 12.5,
      trend: 'up',
      icon: DollarSign,
      color: 'green'
    },
    {
      label: 'Total Orders',
      value: '1,284',
      change: 8.2,
      trend: 'up',
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      label: 'New Customers',
      value: '156',
      change: -3.4,
      trend: 'down',
      icon: Users,
      color: 'purple'
    },
    {
      label: 'Average Order Value',
      value: '$192.80',
      change: 5.7,
      trend: 'up',
      icon: TrendingUp,
      color: 'orange'
    },
    {
      label: 'Products Sold',
      value: '3,842',
      change: 15.3,
      trend: 'up',
      icon: Package,
      color: 'indigo'
    },
    {
      label: 'Conversion Rate',
      value: '3.8%',
      change: 0.5,
      trend: 'up',
      icon: BarChart3,
      color: 'pink'
    }
  ];

  const topCustomers = [
    { name: 'Marriott International', orders: 45, revenue: 68500 },
    { name: 'Hilton Hotels', orders: 38, revenue: 52300 },
    { name: 'Caesars Entertainment', orders: 32, revenue: 48900 },
    { name: 'Restaurant Brands Intl', orders: 28, revenue: 41200 },
    { name: 'Local Hotel Group', orders: 24, revenue: 35600 }
  ];

  const topProducts = [
    { name: 'Luxury Bath Towel Set', units: 450, revenue: 22500 },
    { name: 'Premium King Bedding', units: 280, revenue: 19600 },
    { name: 'Executive Bathrobe', units: 320, revenue: 16000 },
    { name: 'Spa Slippers', units: 890, revenue: 13350 },
    { name: 'Hotel Amenity Kit', units: 1200, revenue: 12000 }
  ];

  const monthlySales = [
    { month: 'Jul', sales: 165000 },
    { month: 'Aug', sales: 182000 },
    { month: 'Sep', sales: 195000 },
    { month: 'Oct', sales: 210000 },
    { month: 'Nov', sales: 247580 },
    { month: 'Dec', sales: 0 }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleExport = () => {
    console.log('Exporting report...');
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Business insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={handleRefresh}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-gray-900">{report.name}</div>
              <div className="text-xs text-gray-500 mt-1">{report.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
                <div className={`flex items-center text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                }`}>
                  {metric.trend === 'up' && <ArrowUp className="h-4 w-4 mr-1" />}
                  {metric.trend === 'down' && <ArrowDown className="h-4 w-4 mr-1" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
              <p className="text-gray-600 text-sm mt-1">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Monthly Sales Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Sales Trend</h3>
          <div className="space-y-4">
            {monthlySales.map((month) => (
              <div key={month.month} className="flex items-center">
                <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(month.sales / 250000) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {formatCurrency(month.sales)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-3 text-sm font-medium text-gray-500">Customer</th>
                  <th className="text-left pb-3 text-sm font-medium text-gray-500">Orders</th>
                  <th className="text-left pb-3 text-sm font-medium text-gray-500">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((customer, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600">{customer.orders}</td>
                    <td className="py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(customer.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Top Products</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Product</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Units Sold</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Revenue</th>
                <th className="text-left pb-3 text-sm font-medium text-gray-500">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-gray-600">{product.units}</td>
                  <td className="py-3 text-sm font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="py-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(product.revenue / topProducts[0].revenue) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Year to Date Revenue</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">$1,252,400</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Total Customers</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">486</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Active Products</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">147</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600">Growth Rate</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">+18.5%</p>
          </div>
        </div>
      </div>
    </div>
  );
}