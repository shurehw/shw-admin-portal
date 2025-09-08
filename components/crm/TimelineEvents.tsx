'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw, Calendar, User, MessageSquare } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

interface TimelineEvent {
  id: string;
  entityType: 'company' | 'contact';
  entityId: string;
  eventType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  icon: string;
  metadata: {
    ticketId?: string;
    ticketSubject?: string;
    ticketStatus?: string;
    ticketPriority?: string;
    originalEventType?: string;
    actionUrl?: string;
    [key: string]: any;
  };
  timestamp: Date;
  createdAt: Date;
  createdBy: string;
}

interface TimelineEventsProps {
  entityType: 'company' | 'contact';
  entityId: string;
  maxItems?: number;
}

export default function TimelineEvents({ 
  entityType, 
  entityId, 
  maxItems = 10 
}: TimelineEventsProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimelineEvents();
  }, [entityType, entityId]);

  const loadTimelineEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const timelineQuery = query(
        collection(db, 'crm_timeline_events'),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        orderBy('timestamp', 'desc'),
        limit(maxItems)
      );

      const querySnapshot = await getDocs(timelineQuery);
      const loadedEvents: TimelineEvent[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        loadedEvents.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date()
        } as TimelineEvent);
      });

      setEvents(loadedEvents);
    } catch (err: any) {
      console.error('Error loading timeline events:', err);
      setError('Failed to load timeline events');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleActionClick = (actionUrl: string) => {
    if (actionUrl.startsWith('/admin/tickets')) {
      // Open in new tab for ticket links
      const fullUrl = `${window.location.origin}${actionUrl}`;
      window.open(fullUrl, '_blank');
    } else {
      // Navigate normally for other links
      window.location.href = actionUrl;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-red-500 text-sm mb-2">{error}</div>
        <button
          onClick={loadTimelineEvents}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center space-x-1 mx-auto"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Timeline line */}
          {index < events.length - 1 && (
            <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200"></div>
          )}
          
          <div className="flex space-x-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${getPriorityColor(event.priority)}`}>
              <span>{event.icon}</span>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {event.title}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.description}
                  </p>
                  
                  {/* Metadata chips */}
                  {event.metadata.ticketStatus && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {event.metadata.ticketStatus.replace('_', ' ')}
                      </span>
                      {event.metadata.ticketPriority && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                          {event.metadata.ticketPriority} priority
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Action button */}
                {event.metadata.actionUrl && (
                  <button
                    onClick={() => handleActionClick(event.metadata.actionUrl!)}
                    className="ml-2 text-blue-600 hover:text-blue-800 flex-shrink-0"
                    title="View ticket"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Timestamp and user */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatRelativeTime(event.timestamp)}</span>
                </div>
                {event.createdBy && event.createdBy !== 'system' && (
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{event.createdBy}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {events.length === maxItems && (
        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View more activity →
          </button>
        </div>
      )}
    </div>
  );
}