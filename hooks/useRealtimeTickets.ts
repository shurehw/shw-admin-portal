import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Ticket } from '@/lib/ticketing/supabase-client';

export function useRealtimeTickets(initialTickets: Ticket[] = []) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);

  useEffect(() => {
    // Subscribe to INSERT events
    const channel = supabase
      .channel('tickets-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('New ticket:', payload.new);
          setTickets(prev => [payload.new as Ticket, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('Updated ticket:', payload.new);
          setTickets(prev => 
            prev.map(t => t.id === payload.new.id ? payload.new as Ticket : t)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tickets'
        },
        (payload) => {
          console.log('Deleted ticket:', payload.old);
          setTickets(prev => prev.filter(t => t.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return tickets;
}

// Usage in component:
// const tickets = useRealtimeTickets(initialTickets);