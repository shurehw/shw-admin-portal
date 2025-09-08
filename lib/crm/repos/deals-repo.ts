import { BaseRepo } from './base-repo';
import { Deal } from '../types';

export class DealsRepo extends BaseRepo<Deal> {
  constructor() {
    super('deals');
  }

  async search(orgId: string, query: string, limit: number = 10): Promise<Deal[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async findByStage(orgId: string, stage: string): Promise<Deal[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('org_id', orgId)
      .eq('stage', stage)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  }

  async findByPipeline(orgId: string, pipelineId: string): Promise<Deal[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('org_id', orgId)
      .eq('pipeline_id', pipelineId)
      .is('deleted_at', null);

    if (error) throw error;
    return data || [];
  }
}

export const dealsRepo = new DealsRepo();