import { supabaseAdmin } from '@/lib/clients/supabase';
import { QueryFilters, PaginatedResponse } from '../types';

export abstract class BaseRepository<T> {
  protected tableName: string;
  protected defaultSelect: string = '*';
  protected searchColumns: string[] = [];

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected getClient() {
    return supabaseAdmin();
  }

  async findById(id: string, orgId: string): Promise<T | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select(this.defaultSelect)
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error(`Error fetching ${this.tableName} by id:`, error);
      return null;
    }

    return data as T;
  }

  async findAll(orgId: string, filters?: QueryFilters): Promise<PaginatedResponse<T>> {
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    let query = this.getClient()
      .from(this.tableName)
      .select(this.defaultSelect, { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null);

    // Apply search
    if (filters?.q && this.searchColumns.length > 0) {
      const searchConditions = this.searchColumns
        .map(col => `${col}.ilike.%${filters.q}%`)
        .join(',');
      query = query.or(searchConditions);
    }

    // Apply filters
    if (filters?.owner_id) {
      query = query.eq('owner_id', filters.owner_id);
    }

    // Apply sorting
    const sortBy = filters?.sort_by || 'created_at';
    const sortOrder = filters?.sort_order || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error(`Error fetching ${this.tableName}:`, error);
      return {
        data: [],
        total: 0,
        page: Math.floor(offset / limit) + 1,
        per_page: limit,
        has_more: false,
      };
    }

    return {
      data: data as T[],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      per_page: limit,
      has_more: (count || 0) > offset + limit,
    };
  }

  async create(orgId: string, input: Partial<T>): Promise<T | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .insert({
        ...input,
        org_id: orgId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(this.defaultSelect)
      .single();

    if (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }

    return data as T;
  }

  async update(id: string, orgId: string, input: Partial<T>): Promise<T | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .select(this.defaultSelect)
      .single();

    if (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }

    return data as T;
  }

  async softDelete(id: string, orgId: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from(this.tableName)
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null);

    if (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      return false;
    }

    return true;
  }

  async bulkCreate(orgId: string, items: Partial<T>[]): Promise<T[]> {
    const itemsWithOrg = items.map(item => ({
      ...item,
      org_id: orgId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await this.getClient()
      .from(this.tableName)
      .insert(itemsWithOrg)
      .select(this.defaultSelect);

    if (error) {
      console.error(`Error bulk creating ${this.tableName}:`, error);
      throw error;
    }

    return data as T[];
  }

  async search(orgId: string, query: string, limit: number = 10): Promise<T[]> {
    if (!query || this.searchColumns.length === 0) {
      return [];
    }

    let searchQuery = this.getClient()
      .from(this.tableName)
      .select(this.defaultSelect)
      .eq('org_id', orgId)
      .is('deleted_at', null);

    // Use full-text search if available
    if (this.tableName === 'contacts' || this.tableName === 'companies') {
      searchQuery = searchQuery.textSearch('search_vector', query, {
        config: 'simple',
      });
    } else {
      // Fallback to ILIKE search
      const searchConditions = this.searchColumns
        .map(col => `${col}.ilike.%${query}%`)
        .join(',');
      searchQuery = searchQuery.or(searchConditions);
    }

    const { data, error } = await searchQuery.limit(limit);

    if (error) {
      console.error(`Error searching ${this.tableName}:`, error);
      return [];
    }

    return data as T[];
  }

  // Audit log helper
  protected async logAudit(
    orgId: string,
    userId: string | null,
    entityId: string,
    action: string,
    changes?: any
  ): Promise<void> {
    await this.getClient()
      .from('audit_logs')
      .insert({
        org_id: orgId,
        user_id: userId,
        entity_type: this.tableName,
        entity_id: entityId,
        action,
        changes,
        created_at: new Date().toISOString(),
      });
  }
}