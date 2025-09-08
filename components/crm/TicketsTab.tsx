'use client';

import { useState, useEffect } from 'react';
import { 
  ExternalLink, Filter, Search, RefreshCw, ChevronLeft, ChevronRight,
  Calendar, User, AlertTriangle, Clock, ArrowUpDown, Plus, Eye
} from 'lucide-react';
import { crmTicketingAPI, getStatusColor, getPriorityColor, formatSLATime } from '@/lib/crm/ticketing-api';

interface TicketsTabProps {
  companyId?: string;
  contactId?: string;
}

interface TicketPreview {
  id: string;
  subject: string;
  status: string;
  priority: string;
  type: string;
  ownerId?: string;
  ownerName?: string;
  slaDue?: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketSearchResult {
  tickets: TicketPreview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'new', label: 'New' },
  { value: 'ack', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_customer', label: 'Waiting on Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'support', label: 'Support' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'billing', label: 'Billing' },
  { value: 'quality', label: 'Quality' },
  { value: 'return', label: 'Return' },
  { value: 'other', label: 'Other' }
];

export default function TicketsTab({ companyId, contactId }: TicketsTabProps) {
  const [searchResult, setSearchResult] = useState<TicketSearchResult>({
    tickets: [],
    pagination: { page: 1, limit: 25, total: 0, totalPages: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    type: ''
  });
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadTickets();
  }, [companyId, contactId, filters, sortBy, sortOrder, currentPage]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check access first
      const accessCheck = await crmTicketingAPI.hasTicketingAccess();
      setHasAccess(accessCheck);
      
      if (!accessCheck) {
        return;
      }

      const params: any = {
        page: currentPage,
        limit: 25,
        sortBy,
        sortOrder
      };

      if (companyId) params.companyId = companyId;
      if (contactId) params.contactId = contactId;
      if (filters.status) params.status = [filters.status];
      if (filters.priority) params.priority = [filters.priority];
      if (filters.type) params.type = [filters.type];

      const result = await crmTicketingAPI.searchTickets(params);
      setSearchResult(result);

    } catch (err: any) {
      console.error('Failed to load tickets:', err);
      setError(err.message || 'Failed to load tickets');
      
      if (err.message.includes('Authentication') || err.message.includes('permissions')) {
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleTicketClick = (ticketId: string) => {
    const url = crmTicketingAPI.generateTicketLink(ticketId);
    window.open(url, '_blank');
  };

  const handleNewTicket = () => {
    const url = crmTicketingAPI.generateNewTicketLink({
      companyId,
      contactId,
      source: 'crm'
    });
    window.open(url, '_blank');
  };

  const handleOpenTicketing = () => {
    const url = crmTicketingAPI.generateTicketingDashboardLink({ 
      companyId,
      contactId 
    });
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return (
      <ArrowUpDown 
        className={`h-4 w-4 ${
          sortOrder === 'asc' ? 'text-blue-600 rotate-180' : 'text-blue-600'
        }`} 
      />
    );
  };

  // Don't render if user doesn't have access
  if (!hasAccess && !loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Ticketing access not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenTicketing}
              className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Eye className="h-4 w-4 mr-1" />
              Open Full Ticketing
            </button>
            <button
              onClick={handleNewTicket}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Ticket
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PRIORITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-3">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-2">Failed to load tickets</div>
            <button
              onClick={loadTickets}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Try again
            </button>
          </div>
        ) : searchResult.tickets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500 mb-2">No tickets found</div>
            <button
              onClick={handleNewTicket}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Create your first ticket
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('id')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>Ticket #</span>
                    {getSortIcon('id')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('subject')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>Subject</span>
                    {getSortIcon('subject')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('slaDue')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>SLA</span>
                    {getSortIcon('slaDue')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
                <th className="px-6 py-3 text-left">
                  <button
                    onClick={() => handleSort('updatedAt')}
                    className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                  >
                    <span>Updated</span>
                    {getSortIcon('updatedAt')}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {searchResult.tickets.map((ticket) => {
                const slaInfo = formatSLATime(ticket.slaDue);
                
                return (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      TKT-{ticket.id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">{ticket.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">
                      {ticket.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ticket.slaDue ? (
                        <div className={`flex items-center space-x-1 ${slaInfo.color}`}>
                          {slaInfo.isBreached && <AlertTriangle className="h-3 w-3" />}
                          <Clock className="h-3 w-3" />
                          <span>{slaInfo.text}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No SLA</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.ownerId ? (
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{ticket.ownerName || ticket.ownerId}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(ticket.updatedAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleTicketClick(ticket.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {searchResult.pagination.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * searchResult.pagination.limit + 1} to{' '}
            {Math.min(currentPage * searchResult.pagination.limit, searchResult.pagination.total)} of{' '}
            {searchResult.pagination.total} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-1">Previous</span>
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {searchResult.pagination.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, searchResult.pagination.totalPages))}
              disabled={currentPage === searchResult.pagination.totalPages}
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span className="mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}