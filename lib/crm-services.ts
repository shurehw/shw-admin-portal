import { supabaseDb as db } from './supabase';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'manager' | 'sales' | 'cs' | 'readonly';
  team_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: 'email_in' | 'email_out' | 'call' | 'sms_in' | 'sms_out' | 'meeting' | 'note' | 'event';
  subject: string;
  body?: string;
  direction?: 'in' | 'out';
  related_contact_id?: string;
  related_company_id?: string;
  created_by?: string;
  external_refs: any;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact_name?: string;
  contact_email?: string;
  company_name?: string;
  created_by_name?: string;
}

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'open' | 'in_progress' | 'waiting' | 'done';
  priority: 'low' | 'normal' | 'high';
  due_date?: string;
  completed_at?: string;
  owner_id?: string;
  related_contact_id?: string;
  related_company_id?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  contact_name?: string;
  company_name?: string;
  owner_name?: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: 'new' | 'qualified' | 'proposal' | 'verbal' | 'closed_won' | 'closed_lost';
  amount?: number;
  probability: number;
  close_date?: string;
  company_id: string;
  primary_contact_id?: string;
  owner_id?: string;
  props: any;
  created_at: string;
  updated_at: string;
  // Joined fields
  company_name?: string;
  primary_contact_name?: string;
  owner_name?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  body?: string;
  type: 'support' | 'delivery' | 'billing' | 'quality' | 'other';
  status: 'new' | 'ack' | 'in_progress' | 'waiting_customer' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  sla_due?: string;
  first_response_at?: string;
  company_id?: string;
  contact_id?: string;
  owner_id?: string;
  external_refs: any;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  // Joined fields
  company_name?: string;
  contact_name?: string;
  owner_name?: string;
}

export interface TargetList {
  id: string;
  name: string;
  entity: 'company' | 'contact';
  definition: any; // JSON filter tree
  is_smart: boolean;
  owner_id?: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  // Computed fields
  count?: number;
  owner_name?: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id?: string;
  entity: string;
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'merge';
  before_data?: any;
  after_data?: any;
  at: string;
  // Joined fields
  actor_name?: string;
}

// =====================================================
// ACTIVITY SERVICE
// =====================================================

