'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, User, Building, Calendar, Clock, MessageSquare, Eye, Plus, 
  Send, Paperclip, MoreHorizontal, Edit, ExternalLink, AlertTriangle,
  Package, FileText, Truck
} from 'lucide-react';

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

interface TicketMessage {
  id: string;
  kind: string;
  body: string;
  createdBy: string;
  createdAt: string;
  channel: string;
}

interface TicketDrawerProps {
  ticket: Ticket;
  onClose: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export default function TicketDrawer({ 
  ticket, 
  onClose, 
  getPriorityColor, 
  getStatusColor 
}: TicketDrawerProps) {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'public_reply' | 'internal_note'>('public_reply');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log('TicketDrawer mounted');
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    console.log('Ticket changed, fetching messages for ticket:', ticket.id);
    fetchMessages();
  }, [ticket.id]);

  const fetchMessages = async () => {
    console.log('fetchMessages called');
    setLoading(true);
    try {
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock data - replace with actual API call
      const mockMessages: TicketMessage[] = [
        {
          id: '1',
          kind: 'public_reply',
          body: 'Hello! We received your order and noticed that some items are missing from the shipment. We sincerely apologize for this inconvenience.',
          createdBy: 'Customer Service',
          createdAt: '2024-01-15T10:30:00Z',
          channel: 'email'
        },
        {
          id: '2',
          kind: 'internal_note',
          body: 'Checked with warehouse - items were left out due to stock shortage. Need to expedite replacement shipment.',
          createdBy: 'John Smith',
          createdAt: '2024-01-15T11:15:00Z',
          channel: 'internal'
        },
        {
          id: '3',
          kind: 'public_reply',
          body: 'We have identified the missing items and will ship them out today via expedited shipping. You should receive them by tomorrow. Tracking number: 1Z999AA1012345675',
          createdBy: 'Sarah Johnson',
          createdAt: '2024-01-15T14:20:00Z',
          channel: 'email'
        }
      ];
      
      console.log('Setting messages:', mockMessages);
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Mock sending message
      const newMsg: TicketMessage = {
        id: Date.now().toString(),
        kind: messageType,
        body: newMessage,
        createdBy: 'Current User',
        createdAt: new Date().toISOString(),
        channel: messageType === 'public_reply' ? 'email' : 'internal'
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTicketClose = () => {
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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
      return `Overdue by ${Math.abs(Math.floor(diffInMinutes / 60))}h ${Math.abs(diffInMinutes % 60)}m`;
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m left`;
    } else {
      return `${Math.floor(diffInMinutes / 60)}h ${diffInMinutes % 60}m left`;
    }
  };

  const getRelatedIcon = (type: string) => {
    switch (type) {
      case 'order': return Package;
      case 'quote': return FileText;
      case 'delivery': return Truck;
      default: return Package;
    }
  };

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="fixed right-0 top-0 h-screen w-[480px] bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
              {ticket.subject}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="flex items-center space-x-2 mb-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
            </span>
            
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </span>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 uppercase">
              {ticket.type}
            </span>
          </div>

          {/* SLA Status */}
          {ticket.slaDue && (
            <div className={`flex items-center text-sm mb-3 ${
              isSLABreach(ticket.slaDue) ? 'text-red-600' : 'text-orange-600'
            }`}>
              <Clock className="h-4 w-4 mr-2" />
              <span>{getSLATimeRemaining(ticket.slaDue)}</span>
              {isSLABreach(ticket.slaDue) && <AlertTriangle className="h-4 w-4 ml-2" />}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <button className="flex-1 bg-blue-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Assign to Me
            </button>
            <button className="bg-gray-100 text-gray-700 text-sm px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Ticket Info */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {ticket.company && (
            <div className="flex items-center">
              <Building className="h-4 w-4 text-gray-400 mr-3" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{ticket.company.companyName}</span>
                <button className="ml-2 text-blue-600 hover:text-blue-800">
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-400 mr-3" />
            <span className="text-sm text-gray-600">Created {formatDate(ticket.createdAt)}</span>
          </div>

          <div className="flex items-center">
            <User className="h-4 w-4 text-gray-400 mr-3" />
            <span className="text-sm text-gray-600">Unassigned</span>
            <button className="ml-auto text-sm text-blue-600 hover:underline">
              Assign
            </button>
          </div>

          {/* Related Items */}
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Related</h4>
            <div className="flex items-center">
              <Package className="h-4 w-4 text-gray-400 mr-2" />
              <button className="text-sm text-blue-600 hover:underline">
                Order #1234
              </button>
            </div>
          </div>
        </div>

        {/* Messages Timeline */}
        <div className="flex-1 min-h-0 bg-white border-t-2 border-gray-200">
          <div className="h-full flex flex-col">
            <div className="px-4 pt-4 pb-2 bg-gray-50 border-b">
              <h3 className="text-sm font-semibold text-gray-900">Conversation History ({messages.length} messages)</h3>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50">
              {/* Always show messages if they exist, regardless of loading state */}
              {messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="bg-white rounded-lg p-4 shadow border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-gray-900">{message.createdBy}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          message.kind === 'internal_note' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {message.kind === 'internal_note' ? 'Internal' : 'Customer'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.body}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading messages...</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                </div>
              )}
              
            </div>
          </div>
        </div>

        {/* Message Composer */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-2 mb-3">
            <button
              onClick={() => setMessageType('public_reply')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                messageType === 'public_reply'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Public Reply
            </button>
            <button
              onClick={() => setMessageType('internal_note')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                messageType === 'internal_note'
                  ? 'bg-yellow-100 text-yellow-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Internal Note
            </button>
          </div>

          <div className="relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                messageType === 'public_reply' 
                  ? 'Type your reply to the customer...' 
                  : 'Add an internal note...'
              }
              className="w-full p-3 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            
            <div className="flex items-center justify-between mt-3">
              <button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                <Paperclip className="h-4 w-4 mr-1" />
                Attach
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Use portal to render outside of normal DOM hierarchy
  if (!mounted) return null;
  
  return createPortal(
    drawerContent,
    document.body
  );
}