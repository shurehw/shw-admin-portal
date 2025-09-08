'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, Clock, AlertTriangle, User, Building, Package, FileText, 
  DollarSign, Tag, Eye, Send, Paperclip, MoreHorizontal, 
  ChevronDown, AlertCircle, CheckCircle, MessageSquare,
  Split, Merge, CreditCard, AlertOctagon, Timer, XCircle
} from 'lucide-react';

interface EnhancedTicketDrawerProps {
  ticket: any;
  onClose: () => void;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

// SLA Countdown Component
function SlaCountdown({ due, label }: { due: string; label: string }) {
  const [now, setNow] = useState(() => new Date());
  
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000); // Update every 30s
    return () => clearInterval(id);
  }, []);
  
  const mins = Math.max(0, Math.floor((new Date(due).getTime() - now.getTime()) / 60000));
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  const timeLabel = hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
  const isDanger = mins <= 30;
  const isWarning = mins <= 60;
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
      isDanger ? 'bg-red-100 text-red-700' : 
      isWarning ? 'bg-orange-100 text-orange-700' : 
      'bg-green-100 text-green-700'
    }`}>
      <Clock className="h-3 w-3" />
      <span>{label} in {timeLabel}</span>
    </div>
  );
}

// Ticket Composer Component
function TicketComposer({ ticketId, onSend }: { ticketId: string; onSend: (message: any) => void }) {
  const [mode, setMode] = useState<'public' | 'internal'>('public');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [sending, setSending] = useState(false);
  const [nextUpdate, setNextUpdate] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const macros = [
    { id: '1', name: 'Greeting', text: 'Hi {first_name},\n\nThank you for reaching out.' },
    { id: '2', name: 'Damage Intake', text: 'Please share photos of the damage and quantities affected.' },
    { id: '3', name: 'RMA Approval', text: 'Your RMA has been approved. RMA #{rma_number}' },
    { id: '4', name: 'Art Specs', text: 'Please provide artwork in vector format (AI, EPS, or PDF).' }
  ];

  async function handleSend(closeAfter = false) {
    if (!body.trim()) return;
    setSending(true);
    
    const message = {
      body,
      is_internal: mode === 'internal',
      attachments: files ? Array.from(files).map(f => ({ name: f.name, size: f.size })) : [],
      created_at: new Date().toISOString(),
      author_name: 'Current User'
    };
    
    onSend(message);
    
    if (closeAfter) {
      // Update ticket status to resolved
    }
    
    if (nextUpdate) {
      // Set next_update_at on ticket
    }
    
    setBody('');
    setFiles(null);
    setSending(false);
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Mode toggle and macros */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setMode('public')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'public' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Public Reply
        </button>
        <button
          onClick={() => setMode('internal')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mode === 'internal' 
              ? 'bg-yellow-100 text-yellow-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Internal Note
        </button>
        
        <select 
          onChange={e => {
            const macro = macros.find(m => m.id === e.target.value);
            if (macro) setBody(prev => prev + macro.text);
          }}
          className="ml-auto text-sm border rounded px-2 py-1"
        >
          <option value="">Insert macro...</option>
          {macros.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={mode === 'public' ? 'Type your reply to the customer...' : 'Add an internal note...'}
        onKeyDown={e => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            handleSend(false);
          }
          if (e.key === 'm' && !e.ctrlKey && !e.metaKey && e.target === textareaRef.current) {
            e.preventDefault();
            setMode(m => m === 'public' ? 'internal' : 'public');
          }
        }}
        className="w-full min-h-[100px] rounded-lg border border-gray-300 p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />

      {/* Actions bar */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            multiple 
            onChange={e => setFiles(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
            <Paperclip className="h-4 w-4" />
            Attach
          </label>
          
          <input
            type="datetime-local"
            value={nextUpdate}
            onChange={e => setNextUpdate(e.target.value)}
            className="text-sm border rounded px-2 py-1"
            placeholder="Next update"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleSend(false)}
            disabled={sending || !body.trim()}
            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
          <button
            onClick={() => handleSend(true)}
            disabled={sending || !body.trim()}
            className="px-4 py-1.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send & Close
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        Ctrl+Enter to send • M to toggle public/internal
      </div>
    </div>
  );
}

export default function EnhancedTicketDrawer({ 
  ticket, 
  onClose,
  getPriorityColor,
  getStatusColor 
}: EnhancedTicketDrawerProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'public' | 'internal' | 'events'>('all');
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Editable fields
  const [status, setStatus] = useState(ticket.status || 'new');
  const [priority, setPriority] = useState(ticket.priority || 'p3');
  const [assignee, setAssignee] = useState(ticket.assignee || 'Unassigned');
  const [type, setType] = useState(ticket.type || 'order_issue');
  
  useEffect(() => {
    loadTicketData();
  }, [ticket.id]);
  
  const loadTicketData = async () => {
    setLoading(true);
    
    // Mock data
    const mockMessages = [
      {
        id: '1',
        author_name: 'Customer',
        body: 'Order #1234 is missing 3 items from our shipment.',
        is_internal: false,
        created_at: '2024-01-15T10:30:00Z',
        attachments: []
      },
      {
        id: '2',
        author_name: 'John Smith',
        body: 'Checking with warehouse on stock levels.',
        is_internal: true,
        created_at: '2024-01-15T11:15:00Z',
        attachments: []
      },
      {
        id: '3',
        author_name: 'Support Agent',
        body: 'We found the missing items and will ship them today.',
        is_internal: false,
        created_at: '2024-01-15T14:20:00Z',
        attachments: [{ name: 'shipping_label.pdf', size: 125000 }]
      }
    ];
    
    const mockEvents = [
      { id: 'e1', kind: 'created', actor_name: 'System', created_at: '2024-01-15T10:30:00Z' },
      { id: 'e2', kind: 'assigned', actor_name: 'Manager', meta: { to: 'John Smith' }, created_at: '2024-01-15T10:35:00Z' },
      { id: 'e3', kind: 'priority_changed', actor_name: 'John Smith', meta: { from: 'p3', to: 'p2' }, created_at: '2024-01-15T11:00:00Z' }
    ];
    
    setMessages(mockMessages);
    setEvents(mockEvents);
    setLoading(false);
  };
  
  const handleAddMessage = (message: any) => {
    setMessages(prev => [...prev, { ...message, id: Date.now().toString() }]);
  };
  
  const combinedTimeline = [...messages, ...events].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const filteredTimeline = combinedTimeline.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'public') return 'body' in item && !item.is_internal;
    if (filter === 'internal') return 'body' in item && item.is_internal;
    if (filter === 'events') return 'kind' in item;
    return true;
  });

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[600px] bg-white shadow-2xl z-[9999] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white">
          <div className="p-4">
            {/* Title row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {ticket.subject}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                  <span>Ticket #{ticket.id?.slice(0, 8)}</span>
                  <span>•</span>
                  <Building className="h-3 w-3" />
                  <span>{ticket.company?.companyName || 'Marriott Hotels'}</span>
                  <span>•</span>
                  <span>📍 Chicago, IL</span>
                </div>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Inline selectors */}
            <div className="flex items-center gap-2 mb-3">
              <select 
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={`px-2 py-1 rounded text-xs font-medium border-0 ${getStatusColor(status)}`}
              >
                <option value="new">New</option>
                <option value="ack">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting on Customer</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={`px-2 py-1 rounded text-xs font-medium border-0 ${getPriorityColor(priority)}`}
              >
                <option value="p1">P1 - Critical</option>
                <option value="p2">P2 - High</option>
                <option value="p3">P3 - Normal</option>
                <option value="p4">P4 - Low</option>
              </select>
              
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 hover:bg-gray-200">
                <User className="h-3 w-3" />
                {assignee}
              </button>
            </div>
            
            {/* SLA countdown */}
            <div className="flex items-center gap-2 mb-3">
              {ticket.first_response_due && (
                <SlaCountdown due={ticket.first_response_due} label="First response" />
              )}
              {ticket.resolution_due && (
                <SlaCountdown due={ticket.resolution_due} label="Resolution" />
              )}
              {priority === 'p1' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                  <AlertOctagon className="h-3 w-3" />
                  P1 Alert Sent
                </div>
              )}
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                <Merge className="h-3 w-3" />
                Merge
              </button>
              <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                <Split className="h-3 w-3" />
                Split
              </button>
              <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                <Package className="h-3 w-3" />
                Convert to RMA
              </button>
              <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                <CreditCard className="h-3 w-3" />
                Credit Memo
              </button>
              <button className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900">
                <Timer className="h-3 w-3" />
                Snooze
              </button>
            </div>
          </div>
        </div>
        
        {/* Main content area with right rail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Timeline */}
          <div className="flex-1 flex flex-col">
            {/* Filter pills */}
            <div className="p-3 border-b bg-gray-50 flex items-center gap-2">
              {['all', 'public', 'internal', 'events'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === f 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Messages/Events */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                filteredTimeline.map(item => {
                  if ('body' in item) {
                    // Message
                    return (
                      <div key={item.id} className={`rounded-lg p-4 ${
                        item.is_internal ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.author_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              item.is_internal ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {item.is_internal ? 'Internal' : 'Reply'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.body}</p>
                        {item.attachments?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.attachments.map((att: any, i: number) => (
                              <div key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs">
                                <Paperclip className="h-3 w-3" />
                                {att.name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Event
                    return (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-2 h-2 bg-gray-300 rounded-full" />
                        <span>{item.actor_name}</span>
                        <span>{item.kind.replace('_', ' ')}</span>
                        {item.meta?.to && <span>to {item.meta.to}</span>}
                        {item.meta?.from && item.meta?.to && (
                          <span>from {item.meta.from} to {item.meta.to}</span>
                        )}
                        <span className="ml-auto">{new Date(item.created_at).toLocaleTimeString()}</span>
                      </div>
                    );
                  }
                })
              )}
            </div>
          </div>
          
          {/* Right rail */}
          <div className="w-64 border-l bg-gray-50 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold mb-3">Properties</h3>
            
            {/* Type */}
            <div className="mb-4">
              <label className="text-xs text-gray-500">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full mt-1 text-sm border rounded px-2 py-1"
              >
                <option value="order_issue">Order Issue</option>
                <option value="rma">RMA</option>
                <option value="damage">Damage</option>
                <option value="billing">Billing</option>
                <option value="custom_print">Custom Print</option>
                <option value="shipping">Shipping</option>
                <option value="quality">Quality</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Related entities */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-gray-500">Order</label>
                <div className="mt-1 flex items-center gap-1">
                  <Package className="h-3 w-3 text-gray-400" />
                  <a href="#" className="text-sm text-blue-600 hover:underline">#1234</a>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500">Invoice</label>
                <div className="mt-1 flex items-center gap-1">
                  <FileText className="h-3 w-3 text-gray-400" />
                  <a href="#" className="text-sm text-blue-600 hover:underline">INV-5678</a>
                </div>
              </div>
              
              <div>
                <label className="text-xs text-gray-500">PO Number</label>
                <div className="mt-1 flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-gray-400" />
                  <span className="text-sm">PO-90123</span>
                </div>
              </div>
            </div>
            
            {/* Tags */}
            <div className="mb-4">
              <label className="text-xs text-gray-500">Tags</label>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="px-2 py-1 bg-gray-200 rounded-full text-xs">VIP</span>
                <span className="px-2 py-1 bg-gray-200 rounded-full text-xs">Expedite</span>
                <button className="px-2 py-1 bg-gray-100 rounded-full text-xs hover:bg-gray-200">
                  + Add
                </button>
              </div>
            </div>
            
            {/* Followers */}
            <div className="mb-4">
              <label className="text-xs text-gray-500">Followers</label>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                    JS
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                    AB
                  </div>
                </div>
                <button className="text-xs text-blue-600 hover:underline">
                  + Add
                </button>
              </div>
            </div>
            
            {/* Outcomes (for resolved/closed) */}
            {(status === 'resolved' || status === 'closed') && (
              <div className="border-t pt-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2">Resolution</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-500">Resolution Code</label>
                    <select className="w-full mt-1 text-sm border rounded px-2 py-1">
                      <option>Replacement Sent</option>
                      <option>Credit Issued</option>
                      <option>RMA Processed</option>
                      <option>No Action Required</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Root Cause</label>
                    <input type="text" className="w-full mt-1 text-sm border rounded px-2 py-1" 
                           placeholder="e.g., Warehouse error" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Composer */}
        <TicketComposer ticketId={ticket.id} onSend={handleAddMessage} />
      </div>
    </>
  );
}