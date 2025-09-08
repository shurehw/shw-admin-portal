'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  FileText, Search, Filter, Download, Eye, Send, 
  CheckCircle, Clock, XCircle, DollarSign, Calendar,
  User, Building, Package, AlertCircle
} from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  customer: {
    name: string;
    company: string;
    email: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  notes?: string;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      // In production, this would fetch from your API
      // For now, using mock data
      const mockQuotes: Quote[] = [
        {
          id: '1',
          quoteNumber: 'Q-2024-001',
          customer: {
            name: 'John Smith',
            company: 'ABC Company',
            email: 'john@abc.com'
          },
          items: [
            { name: 'Custom T-Shirts', quantity: 100, price: 15, total: 1500 },
            { name: 'Embroidered Caps', quantity: 50, price: 25, total: 1250 }
          ],
          subtotal: 2750,
          tax: 247.50,
          shipping: 50,
          total: 3047.50,
          status: 'sent',
          validUntil: '2024-02-15',
          createdAt: '2024-01-15',
          sentAt: '2024-01-15'
        },
        {
          id: '2',
          quoteNumber: 'Q-2024-002',
          customer: {
            name: 'Jane Doe',
            company: 'XYZ Corp',
            email: 'jane@xyz.com'
          },
          items: [
            { name: 'Business Cards', quantity: 1000, price: 0.10, total: 100 },
            { name: 'Letterheads', quantity: 500, price: 0.25, total: 125 }
          ],
          subtotal: 225,
          tax: 20.25,
          shipping: 15,
          total: 260.25,
          status: 'accepted',
          validUntil: '2024-02-20',
          createdAt: '2024-01-20',
          sentAt: '2024-01-20',
          viewedAt: '2024-01-21',
          respondedAt: '2024-01-22'
        },
        {
          id: '3',
          quoteNumber: 'Q-2024-003',
          customer: {
            name: 'Bob Wilson',
            company: 'Wilson Industries',
            email: 'bob@wilson.com'
          },
          items: [
            { name: 'Promotional Banners', quantity: 10, price: 150, total: 1500 },
            { name: 'Trade Show Display', quantity: 1, price: 2500, total: 2500 }
          ],
          subtotal: 4000,
          tax: 360,
          shipping: 100,
          total: 4460,
          status: 'draft',
          validUntil: '2024-02-25',
          createdAt: '2024-01-25'
        }
      ];
      
      setQuotes(mockQuotes);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'viewed': return <Eye className="h-4 w-4" />;
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.customer.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="h-8 w-8 mr-3" />
            Quote Management
          </h1>
          <p className="text-gray-600 mt-1">
            Create, manage, and track quotes for B2B customers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-blue-600">
                  {quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">
                  {quotes.filter(q => q.status === 'accepted').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${quotes.reduce((sum, q) => sum + q.total, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="viewed">Viewed</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            
            <button
              onClick={() => window.location.href = '/admin/quotes/new'}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center"
            >
              <FileText className="h-5 w-5 mr-2" />
              Create New Quote
            </button>
          </div>
        </div>

        {/* Quotes Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quote #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading quotes...
                    </td>
                  </tr>
                ) : filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No quotes found
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {quote.quoteNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {quote.customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {quote.customer.company}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ${quote.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          {getStatusIcon(quote.status)}
                          <span className="ml-1">{quote.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(quote.validUntil).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(quote.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedQuote(quote)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-800"
                            title="Download"
                          >
                            <Download className="h-5 w-5" />
                          </button>
                          {quote.status === 'draft' && (
                            <button
                              className="text-green-600 hover:text-green-800"
                              title="Send"
                            >
                              <Send className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quote Detail Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedQuote.quoteNumber}
                    </h2>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedQuote.status)} mt-2`}>
                      {getStatusIcon(selectedQuote.status)}
                      <span className="ml-1">{selectedQuote.status}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedQuote(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Customer Info */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start">
                      <Building className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedQuote.customer.company}</p>
                        <p className="text-sm text-gray-600">{selectedQuote.customer.name}</p>
                        <p className="text-sm text-gray-600">{selectedQuote.customer.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedQuote.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">${item.total.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 text-right">Subtotal</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">${selectedQuote.subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 text-right">Tax</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">${selectedQuote.tax.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm text-gray-600 text-right">Shipping</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">${selectedQuote.shipping.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Total</td>
                          <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">${selectedQuote.total.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 text-gray-900">{new Date(selectedQuote.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedQuote.sentAt && (
                      <div className="flex items-center text-sm">
                        <Send className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Sent:</span>
                        <span className="ml-2 text-gray-900">{new Date(selectedQuote.sentAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedQuote.viewedAt && (
                      <div className="flex items-center text-sm">
                        <Eye className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Viewed:</span>
                        <span className="ml-2 text-gray-900">{new Date(selectedQuote.viewedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedQuote.respondedAt && (
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Responded:</span>
                        <span className="ml-2 text-gray-900">{new Date(selectedQuote.respondedAt).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm">
                      <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Valid Until:</span>
                      <span className="ml-2 text-gray-900">{new Date(selectedQuote.validUntil).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center">
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF
                  </button>
                  {selectedQuote.status === 'draft' && (
                    <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center">
                      <Send className="h-5 w-5 mr-2" />
                      Send Quote
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}