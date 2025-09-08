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

interface TicketBoardProps {
  tickets: Ticket[];
  loading: boolean;
  onTicketSelect: (ticket: Ticket) => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

const STATUS_COLUMNS = [
  { id: 'new', title: 'New', color: 'bg-purple-100 border-purple-200' },
  { id: 'ack', title: 'Acknowledged', color: 'bg-blue-100 border-blue-200' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-100 border-yellow-200' },
  { id: 'waiting_customer', title: 'Waiting on Customer', color: 'bg-orange-100 border-orange-200' },
  { id: 'closed', title: 'Closed', color: 'bg-green-100 border-green-200' }
];

export default function TicketBoard({ 
  tickets, 
  loading, 
  onTicketSelect,
  getPriorityColor,
  getStatusColor
}: TicketBoardProps) {
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

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-hidden bg-gray-50">
        <div className="h-full flex space-x-4 p-4">
          {STATUS_COLUMNS.map((column) => (
            <div key={column.id} className="flex-1 bg-white rounded-lg border border-gray-200">
              <div className={`p-4 border-b ${column.color} rounded-t-lg`}>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <div className="p-4 space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-3">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden bg-gray-50">
      <div className="h-full flex space-x-4 p-4">
        {STATUS_COLUMNS.map((column) => {
          const columnTickets = getTicketsByStatus(column.id);
          
          return (
            <div key={column.id} className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
              <div className={`p-4 border-b ${column.color} rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{column.title}</h3>
                  <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                    {columnTickets.length}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {columnTickets.map((ticket) => {
                  const slaRemaining = getSLATimeRemaining(ticket.slaDue);
                  const isBreach = isSLABreach(ticket.slaDue);
                  
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => onTicketSelect(ticket)}
                      className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
                          {ticket.subject}
                        </h4>
                        {isBreach && (
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {ticket.company && (
                        <div className="flex items-center text-xs text-gray-600 mb-2">
                          <Building className="h-3 w-3 mr-1" />
                          <span className="truncate">{ticket.company.companyName}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                        
                        <span className="text-xs text-gray-500 uppercase font-medium">
                          {ticket.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
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
                      
                      {slaRemaining && (
                        <div className={`mt-2 text-xs ${isBreach ? 'text-red-600' : 'text-orange-600'} flex items-center`}>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{slaRemaining}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {columnTickets.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">No tickets</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}