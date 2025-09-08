import { useEffect, useState } from 'react';
import type { TimelineEvent } from '@/types/orders';
import { kindIcon, prettyStatus } from '@/utils/status';

const fmt = (iso?: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function UnifiedTimeline({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    // Refresh every 15 seconds for live updates
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, [orderId]);

  async function fetchEvents() {
    try {
      const res = await fetch(`/api/orders/${orderId}/events`);
      if (!res.ok) throw new Error('Failed to load timeline');
      const data = await res.json();
      setEvents(data.events || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading && events.length === 0) {
    return <div className="text-sm text-gray-500">Loading timeline...</div>;
  }

  if (error) {
    return <div className="text-red-700 text-sm">Failed to load timeline</div>;
  }

  if (events.length === 0) {
    return <div className="text-sm text-gray-500">No events yet.</div>;
  }

  return (
    <ol className="relative border-l border-gray-300 pl-6 space-y-4">
      {events.map(e => (
        <li key={e.id} className="ml-1">
          <div className="absolute -left-3 w-6 h-6 rounded-full flex items-center justify-center border border-gray-300 bg-white">
            <span className="text-xs">{kindIcon[e.kind] || '•'}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-gray-900">{e.label}</p>
              <span className="text-xs text-gray-500">{fmt(e.ts)}</span>
            </div>
            {e.note && <p className="text-sm text-gray-600 mt-1">{e.note}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span>Source: {e.source}</span>
              {e.status && <span>→ {prettyStatus(e.status)}</span>}
              {e.eta && <span>ETA: {fmt(e.eta)}</span>}
              {e.link && (
                <a 
                  href={e.link} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Details
                </a>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}