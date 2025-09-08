'use client';

import { useState } from 'react';
import { X, Building, Package, FileText, Search } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  type: string;
  company?: {
    companyName: string;
  };
  createdAt: string;
  slaDue?: string;
  _count: {
    messages: number;
    watchers: number;
  };
}

interface NewTicketModalProps {
  onClose: () => void;
  onTicketCreated: (ticket: Ticket) => void;
}

const TICKET_TYPES = [
  { value: 'support', label: 'General Support' },
  { value: 'delivery', label: 'Delivery Issue' },
  { value: 'billing', label: 'Billing Question' },
  { value: 'quality', label: 'Quality Issue' },
  { value: 'return', label: 'Return Request' },
  { value: 'other', label: 'Other' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export default function NewTicketModal({ onClose, onTicketCreated }: NewTicketModalProps) {
  const [formData, setFormData] = useState({
    subject: '',
    body: '',
    type: 'support',
    priority: 'normal',
    channel: 'web',
    companyId: '',
    orderId: '',
    quoteId: ''
  });
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [showOrderSearch, setShowOrderSearch] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Mock data for search
  const mockCompanies = [
    { id: '1', companyName: 'Marriott Hotels', email: 'orders@marriott.com' },
    { id: '2', companyName: 'Hilton Worldwide', email: 'procurement@hilton.com' },
    { id: '3', companyName: 'Local Restaurant Group', email: 'manager@localrestaurants.com' },
  ];

  const mockOrders = [
    { id: '1', orderNumber: 'ORD-1234', companyName: 'Marriott Hotels', total: 15420 },
    { id: '2', orderNumber: 'ORD-1235', companyName: 'Hilton Worldwide', total: 8750 },
    { id: '3', orderNumber: 'ORD-1236', companyName: 'Local Restaurant Group', total: 3240 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.body.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTicket: Ticket = {
        id: Date.now().toString(),
        subject: formData.subject,
        status: 'new',
        priority: formData.priority,
        type: formData.type,
        company: selectedCompany ? { companyName: selectedCompany.companyName } : undefined,
        createdAt: new Date().toISOString(),
        _count: { messages: 1, watchers: 0 }
      };

      onTicketCreated(newTicket);
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="space-y-6">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TICKET_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PRIORITIES.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Company Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company (Optional)
              </label>
              {selectedCompany ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedCompany.companyName}</p>
                      <p className="text-sm text-gray-500">{selectedCompany.email}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCompany(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCompanySearch(!showCompanySearch)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <Search className="inline h-4 w-4 mr-2" />
                    Search for a company...
                  </button>
                  
                  {showCompanySearch && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                      {mockCompanies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompany(company);
                            setShowCompanySearch(false);
                            handleInputChange('companyId', company.id);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{company.companyName}</div>
                          <div className="text-sm text-gray-500">{company.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Related Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Related Order (Optional)
              </label>
              {selectedOrder ? (
                <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Package className="h-4 w-4 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedOrder.orderNumber}</p>
                      <p className="text-sm text-gray-500">{selectedOrder.companyName} • ${selectedOrder.total.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOrderSearch(!showOrderSearch)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-gray-500 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <Search className="inline h-4 w-4 mr-2" />
                    Search for an order...
                  </button>
                  
                  {showOrderSearch && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-48 overflow-y-auto">
                      {mockOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderSearch(false);
                            handleInputChange('orderId', order.id);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{order.companyName} • ${order.total.toLocaleString()}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Provide detailed information about the issue or request..."
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.subject.trim() || !formData.body.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}