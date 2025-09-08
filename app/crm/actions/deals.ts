'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { dealsRepo } from '@/lib/crm/repos/deals-repo';
import { z } from 'zod';

// Default org ID - in production, get from session
const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

// Deal schemas
const DealCreateSchema = z.object({
  org_id: z.string(),
  name: z.string().min(1, 'Name is required'),
  amount: z.coerce.number().optional(),
  stage: z.string().optional(),
  pipeline_id: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  expected_close_date: z.string().optional(),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
  description: z.string().optional(),
});

const DealUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').optional(),
  amount: z.coerce.number().optional(),
  stage: z.string().optional(),
  pipeline_id: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  expected_close_date: z.string().optional(),
  contact_id: z.string().optional(),
  company_id: z.string().optional(),
  description: z.string().optional(),
});

export async function createDeal(formData: FormData) {
  try {
    // Parse and validate input
    const input = DealCreateSchema.parse({
      org_id: DEFAULT_ORG_ID,
      name: formData.get('name'),
      amount: formData.get('amount') || undefined,
      stage: formData.get('stage') || 'lead',
      pipeline_id: formData.get('pipeline_id') || undefined,
      probability: formData.get('probability') || undefined,
      expected_close_date: formData.get('expected_close_date') || undefined,
      contact_id: formData.get('contact_id') || undefined,
      company_id: formData.get('company_id') || undefined,
      description: formData.get('description') || undefined,
    });

    // Create deal
    const deal = await dealsRepo.create(DEFAULT_ORG_ID, input);
    
    if (!deal) {
      throw new Error('Failed to create deal');
    }

    // Revalidate the deals page
    revalidatePath('/crm/deals');
    
    // Redirect to the new deal
    redirect(`/crm/deals/${deal.id}`);
  } catch (error) {
    console.error('Error creating deal:', error);
    throw error;
  }
}

export async function updateDeal(dealId: string, formData: FormData) {
  try {
    // Parse and validate input
    const input = DealUpdateSchema.parse({
      id: dealId,
      name: formData.get('name'),
      amount: formData.get('amount'),
      stage: formData.get('stage'),
      pipeline_id: formData.get('pipeline_id'),
      probability: formData.get('probability'),
      expected_close_date: formData.get('expected_close_date'),
      contact_id: formData.get('contact_id'),
      company_id: formData.get('company_id'),
      description: formData.get('description'),
    });

    // Update deal
    const deal = await dealsRepo.update(dealId, DEFAULT_ORG_ID, input);
    
    if (!deal) {
      throw new Error('Failed to update deal');
    }

    // Revalidate pages
    revalidatePath('/crm/deals');
    revalidatePath(`/crm/deals/${dealId}`);
    
    return { success: true, data: deal };
  } catch (error) {
    console.error('Error updating deal:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteDeal(dealId: string) {
  try {
    const success = await dealsRepo.softDelete(dealId, DEFAULT_ORG_ID);
    
    if (!success) {
      throw new Error('Failed to delete deal');
    }

    // Revalidate the deals page
    revalidatePath('/crm/deals');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting deal:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateDealStage(dealId: string, stage: string) {
  try {
    const deal = await dealsRepo.update(dealId, DEFAULT_ORG_ID, { stage });
    
    if (!deal) {
      throw new Error('Failed to update deal stage');
    }

    // Revalidate pages
    revalidatePath('/crm/deals');
    revalidatePath(`/crm/deals/${dealId}`);
    
    return { success: true, data: deal };
  } catch (error) {
    console.error('Error updating deal stage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function searchDeals(query: string) {
  try {
    const deals = await dealsRepo.search(DEFAULT_ORG_ID, query, 10);
    return { success: true, data: deals };
  } catch (error) {
    console.error('Error searching deals:', error);
    return { success: false, data: [] };
  }
}