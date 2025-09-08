'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ContactCreateSchema, ContactUpdateSchema, ContactFilterSchema } from '@/lib/crm/schemas/contact';
import { contactsRepo } from '@/lib/crm/repos/contacts-repo';
import { z } from 'zod';

// Default org ID - in production, get from session
const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

export async function createContact(formData: FormData) {
  try {
    // Parse and validate input
    const input = ContactCreateSchema.parse({
      org_id: DEFAULT_ORG_ID,
      email: formData.get('email'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      title: formData.get('title'),
      company_id: formData.get('company_id') || undefined,
      lifecycle_stage: formData.get('lifecycle_stage') || 'lead',
    });

    // Create contact
    const contact = await contactsRepo.create(DEFAULT_ORG_ID, input);
    
    if (!contact) {
      throw new Error('Failed to create contact');
    }

    // Revalidate the contacts page
    revalidatePath('/crm/contacts');
    
    // Redirect to the new contact
    redirect(`/crm/contacts/${contact.id}`);
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
}

export async function updateContact(contactId: string, formData: FormData) {
  try {
    // Parse and validate input
    const input = ContactUpdateSchema.parse({
      id: contactId,
      email: formData.get('email'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      phone: formData.get('phone'),
      title: formData.get('title'),
      lifecycle_stage: formData.get('lifecycle_stage'),
    });

    // Update contact
    const contact = await contactsRepo.update(contactId, DEFAULT_ORG_ID, input);
    
    if (!contact) {
      throw new Error('Failed to update contact');
    }

    // Revalidate pages
    revalidatePath('/crm/contacts');
    revalidatePath(`/crm/contacts/${contactId}`);
    
    return { success: true, data: contact };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteContact(contactId: string) {
  try {
    const success = await contactsRepo.softDelete(contactId, DEFAULT_ORG_ID);
    
    if (!success) {
      throw new Error('Failed to delete contact');
    }

    // Revalidate the contacts page
    revalidatePath('/crm/contacts');
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting contact:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function searchContacts(query: string) {
  try {
    const contacts = await contactsRepo.search(DEFAULT_ORG_ID, query, 10);
    return { success: true, data: contacts };
  } catch (error) {
    console.error('Error searching contacts:', error);
    return { success: false, data: [] };
  }
}

export async function bulkUpdateLifecycleStage(contactIds: string[], lifecycleStage: string) {
  try {
    await contactsRepo.bulkUpdateLifecycleStage(contactIds, lifecycleStage, DEFAULT_ORG_ID);
    
    // Revalidate the contacts page
    revalidatePath('/crm/contacts');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating lifecycle stage:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function associateContactWithCompany(
  contactId: string,
  companyId: string,
  role?: string,
  isPrimary: boolean = false
) {
  try {
    await contactsRepo.associateWithCompany(
      contactId,
      companyId,
      DEFAULT_ORG_ID,
      role,
      isPrimary
    );
    
    // Revalidate pages
    revalidatePath(`/crm/contacts/${contactId}`);
    revalidatePath(`/crm/companies/${companyId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error associating contact with company:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function associateContactWithDeal(
  contactId: string,
  dealId: string,
  role?: string,
  isInfluencer: boolean = false
) {
  try {
    await contactsRepo.associateWithDeal(
      contactId,
      dealId,
      DEFAULT_ORG_ID,
      role,
      isInfluencer
    );
    
    // Revalidate pages
    revalidatePath(`/crm/contacts/${contactId}`);
    revalidatePath(`/crm/deals/${dealId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error associating contact with deal:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function findDuplicateContacts() {
  try {
    const duplicates = await contactsRepo.findDuplicates(DEFAULT_ORG_ID);
    return { success: true, data: duplicates };
  } catch (error) {
    console.error('Error finding duplicate contacts:', error);
    return { success: false, data: [] };
  }
}

export async function mergeContacts(primaryId: string, duplicateIds: string[]) {
  try {
    // In production, get user ID from session
    const userId = 'system';
    
    const merged = await contactsRepo.merge(
      primaryId,
      duplicateIds,
      DEFAULT_ORG_ID,
      userId
    );
    
    if (!merged) {
      throw new Error('Failed to merge contacts');
    }
    
    // Revalidate pages
    revalidatePath('/crm/contacts');
    revalidatePath(`/crm/contacts/${primaryId}`);
    
    return { success: true, data: merged };
  } catch (error) {
    console.error('Error merging contacts:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}