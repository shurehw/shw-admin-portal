'use client';

import { Clock, MessageSquare, Eye, Building, Calendar, AlertTriangle } from 'lucide-react';

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

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
  onTicketSelect: (ticket: Ticket) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export default function TicketList({ 
  tickets, 
  loading, 
  onTicketSelect,
  getPriorityColor,
  getStatusColor
}: TicketListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isSLABreach = (slaDue?: string) => {
    if (!slaDue) return false;
    return new Date(slaDue) < new Date();
  };

  const getSLATimeRemaining = (slaDue?: string) => {
    if (!slaDue) return null;
    
    const due = new Date(slaDue);
    const now = new Date();
    const diffInMinutes = Math.floor((due.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 0) {
      return `Overdue by ${Math.abs(Math.floor(diffInMinutes / 60))}h`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m left`;
    } else {
      return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m left`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  <div className="h-6 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No tickets match your current filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-4 space-y-3">
        {tickets.map((ticket) => {
          const slaRemaining = getSLATimeRemaining(ticket.slaDue);
          const isBreach = isSLABreach(ticket.slaDue);
          
          return (
            <div
              key={ticket.id}
              onClick={() => onTicketSelect(ticket)}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {ticket.subject}
                    </h3>
                    {isBreach && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    {ticket.company && (
                      <div className="flex items-center">
                        <Building className="h-3 w-3 mr-1" />
                        <span>{ticket.company.companyName}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{formatDate(ticket.createdAt)}</span>
                    </div>
                    
                    {slaRemaining && (
                      <div className={`flex items-center ${isBreach ? 'text-red-600' : 'text-orange-600'}`}>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{slaRemaining}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                  </span>
                  
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="uppercase font-medium">{ticket.type}</span>
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  {ticket._count.messages > 0 && (
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>{ticket._count.messages}</span>
                    </div>
                  )}
                  
                  {ticket._count.watchers > 0 && (
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      <span>{ticket._count.watchers}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}