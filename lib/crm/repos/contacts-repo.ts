import { BaseRepository } from './base-repo';
import { Contact, QueryFilters, PaginatedResponse } from '../types';
import { supabaseAdmin } from '@/lib/clients/supabase';

export class ContactsRepository extends BaseRepository<Contact> {
  constructor() {
    super('contacts');
    this.defaultSelect = `
      *,
      company:companies(id, name, domain),
      deals:deals(id, name, stage, amount),
      tasks:tasks(id, title, status, due_date)
    `;
    this.searchColumns = ['email', 'first_name', 'last_name', 'phone'];
  }

  async findByEmail(email: string, orgId: string): Promise<Contact | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select(this.defaultSelect)
      .eq('org_id', orgId)
      .ilike('email', email)
      .is('deleted_at', null)
      .single();

    if (error) {
      return null;
    }

    return data as Contact;
  }

  async findAll(orgId: string, filters?: QueryFilters): Promise<PaginatedResponse<Contact>> {
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    let query = this.getClient()
      .from(this.tableName)
      .select(this.defaultSelect, { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null);

    // Search using full-text search vector
    if (filters?.q) {
      query = query.textSearch('search_vector', filters.q, {
        config: 'simple',
      });
    }

    // Apply filters
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }
    if (filters?.lifecycle_stage) {
      query = query.eq('lifecycle_stage', filters.lifecycle_stage);
    }
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    // Date filters
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Sorting
    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = filters?.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching contacts:', error);
      return {
        data: [],
        total: 0,
        page: Math.floor(offset / limit) + 1,
        per_page: limit,
        has_more: false,
      };
    }

    // Add computed full_name
    const contacts = (data as Contact[]).map(contact => ({
      ...contact,
      full_name: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email,
    }));

    return {
      data: contacts,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
      has_more: (count || 0) > offset + limit,
    };
  }

  async associateWithCompany(
    contactId: string,
    companyId: string,
    orgId: string,
    role?: string,
    isPrimary: boolean = false
  ): Promise<void> {
    // First, update the contact's company_id if primary
    if (isPrimary) {
      await this.update(contactId, orgId, { company_id: companyId });
    }

    // Then create the association
    await this.getClient()
      .from('company_contacts')
      .upsert({
        org_id: orgId,
        contact_id: contactId,
        company_id: companyId,
        role,
        is_primary: isPrimary,
        created_at: new Date().toISOString(),
      });
  }

  async associateWithDeal(
    contactId: string,
    dealId: string,
    orgId: string,
    role?: string,
    isInfluencer: boolean = false
  ): Promise<void> {
    await this.getClient()
      .from('deal_contacts')
      .upsert({
        org_id: orgId,
        contact_id: contactId,
        deal_id: dealId,
        role,
        is_influencer: isInfluencer,
        created_at: new Date().toISOString(),
      });
  }

  async bulkUpdateLifecycleStage(
    contactIds: string[],
    lifecycleStage: string,
    orgId: string
  ): Promise<void> {
    await this.getClient()
      .from(this.tableName)
      .update({
        lifecycle_stage: lifecycleStage,
        updated_at: new Date().toISOString(),
      })
      .in('id', contactIds)
      .eq('org_id', orgId);
  }

  async findDuplicates(orgId: string): Promise<Array<Contact[]>> {
    // Find contacts with duplicate emails
    const { data } = await this.getClient()
      .from(this.tableName)
      .select('email, array_agg(id) as ids')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .not('email', 'is', null)
      .group('email')
      .having('count(*) > 1');

    if (!data || data.length === 0) {
      return [];
    }

    // Fetch full contact details for duplicates
    const duplicateGroups = await Promise.all(
      data.map(async (group: any) => {
        const { data: contacts } = await this.getClient()
          .from(this.tableName)
          .select(this.defaultSelect)
          .in('id', group.ids);
        return contacts as Contact[];
      })
    );

    return duplicateGroups;
  }

  async merge(
    primaryId: string,
    duplicateIds: string[],
    orgId: string,
    userId: string
  ): Promise<Contact | null> {
    // Start a transaction
    const client = this.getClient();

    try {
      // Get all contacts to merge
      const { data: contacts } = await client
        .from(this.tableName)
        .select('*')
        .in('id', [primaryId, ...duplicateIds])
        .eq('org_id', orgId);

      if (!contacts || contacts.length === 0) {
        throw new Error('Contacts not found');
      }

      const primary = contacts.find(c => c.id === primaryId);
      if (!primary) {
        throw new Error('Primary contact not found');
      }

      // Merge custom fields
      const mergedCustom = contacts.reduce((acc, contact) => ({
        ...acc,
        ...contact.custom,
      }), {});

      // Update primary contact with merged data
      const merged = await this.update(primaryId, orgId, {
        custom: mergedCustom,
      });

      // Update all references from duplicates to primary
      await Promise.all([
        // Update activities
        client
          .from('activities')
          .update({ contact_id: primaryId })
          .in('contact_id', duplicateIds)
          .eq('org_id', orgId),
        
        // Update tasks
        client
          .from('tasks')
          .update({ contact_id: primaryId })
          .in('contact_id', duplicateIds)
          .eq('org_id', orgId),
        
        // Update deal associations
        client
          .from('deal_contacts')
          .update({ contact_id: primaryId })
          .in('contact_id', duplicateIds)
          .eq('org_id', orgId),
      ]);

      // Soft delete duplicates
      await Promise.all(
        duplicateIds.map(id => this.softDelete(id, orgId))
      );

      // Log the merge
      await this.logAudit(orgId, userId, primaryId, 'merge', {
        merged_ids: duplicateIds,
      });

      return merged;
    } catch (error) {
      console.error('Error merging contacts:', error);
      throw error;
    }
  }

  async getActivityTimeline(contactId: string, orgId: string, limit: number = 50): Promise<any[]> {
    const { data } = await this.getClient()
      .from('activities')
      .select('*')
      .eq('org_id', orgId)
      .eq('contact_id', contactId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    return data || [];
  }
}

export const contactsRepo = new ContactsRepository();