export class ActivityService {
  static async getAll(filters: {
    contact_id?: string;
    company_id?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<Activity[]> {
    let query = db.from('recent_activities').select('*');

    if (filters.contact_id) {
      query = query.eq('related_contact_id', filters.contact_id);
    }
    if (filters.company_id) {
      query = query.eq('related_company_id', filters.company_id);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    query = query.limit(filters.limit || 50);
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async create(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await db
      .from('activities')
      .insert([activity])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<Activity>): Promise<Activity> {
    const { data, error } = await db
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await db
      .from('activities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// =====================================================
// TASK SERVICE
// =====================================================

export class TaskService {
  static async getAll(filters: {
    owner_id?: string;
    status?: string;
    due_date?: string;
    contact_id?: string;
    company_id?: string;
    overdue_only?: boolean;
  } = {}): Promise<Task[]> {
    let query = db
      .from('tasks')
      .select(`
        *,
        contact:contacts(first_name, last_name),
        company:companies(name),
        owner:users(first_name, last_name)
      `);

    if (filters.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.contact_id) {
      query = query.eq('related_contact_id', filters.contact_id);
    }
    if (filters.company_id) {
      query = query.eq('related_company_id', filters.company_id);
    }
    if (filters.overdue_only) {
      query = query.lt('due_date', new Date().toISOString().split('T')[0]);
      query = query.neq('status', 'done');
    }

    const { data, error } = await query.order('due_date', { ascending: true, nullsLast: true });
    if (error) throw error;

    // Transform joined data
    return (data || []).map(task => ({
      ...task,
      contact_name: task.contact ? `${task.contact.first_name || ''} ${task.contact.last_name || ''}`.trim() : undefined,
      company_name: task.company?.name,
      owner_name: task.owner ? `${task.owner.first_name || ''} ${task.owner.last_name || ''}`.trim() : undefined,
    }));
  }

  static async create(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const { data, error } = await db
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await db
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await db
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Task macros for common patterns
  static async createCallbackTask(
    relatedEntityId: string,
    entityType: 'contact' | 'company',
    days: number = 3,
    ownerId?: string
  ): Promise<Task> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const task = {
      title: `${days}-day callback`,
      notes: `Follow up call scheduled`,
      priority: 'normal' as const,
      due_date: dueDate.toISOString().split('T')[0],
      owner_id: ownerId,
      ...(entityType === 'contact' 
        ? { related_contact_id: relatedEntityId }
        : { related_company_id: relatedEntityId }
      )
    };

    return this.create(task);
  }
}

// =====================================================
// DEAL SERVICE
// =====================================================

export class DealService {
  static async getAll(filters: {
    stage?: string;
    owner_id?: string;
    company_id?: string;
    close_date_from?: string;
    close_date_to?: string;
  } = {}): Promise<Deal[]> {
    let query = db.from('deal_pipeline').select('*');

    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    if (filters.close_date_from) {
      query = query.gte('close_date', filters.close_date_from);
    }
    if (filters.close_date_to) {
      query = query.lte('close_date', filters.close_date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async create(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>): Promise<Deal> {
    const { data, error } = await db
      .from('deals')
      .insert([deal])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<Deal>): Promise<Deal> {
    const { data, error } = await db
      .from('deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await db
      .from('deals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Pipeline analytics
  static async getPipelineStats(): Promise<{
    stage: string;
    count: number;
    total_amount: number;
  }[]> {
    const { data, error } = await db
      .from('deals')
      .select('stage, amount')
      .not('stage', 'in', '(closed_won,closed_lost)');

    if (error) throw error;

    // Group by stage
    const stats = (data || []).reduce((acc, deal) => {
      const stage = deal.stage;
      if (!acc[stage]) {
        acc[stage] = { stage, count: 0, total_amount: 0 };
      }
      acc[stage].count++;
      acc[stage].total_amount += deal.amount || 0;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(stats);
  }
}

// =====================================================
// TICKET SERVICE  
// =====================================================

export class TicketService {
  static async getAll(filters: {
    status?: string;
    priority?: string;
    owner_id?: string;
    company_id?: string;
    contact_id?: string;
    overdue_sla?: boolean;
  } = {}): Promise<Ticket[]> {
    let query = db
      .from('tickets')
      .select(`
        *,
        company:companies(name),
        contact:contacts(first_name, last_name),
        owner:users(first_name, last_name)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }
    if (filters.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }
    if (filters.overdue_sla) {
      query = query.lt('sla_due', new Date().toISOString());
      query = query.neq('status', 'closed');
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Transform joined data
    return (data || []).map(ticket => ({
      ...ticket,
      company_name: ticket.company?.name,
      contact_name: ticket.contact ? `${ticket.contact.first_name || ''} ${ticket.contact.last_name || ''}`.trim() : undefined,
      owner_name: ticket.owner ? `${ticket.owner.first_name || ''} ${ticket.owner.last_name || ''}`.trim() : undefined,
    }));
  }

  static async create(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Promise<Ticket> {
    // Auto-set SLA due date based on priority
    const sla_hours = {
      'urgent': 2,
      'high': 8,
      'normal': 24,
      'low': 72
    };

    const sla_due = new Date();
    sla_due.setHours(sla_due.getHours() + sla_hours[ticket.priority]);

    const ticketWithSLA = {
      ...ticket,
      sla_due: sla_due.toISOString()
    };

    const { data, error } = await db
      .from('tickets')
      .insert([ticketWithSLA])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<Ticket>): Promise<Ticket> {
    const { data, error } = await db
      .from('tickets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await db
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

// =====================================================
// TARGET LIST SERVICE
// =====================================================

export class TargetListService {
  static async getAll(): Promise<TargetList[]> {
    const { data, error } = await db
      .from('target_lists')
      .select(`
        *,
        owner:users(first_name, last_name)
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(list => ({
      ...list,
      owner_name: list.owner ? `${list.owner.first_name || ''} ${list.owner.last_name || ''}`.trim() : undefined,
    }));
  }

  static async create(targetList: Omit<TargetList, 'id' | 'created_at' | 'updated_at'>): Promise<TargetList> {
    const { data, error } = await db
      .from('target_lists')
      .insert([targetList])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, updates: Partial<TargetList>): Promise<TargetList> {
    const { data, error } = await db
      .from('target_lists')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await db
      .from('target_lists')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Execute target list query to get matching records
  static async execute(targetList: TargetList): Promise<any[]> {
    // This would implement the filter tree evaluation
    // For now, return empty array as this is complex query building
    console.log('Executing target list:', targetList.definition);
    return [];
  }
}

// =====================================================
// AUDIT LOG SERVICE
// =====================================================

export class AuditLogService {
  static async getAll(filters: {
    entity?: string;
    entity_id?: string;
    actor_id?: string;
    action?: string;
    limit?: number;
  } = {}): Promise<AuditLogEntry[]> {
    let query = db
      .from('audit_log')
      .select(`
        *,
        actor:users(first_name, last_name)
      `);

    if (filters.entity) {
      query = query.eq('entity', filters.entity);
    }
    if (filters.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }
    if (filters.actor_id) {
      query = query.eq('actor_id', filters.actor_id);
    }
    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    query = query.limit(filters.limit || 100);
    query = query.order('at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(entry => ({
      ...entry,
      actor_name: entry.actor ? `${entry.actor.first_name || ''} ${entry.actor.last_name || ''}`.trim() : undefined,
    }));
  }
}

// =====================================================
// SEARCH SERVICE
// =====================================================

export class SearchService {
  static async globalSearch(query: string): Promise<{
    contacts: any[];
    companies: any[];
    deals: any[];
    tickets: any[];
  }> {
    if (!query || query.length < 2) {
      return { contacts: [], companies: [], deals: [], tickets: [] };
    }

    const [contacts, companies, deals, tickets] = await Promise.all([
      // Search contacts
      db.from('contacts')
        .select('id, first_name, last_name, email, company_id, companies(name)')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10),

      // Search companies  
      db.from('companies')
        .select('id, name, domain, industry')
        .or(`name.ilike.%${query}%,domain.ilike.%${query}%`)
        .limit(10),

      // Search deals
      db.from('deals')
        .select('id, name, stage, amount, companies(name)')
        .ilike('name', `%${query}%`)
        .limit(10),

      // Search tickets
      db.from('tickets')
        .select('id, subject, status, priority, companies(name)')
        .or(`subject.ilike.%${query}%,body.ilike.%${query}%`)
        .limit(10)
    ]);

    return {
      contacts: contacts.data || [],
      companies: companies.data || [],
      deals: deals.data || [],
      tickets: tickets.data || []
    };
  }
}