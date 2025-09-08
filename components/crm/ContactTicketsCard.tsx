'use client';

import { useState, useEffect } from 'react';
import { 
  MessageSquare, AlertTriangle, Clock, ExternalLink, Plus, 
  RefreshCw, Eye, User, Calendar, ArrowRight, Mail, Phone
} from 'lucide-react';
import { crmTicketingAPI, getStatusColor, getPriorityColor, formatSLATime } from '@/lib/crm/ticketing-api';

interface ContactTicketsCardProps {
  contactId: string;
  companyId?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

interface TicketSummary {
  open: number;
  breaching: number;
  waiting_customer: number;
  total: number;
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

export default function ContactTicketsCard({ 
  contactId, 
  companyId, 
  contactInfo 
}: ContactTicketsCardProps) {
  const [summary, setSummary] = useState<TicketSummary>({ open: 0, breaching: 0, waiting_customer: 0, total: 0 });
  const [recentTickets, setRecentTickets] = useState<TicketPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTicketData();
  }, [contactId]);

  const loadTicketData = async (force = false) => {
    try {
      if (force) {
        setRefreshing(true);
        crmTicketingAPI.invalidateContactCache(contactId);
      } else {
        setLoading(true);
      }
      
      setError(null);

      // Check if user has access to tickets
      const accessCheck = await crmTicketingAPI.hasTicketingAccess();
      setHasAccess(accessCheck);
      
      if (!accessCheck) {
        console.info('User lacks tickets:read permission, hiding widget');
        return;
      }

      // Load summary and recent tickets in parallel
      const [summaryData, ticketsData] = await Promise.all([
        crmTicketingAPI.getContactTicketSummary(contactId),
        crmTicketingAPI.getContactTickets(contactId, 5)
      ]);

      setSummary(summaryData);
      setRecentTickets(ticketsData);

    } catch (err: any) {
      console.error('Failed to load ticket data:', err);
      setError(err.message || 'Failed to load tickets');
      
      // If auth error, hide the widget
      if (err.message.includes('Authentication') || err.message.includes('permissions')) {
        setHasAccess(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadTicketData(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const handleTicketClick = (ticketId: string) => {
    const url = crmTicketingAPI.generateTicketLink(ticketId);
    window.open(url, '_blank');
  };

  const handleNewTicket = () => {
    const url = crmTicketingAPI.generateNewTicketLink({
      contactId,
      companyId,
      source: 'crm'
    });
    window.open(url, '_blank');
  };

  const handleOpenTicketing = () => {
    const url = crmTicketingAPI.generateTicketingDashboardLink({ 
      contactId,
      companyId 
    });
    window.open(url, '_blank');
  };

  // Don't render if user doesn't have access
  if (!hasAccess && !loading) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Support Tickets</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Contact Communication Chips */}
        {contactInfo && (
          <div className="flex flex-wrap gap-2 mb-4">
            {contactInfo.email && (
              <div className="flex items-center px-2 py-1 bg-blue-50 rounded-full text-xs">
                <Mail className="h-3 w-3 mr-1 text-blue-600" />
                <span className="text-blue-700">{contactInfo.email}</span>
              </div>
            )}
            {contactInfo.phone && (
              <div className="flex items-center px-2 py-1 bg-green-50 rounded-full text-xs">
                <Phone className="h-3 w-3 mr-1 text-green-600" />
                <span className="text-green-700">{contactInfo.phone}</span>
              </div>
            )}
          </div>
        )}

        {loading && !refreshing ? (
          <div className="space-y-3">
            <div className="animate-pulse">
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded p-3">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b border-gray-100 pb-3">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="text-red-500 text-sm mb-2">Failed to load tickets</div>
            <button
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.open}</div>
                <div className="text-xs text-blue-700">Open</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.breaching}</div>
                <div className="text-xs text-red-700">Breaching</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{summary.waiting_customer}</div>
                <div className="text-xs text-orange-700">Waiting</div>
              </div>
            </div>

            {/* Recent Tickets */}
            <div className="space-y-3 mb-4">
              <h4 className="text-sm font-medium text-gray-700">Recent Tickets</h4>
              
              {recentTickets.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No tickets found</p>
                  <p className="text-xs text-gray-400 mt-1">Create a ticket to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => {
                    const slaInfo = formatSLATime(ticket.slaDue);
                    
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => handleTicketClick(ticket.id)}
                        className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                                {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                              </span>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                              </span>
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase">
                                {ticket.type}
                              </span>
                            </div>
                            
                            <h5 className="font-medium text-sm text-gray-900 truncate mb-1">
                              {ticket.subject}
                            </h5>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{formatDate(ticket.createdAt)}</span>
                                </div>
                                {ticket.ownerId && (
                                  <div className="flex items-center space-x-1">
                                    <User className="h-3 w-3" />
                                    <span>{ticket.ownerName || ticket.ownerId}</span>
                                  </div>
                                )}
                              </div>
                              
                              {ticket.slaDue && (
                                <div className={`flex items-center space-x-1 ${slaInfo.color}`}>
                                  {slaInfo.isBreached && <AlertTriangle className="h-3 w-3" />}
                                  <Clock className="h-3 w-3" />
                                  <span>{slaInfo.text}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <ExternalLink className="h-3 w-3 text-gray-400 ml-2 flex-shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <button
                onClick={handleOpenTicketing}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Open Ticketing
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
              
              <button
                onClick={handleNewTicket}
                className="w-full flex items-center justify-center px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </button>
            </div>

            {/* Total Count */}
            {summary.total > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                <button
                  onClick={handleOpenTicketing}
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  View all {summary.total} tickets →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}