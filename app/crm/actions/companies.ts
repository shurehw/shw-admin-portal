'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { companiesRepo } from '@/lib/crm/repos/companies-repo';
import { z } from 'zod';

// Default org ID - in production, get from session
const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

// Company schemas
const CompanyCreateSchema = z.object({
  org_id: z.string(),
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
});

const CompanyUpdateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
});

export async function createCompany(formData: FormData) {
  try {
    // Parse and validate input
    const input = CompanyCreateSchema.parse({
      org_id: DEFAULT_ORG_ID,
      name: formData.get('name'),
      domain: formData.get('domain'),
      industry: formData.get('industry'),
      size: formData.get('size'),
      website: formData.get('website'),
      description: formData.get('description'),
    });

    // Create company
    const company = await companiesRepo.create(DEFAULT_ORG_ID, input);
    
    if (!company) {
      throw new Error('Failed to create company');
    }

    // Revalidate the companies page
    revalidatePath('/crm/companies');
    
    // Redirect to the new company
    redirect(`/crm/companies/${company.id}`);
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

export async function updateCompany(companyId: string, formData: FormData) {
  try {
    // Parse and validate input
    const input = CompanyUpdateSchema.parse({
      id: companyId,
      name: formData.get('name'),
      domain: formData.get('domain'),
      industry: formData.get('industry'),
      size: formData.get('size'),
      website: formData.get('website'),
      description: formData.get('description'),
    });

    // Update company
    const company = await companiesRepo.update(companyId, DEFAULT_ORG_ID, input);
    
    if (!company) {
      throw new Error('Failed to update company');
    }

    // Revalidate pages
    revalidatePath('/crm/companies');
    revalidatePath(`/crm/companies/${companyId}`);
    
    return { success: true, data: company };
  } catch (error) {
    console.error('Error updating company:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteCompany(companyId: string) {
  try {
    const success = await companiesRepo.softDelete(companyId, DEFAULT_ORG_ID);
    
    if (!success) {
      throw new Error('Failed to delete company');
    }

    // Revalidate the companies page
    revalidatePath('/crm/companies');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting company:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function searchCompanies(query: string) {
  try {
    const companies = await companiesRepo.search(DEFAULT_ORG_ID, query, 10);
    return { success: true, data: companies };
  } catch (error) {
    console.error('Error searching companies:', error);
    return { success: false, data: [] };
  }
}