'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SimpleTicketDrawerProps {
  ticket: any;
  onClose: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export default function SimpleTicketDrawer({ 
  ticket, 
  onClose,
  getPriorityColor,
  getStatusColor 
}: SimpleTicketDrawerProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load messages when ticket changes
    const loadMessages = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Set mock messages
      const mockMessages = [
        {
          id: '1',
          createdBy: 'Customer Service',
          body: 'Hello! We received your order and noticed that some items are missing from the shipment. We sincerely apologize for this inconvenience.',
          type: 'reply',
          createdAt: '2024-01-15T10:30:00Z'
        },
        {
          id: '2', 
          createdBy: 'John Smith',
          body: 'Checked with warehouse - items were left out due to stock shortage. Need to expedite replacement shipment.',
          type: 'internal',
          createdAt: '2024-01-15T11:15:00Z'
        },
        {
          id: '3',
          createdBy: 'Sarah Johnson',
          body: 'We have identified the missing items and will ship them out today via expedited shipping. You should receive them by tomorrow. Tracking number: 1Z999AA1012345675',
          type: 'reply',
          createdAt: '2024-01-15T14:20:00Z'
        }
      ];
      
      setMessages(mockMessages);
      setLoading(false);
    };

    loadMessages();
  }, [ticket.id]);
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl"
        style={{ zIndex: 9999 }}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex justify-between items-start">
            <h2 className="font-bold text-lg">{ticket.subject}</h2>
            <button onClick={onClose} className="p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
              {ticket.priority}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 200px)' }}>
          <h3 className="font-bold mb-4">
            Conversation History {messages.length > 0 && `(${messages.length})`}
          </h3>
          
          {loading ? (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className="mb-4 p-3 bg-gray-100 rounded">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-sm">{msg.createdBy}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    msg.type === 'internal' ? 'bg-yellow-200' : 'bg-blue-200'
                  }`}>
                    {msg.type === 'internal' ? 'Internal' : 'Reply'}
                  </span>
                </div>
                <p className="text-sm">{msg.body}</p>
                {msg.createdAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Simple reply box */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <textarea 
            className="w-full p-2 border rounded" 
            rows={3}
            placeholder="Type reply..."
          />
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded text-sm">
            Send
          </button>
        </div>
      </div>
    </>
  );
}