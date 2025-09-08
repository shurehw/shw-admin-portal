import { BaseRepo } from './base-repo';
import { Company } from '../types';

export class CompaniesRepo extends BaseRepo<Company> {
  constructor() {
    super('companies');
  }

  async search(orgId: string, query: string, limit: number = 10): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .or(`name.ilike.%${query}%,domain.ilike.%${query}%,industry.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findByDomain(domain: string, orgId: string): Promise<Company | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('org_id', orgId)
      .eq('domain', domain)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export const companiesRepo = new CompaniesRepo();