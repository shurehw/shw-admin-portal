/**
 * Supabase Ticketing API Client
 * Handles all ticketing operations using Supabase
 */

import { supabase } from '../supabase';

// Types
export interface Ticket {
  id: string;
  ticket_number: number;
  org_id: string;
  company_id?: string;
  contact_id?: string;
  order_id?: string;
  subject: string;
  description?: string;
  status: string;
  priority: string;
  type: string;
  channel: string;
  team?: string;
  owner_id?: string;
  owner_name?: string;
  sla_due?: string;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  tags?: string[];
  custom_fields?: any;
  metadata?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  kind: 'public_reply' | 'internal_note';
  body: string;
  html_body?: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  author_type?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
}

export interface TicketFilters {
  company_id?: string;
  contact_id?: string;
  status?: string | string[];
  priority?: string | string[];
  type?: string | string[];
  team?: string;
  owner_id?: string;
  search?: string;
}

export interface TicketCreateInput {
  org_id: string;
  subject: string;
  description?: string;
  company_id?: string;
  contact_id?: string;
  order_id?: string;
  priority?: string;
  type?: string;
  team?: string;
  owner_id?: string;
  tags?: string[];
  custom_fields?: any;
}

export interface MessageCreateInput {
  ticket_id: string;
  kind: 'public_reply' | 'internal_note';
  body: string;
  html_body?: string;
  author_id?: string;
  author_name?: string;
  author_email?: string;
  attachments?: any[];
}

class SupabaseTicketingClient {
  /**
   * Create a new ticket
   */
  async createTicket(data: TicketCreateInput): Promise<Ticket> {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        ...data,
        status: 'new',
        channel: 'portal',
        priority: data.priority || 'normal',
        type: data.type || 'general_inquiry'
      })
      .select()
      .single();

    if (error) throw error;
    return ticket;
  }

  /**
   * Get tickets with filters
   */
  async getTickets(filters: TicketFilters & { 
    page?: number; 
    limit?: number; 
    sort?: string;
  } = {}): Promise<{
    tickets: Ticket[];
    total: number;
  }> {
    const { 
      page = 1, 
      limit = 25, 
      sort = '-created_at',
      ...queryFilters 
    } = filters;

    let query = supabase.from('tickets').select('*', { count: 'exact' });

    // Apply filters
    if (queryFilters.company_id) {
      query = query.eq('company_id', queryFilters.company_id);
    }
    if (queryFilters.contact_id) {
      query = query.eq('contact_id', queryFilters.contact_id);
    }
    if (queryFilters.status) {
      if (Array.isArray(queryFilters.status)) {
        query = query.in('status', queryFilters.status);
      } else {
        query = query.eq('status', queryFilters.status);
      }
    }
    if (queryFilters.priority) {
      if (Array.isArray(queryFilters.priority)) {
        query = query.in('priority', queryFilters.priority);
      } else {
        query = query.eq('priority', queryFilters.priority);
      }
    }
    if (queryFilters.team) {
      query = query.eq('team', queryFilters.team);
    }
    if (queryFilters.owner_id) {
      query = query.eq('owner_id', queryFilters.owner_id);
    }
    if (queryFilters.search) {
      query = query.or(`subject.ilike.%${queryFilters.search}%,description.ilike.%${queryFilters.search}%`);
    }

    // Sorting
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Pagination
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data: tickets, error, count } = await query;

    if (error) throw error;

    return {
      tickets: tickets || [],
      total: count || 0
    };
  }

  /**
   * Get single ticket by ID
   */
  async getTicket(ticketId: string): Promise<Ticket | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return data;
  }

  /**
   * Update ticket
   */
  async updateTicket(ticketId: string, updates: Partial<Ticket>): Promise<Ticket> {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete ticket
   */
  async deleteTicket(ticketId: string): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);

    if (error) throw error;
  }

  /**
   * Get ticket messages
   */
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add message to ticket
   */
  async addTicketMessage(data: MessageCreateInput): Promise<TicketMessage> {
    const { data: message, error } = await supabase
      .from('ticket_messages')
      .insert(data)
      .select()
      .single();

    if (error) throw error;

    // Update ticket's updated_at
    await this.updateTicket(data.ticket_id, {
      updated_at: new Date().toISOString()
    });

    return message;
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(filters: {
    company_id?: string;
    contact_id?: string;
  } = {}): Promise<{
    total: number;
    open: number;
    closed: number;
    breaching: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    let query = supabase.from('tickets').select('status, priority, sla_due', { count: 'exact' });

    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    if (filters.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }

    const { data: tickets, error, count } = await query;

    if (error) throw error;

    const now = new Date();
    const stats = {
      total: count || 0,
      open: 0,
      closed: 0,
      breaching: 0,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    tickets?.forEach(ticket => {
      // Status counts
      stats.byStatus[ticket.status] = (stats.byStatus[ticket.status] || 0) + 1;
      
      // Priority counts
      stats.byPriority[ticket.priority] = (stats.byPriority[ticket.priority] || 0) + 1;
      
      // Open vs Closed
      if (['closed', 'resolved'].includes(ticket.status)) {
        stats.closed++;
      } else {
        stats.open++;
      }
      
      // Breaching SLA
      if (ticket.sla_due && new Date(ticket.sla_due) < now) {
        stats.breaching++;
      }
    });

    return stats;
  }

  /**
   * Watch/unwatch ticket
   */
  async watchTicket(ticketId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ticket_watchers')
      .upsert({
        ticket_id: ticketId,
        user_id: userId
      });

    if (error) throw error;
  }

  async unwatchTicket(ticketId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('ticket_watchers')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Get ticket watchers
   */
  async getTicketWatchers(ticketId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('ticket_watchers')
      .select('user_id')
      .eq('ticket_id', ticketId);

    if (error) throw error;
    return data?.map(w => w.user_id) || [];
  }

  /**
   * Search tickets
   */
  async searchTickets(query: string, limit: number = 10): Promise<Ticket[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .or(`subject.ilike.%${query}%,description.ilike.%${query}%,ticket_number.eq.${parseInt(query) || 0}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Bulk update tickets
   */
  async bulkUpdateTickets(ticketIds: string[], updates: Partial<Ticket>): Promise<void> {
    const { error } = await supabase
      .from('tickets')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .in('id', ticketIds);

    if (error) throw error;
  }

  /**
   * Get saved views
   */
  async getSavedViews(userId?: string, team?: string): Promise<any[]> {
    let query = supabase.from('saved_views').select('*');

    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    }
    if (team) {
      query = query.or(`team.eq.${team},team.is.null`);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create saved view
   */
  async createSavedView(view: {
    name: string;
    filters: any;
    user_id?: string;
    team?: string;
    is_public?: boolean;
  }): Promise<any> {
    const { data, error } = await supabase
      .from('saved_views')
      .insert(view)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get ticket types
   */
  async getTicketTypes(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_types')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get ticket statuses
   */
  async getTicketStatuses(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ticket_statuses')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get SLA policies
   */
  async getSlaPolicies(): Promise<any[]> {
    const { data, error } = await supabase
      .from('sla_policies')
      .select('*')
      .eq('is_active', true)
      .order('priority');

    if (error) throw error;
    return data || [];
  }
}

// Export singleton instance
export const ticketingClient = new SupabaseTicketingClient();

// Export for use in components
export default ticketingClient;