import { createClient } from '@supabase/supabase-js'

// Use environment variables to configure the Supabase client.
// Ensure the anon key is exposed only on the client and the service key is used server-side only.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTUzMjksImV4cCI6MjA3MDM3MTMyOX0.yXS4pbap1yVfhidFCN4MZkZE4lbkF5yS9V-nR88V1kc'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDc5NTMyOSwiZXhwIjoyMDcwMzcxMzI5fQ.IIRm2nN0YdT6uosrGk5pypgW50rOhHxqOiWO0aN4r_U'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// User management types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'sales_manager' | 'account_manager' | 'customer_service' | 'production' | 'art_team' | 'viewer';
  roles?: string[]; // For multiple roles support
  department?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_sign_in_at?: string;
}

// Database types for hospitality CRM
export interface Venue {
  id?: string;
  name: string;
  type: 'bar' | 'restaurant' | 'nightclub' | 'lounge' | 'sports_bar' | 'brewery' | 'winery' | 'cafe' | 'catering' | 'food_truck' | 'hotel_bar' | 'event_space';
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  email?: string;
  website?: string;
  capacity?: number;
  liquor_license_type?: string;
  liquor_license_status?: string;
  annual_revenue?: string;
  alcohol_sales_percentage?: number;
  decision_maker_name?: string;
  decision_maker_title?: string;
  decision_maker_email?: string;
  last_contact?: string;
  status: 'prospect' | 'contacted' | 'qualified' | 'customer' | 'closed_lost';
  opportunity_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Contact {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  company: string;
  venue_id?: string;
  status: 'active' | 'inactive' | 'prospect';
  last_contact?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Deal {
  id?: string;
  title: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  venue_id?: string;
  contact_id?: string;
  expected_close_date?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Fast database operations with proper error handling
export const supabaseDb = {
  // Venues
  async getVenues() {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Limit for performance
      
      if (error) throw error;
      return data as Venue[];
    } catch (error) {
      console.error('Error fetching venues:', error);
      return [];
    }
  },

  async createVenue(venue: Omit<Venue, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('venues')
      .insert([venue])
      .select()
      .single();
    
    if (error) throw error;
    return data as Venue;
  },

  async updateVenue(id: string, updates: Partial<Venue>) {
    const { data, error } = await supabase
      .from('venues')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Venue;
  },

  // Contacts
  async getContacts() {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Contact[];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  },

  async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('contacts')
      .insert([contact])
      .select()
      .single();
    
    if (error) throw error;
    return data as Contact;
  },

  // Deals
  async getDeals() {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          venue:venues(name, city, state),
          contact:contacts(first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching deals:', error);
      return [];
    }
  },

  async createDeal(deal: Omit<Deal, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('deals')
      .insert([deal])
      .select()
      .single();
    
    if (error) throw error;
    return data as Deal;
  },

  async updateDeal(id: string, updates: Partial<Deal>) {
    const { data, error } = await supabase
      .from('deals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Deal;
  }
};

// Minimal CRM Database types
export interface MinimalContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  job_title?: string;
  mobile_phone?: string;
  phone?: string;
  owner_id?: string;
  lifecycle_stage?: string;
  lead_status?: string;
  next_step?: string;
  next_step_due?: string;
  preferred_channel?: string;
  time_zone?: string;
  tags?: string[];
  utm_source?: string;
  utm_medium?: string;
  analytics_source?: string;
  company_id?: string;
  props: any;
  created_at: string;
  updated_at: string;
}

export interface MinimalCompany {
  id: string;
  name: string;
  domain?: string;
  phone?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  industry?: string;
  owner_id?: string;
  lifecycle_stage?: string;
  parent_company_id?: string;
  territory?: string;
  account_tier?: string;
  location_count?: number;
  netsuite_customer_id?: string;
  portal_company_id?: string;
  price_list?: string;
  payment_terms?: string;
  credit_limit?: number;
  credit_status?: string;
  tax_exempt?: boolean;
  resale_cert_expiry?: string;
  receiving_notes?: string;
  default_warehouse?: string;
  default_route?: string;
  last_order_date?: string;
  t12m_revenue?: number;
  open_quote_count?: number;
  open_ticket_count?: number;
  props: any;
  created_at: string;
  updated_at: string;
}

// Minimal CRM Services
export class MinimalContactService {
  static async getAll(): Promise<MinimalContact[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        company:companies(name, domain, industry)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }

    return data || [];
  }

  static async getById(id: string): Promise<MinimalContact | null> {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching contact:', error);
      throw error;
    }

    return data;
  }

  static async create(contact: Omit<MinimalContact, 'id' | 'created_at' | 'updated_at'>): Promise<MinimalContact> {
    // If contact has a company but no owner, copy the company owner
    let finalContact = { ...contact };
    if (contact.company_id && !contact.owner_id) {
      const company = await MinimalCompanyService.getById(contact.company_id);
      if (company?.owner_id) {
        finalContact.owner_id = company.owner_id;
      }
    }
    
    const { data, error } = await supabase
      .from('contacts')
      .insert([finalContact])
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      throw error;
    }

    return data;
  }

  static async update(id: string, updates: Partial<MinimalContact>): Promise<MinimalContact> {
    // If updating company_id and no owner is set, copy the company owner
    let finalUpdates = { ...updates };
    if (updates.company_id && !updates.owner_id) {
      // Check if current contact has an owner
      const currentContact = await MinimalContactService.getById(id);
      if (!currentContact?.owner_id) {
        const company = await MinimalCompanyService.getById(updates.company_id);
        if (company?.owner_id) {
          finalUpdates.owner_id = company.owner_id;
        }
      }
    }
    
    const { data, error } = await supabase
      .from('contacts')
      .update(finalUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating contact:', error);
      throw error;
    }

    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }
}

export class MinimalCompanyService {
  static async getAll(): Promise<MinimalCompany[]> {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        contacts:contacts(count)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }

    return data || [];
  }

  static async getById(id: string): Promise<MinimalCompany | null> {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        contacts:contacts(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching company:', error);
      throw error;
    }

    return data;
  }

  static async create(company: Omit<MinimalCompany, 'id' | 'created_at' | 'updated_at'>): Promise<MinimalCompany> {
    const { data, error } = await supabase
      .from('companies')
      .insert([company])
      .select()
      .single();

    if (error) {
      console.error('Error creating company:', error);
      throw error;
    }

    return data;
  }

  static async update(id: string, updates: Partial<MinimalCompany>): Promise<MinimalCompany> {
    const { data, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating company:', error);
      throw error;
    }
    
    // If owner changed, optionally update all contacts without owners
    if (updates.owner_id) {
      await MinimalCompanyService.propagateOwnerToContacts(id, updates.owner_id);
    }

    return data;
  }
  
  static async propagateOwnerToContacts(companyId: string, ownerId: string): Promise<void> {
    // Update all contacts of this company that don't have an owner
    const { error } = await supabase
      .from('contacts')
      .update({ owner_id: ownerId })
      .eq('company_id', companyId)
      .is('owner_id', null);
    
    if (error) {
      console.error('Error propagating owner to contacts:', error);
      // Don't throw - this is an optional operation
    }
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }
};
