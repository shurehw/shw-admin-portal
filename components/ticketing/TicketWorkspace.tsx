'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Settings, Grid3X3, List, Clock, AlertTriangle,
  Users, User, Package, RotateCcw, DollarSign, Truck, Bug, ArrowUpDown
} from 'lucide-react';
import TicketList from './TicketList';
import TicketBoard from './TicketBoard';
import TicketDrawer from './EnhancedTicketDrawer';
import NewTicketModal from './NewTicketModal';

interface TicketView {
  id: string;
  name: string;
  filters: any;
  count?: number;
}

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

const DEFAULT_VIEWS: TicketView[] = [
  { id: 'my_open', name: 'My Open Tickets', filters: { assignedToMe: true, status: ['new', 'ack', 'in_progress'] } },
  { id: 'unassigned', name: 'Unassigned', filters: { ownerId: null, status: ['new', 'ack'] } },
  { id: 'breaching_2h', name: 'Breaching <2h', filters: { slaBreach: true } },
  { id: 'waiting_customer', name: 'Waiting on Customer', filters: { status: 'waiting_customer' } },
  { id: 'returns', name: 'Returns', filters: { type: 'return' } },
  { id: 'delivery_issues', name: 'Delivery Issues', filters: { type: 'delivery' } },
  { id: 'billing_issues', name: 'Billing Issues', filters: { type: 'billing' } }
];

export default function TicketWorkspace() {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [selectedView, setSelectedView] = useState<TicketView>(DEFAULT_VIEWS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, [selectedView, searchTerm]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockTickets: Ticket[] = [
        {
          id: '1',
          subject: 'Order #1234 missing items',
          status: 'new',
          priority: 'high',
          type: 'delivery',
          company: { companyName: 'Marriott Hotels' },
          createdAt: '2024-01-15T10:30:00Z',
          slaDue: '2024-01-15T12:30:00Z',
          _count: { messages: 1, watchers: 0 }
        },
        {
          id: '2',
          subject: 'Invoice discrepancy for December order',
          status: 'ack',
          priority: 'normal',
          type: 'billing',
          company: { companyName: 'Hilton Worldwide' },
          createdAt: '2024-01-15T09:15:00Z',
          _count: { messages: 3, watchers: 2 }
        },
        {
          id: '3',
          subject: 'Request for custom logo placement',
          status: 'in_progress',
          priority: 'low',
          type: 'support',
          company: { companyName: 'Local Restaurant Group' },
          createdAt: '2024-01-14T16:45:00Z',
          _count: { messages: 5, watchers: 1 }
        },
        {
          id: '4',
          subject: 'Return authorization needed for damaged goods',
          status: 'waiting_customer',
          priority: 'normal',
          type: 'return',
          company: { companyName: 'Boutique Hotel Chain' },
          createdAt: '2024-01-14T14:20:00Z',
          _count: { messages: 4, watchers: 1 }
        }
      ];

      // Filter based on selected view and search
      let filteredTickets = mockTickets;
      
      if (searchTerm) {
        filteredTickets = filteredTickets.filter(ticket =>
          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.company?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTickets(filteredTickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleTicketClose = () => {
    setSelectedTicket(null);
  };

  const getViewIcon = (viewId: string) => {
    switch (viewId) {
      case 'my_open': return User;
      case 'unassigned': return Users;
      case 'breaching_2h': return AlertTriangle;
      case 'waiting_customer': return Clock;
      case 'returns': return RotateCcw;
      case 'delivery_issues': return Truck;
      case 'billing_issues': return DollarSign;
      default: return Package;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-purple-600 bg-purple-100';
      case 'ack': return 'text-blue-600 bg-blue-100';
      case 'in_progress': return 'text-yellow-600 bg-yellow-100';
      case 'waiting_customer': return 'text-orange-600 bg-orange-100';
      case 'closed': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Views */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Support Tickets</h2>
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="New Ticket"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Views */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {DEFAULT_VIEWS.map((view) => {
                const Icon = getViewIcon(view.id);
                const isSelected = selectedView.id === view.id;
                
                return (
                  <button
                    key={view.id}
                    onClick={() => setSelectedView(view)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-3" />
                      <span>{view.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {view.count || tickets.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <a 
            href="/admin/support/settings"
            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            <Settings className="h-4 w-4 mr-3" />
            Ticket Settings
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-900">{selectedView.name}</h3>
              <span className="ml-3 text-sm text-gray-500">{tickets.length} tickets</span>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('board')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Board View"
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>

              <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg" title="Sort">
                <ArrowUpDown className="h-4 w-4" />
              </button>
              
              <button className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg" title="Filter">
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Ticket Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'list' ? (
            <TicketList
              tickets={tickets}
              loading={loading}
              onTicketSelect={handleTicketSelect}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          ) : (
            <TicketBoard
              tickets={tickets}
              loading={loading}
              onTicketSelect={handleTicketSelect}
              getPriorityColor={getPriorityColor}
              getStatusColor={getStatusColor}
            />
          )}
        </div>
      </div>

      {/* Ticket Drawer - Renders as overlay */}
      {selectedTicket && (
        <TicketDrawer
          ticket={selectedTicket}
          onClose={handleTicketClose}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
        />
      )}

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <NewTicketModal
          onClose={() => setShowNewTicketModal(false)}
          onTicketCreated={(newTicket) => {
            setTickets(prev => [newTicket, ...prev]);
            setShowNewTicketModal(false);
          }}
        />
      )}
    </div>
  );
}