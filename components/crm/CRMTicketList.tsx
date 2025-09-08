'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, User } from 'lucide-react';
import SimpleTicketDrawer from '@/components/ticketing/SimpleTicketDrawer';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  company?: {
    companyName: string;
  };
  createdAt: string;
}

export default function CRMTicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Mock data - replace with API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockTickets: Ticket[] = [
        {
          id: '1',
          subject: 'Order #1234 missing items',
          status: 'new',
          priority: 'high',
          company: { companyName: 'Marriott Hotels' },
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          subject: 'Invoice discrepancy',
          status: 'in_progress',
          priority: 'normal',
          company: { companyName: 'Hilton' },
          createdAt: '2024-01-15T09:15:00Z'
        },
        {
          id: '3',
          subject: 'Return authorization needed',
          status: 'waiting_customer',
          priority: 'normal',
          company: { companyName: 'Boutique Hotel' },
          createdAt: '2024-01-14T14:20:00Z'
        }
      ];

      setTickets(mockTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'waiting_customer':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'text-purple-600 bg-purple-100';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'waiting_customer':
        return 'text-orange-600 bg-orange-100';
      case 'resolved':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Tickets</h2>
        <p className="mt-1 text-sm text-gray-500">Quick view of recent support tickets</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading tickets...</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(ticket.status)}
                      <span className={`ml-2 text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {ticket.subject}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {ticket.company?.companyName || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple Ticket Drawer */}
      {selectedTicket && (
        <SimpleTicketDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
        />
      )}
    </div>
  );
}