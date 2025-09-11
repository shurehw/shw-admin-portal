'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  User, Building2, Phone, Mail, Calendar, MessageSquare,
  FileText, DollarSign, MapPin, Clock, CheckCircle2,
  AlertCircle, TrendingUp, Edit2, Plus, Filter, Search,
  ChevronRight, Star, Activity, Paperclip, Video,
  Globe, Github, Linkedin, Twitter, ExternalLink,
  Tag, BarChart3, Target, Users, Handshake
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  phone: string;
  lastContact: Date;
  status: 'active' | 'inactive' | 'prospect';
}

interface TimelineEvent {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'deal' | 'task' | 'quote';
  title: string;
  description: string;
  date: Date;
  outcome?: string;
  attachments?: string[];
  relatedDeals?: string[];
}

function TimelineContent() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get('contactId') || '';
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'summary'>('timeline');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data for demonstration
    setContact({
      id: '1',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@restaurant.com',
      company: 'Smith\'s Steakhouse',
      position: 'Owner',
      phone: '(555) 123-4567',
      lastContact: new Date(),
      status: 'active'
    });

    setTimelineEvents([
      {
        id: '1',
        type: 'call',
        title: 'Initial outreach call',
        description: 'Discussed their current beverage program and pricing concerns',
        date: new Date('2024-01-15'),
        outcome: 'Interested in wine selection'
      },
      {
        id: '2',
        type: 'email',
        title: 'Sent wine catalog',
        description: 'Shared our premium wine selection with pricing',
        date: new Date('2024-01-16'),
      },
      {
        id: '3',
        type: 'meeting',
        title: 'In-person meeting',
        description: 'Wine tasting session at the restaurant',
        date: new Date('2024-01-20'),
        outcome: 'Selected 12 wines for trial'
      }
    ]);
    
    setLoading(false);
  }, [contactId]);

  const filteredEvents = timelineEvents.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (searchTerm && !event.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !event.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      
    );
  }

  return (
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Timeline</h1>
              <p className="text-gray-600">
                {contact ? `${contact.firstName} ${contact.lastName} - ${contact.company}` : 'Contact not found'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('timeline')}
                  className={`px-3 py-1 text-sm rounded ${viewMode === 'timeline' ? 'bg-white shadow' : ''}`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-3 py-1 text-sm rounded ${viewMode === 'summary' ? 'bg-white shadow' : ''}`}
                >
                  Summary
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search timeline events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All Events</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="meeting">Meetings</option>
              <option value="note">Notes</option>
              <option value="deal">Deals</option>
            </select>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="space-y-6">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {index !== filteredEvents.length - 1 && (
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
                  )}
                  <div className="flex">
                    <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      {event.type === 'call' && <Phone className="h-5 w-5 text-blue-600" />}
                      {event.type === 'email' && <Mail className="h-5 w-5 text-blue-600" />}
                      {event.type === 'meeting' && <Calendar className="h-5 w-5 text-blue-600" />}
                      {event.type === 'note' && <FileText className="h-5 w-5 text-blue-600" />}
                      {event.type === 'deal' && <DollarSign className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                        <span className="text-sm text-gray-500">{event.date.toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 mt-1">{event.description}</p>
                      {event.outcome && (
                        <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {event.outcome}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your filters or search term'
                      : 'Start by adding your first interaction with this contact'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TimelineContent />
    </Suspense>
  );
}