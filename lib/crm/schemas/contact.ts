import { z } from 'zod';

// Base schema for custom fields
const CustomFieldsSchema = z.record(z.any()).default({});

// Contact creation schema
export const ContactCreateSchema = z.object({
  org_id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required').max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(50).optional(),
  title: z.string().max(100).optional(),
  company_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  lifecycle_stage: z.enum(['lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist']).default('lead'),
  custom: CustomFieldsSchema,
});

// Contact update schema (partial)
export const ContactUpdateSchema = ContactCreateSchema.partial().extend({
  id: z.string().uuid(),
});

// Contact bulk import schema
export const ContactBulkImportSchema = z.object({
  contacts: z.array(ContactCreateSchema.omit({ org_id: true })),
  update_existing: z.boolean().default(false),
  match_by: z.enum(['email', 'id']).default('email'),
});

// Contact search/filter schema
export const ContactFilterSchema = z.object({
  q: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  lifecycle_stage: z.string().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  has_deals: z.boolean().optional(),
  has_tasks: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  custom_filters: z.record(z.any()).optional(),
  sort_by: z.enum(['created_at', 'updated_at', 'last_name', 'email', 'lifecycle_stage']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

// Contact association schemas
export const ContactCompanyAssociationSchema = z.object({
  contact_id: z.string().uuid(),
  company_id: z.string().uuid(),
  role: z.string().max(100).optional(),
  is_primary: z.boolean().default(false),
});

export const ContactDealAssociationSchema = z.object({
  contact_id: z.string().uuid(),
  deal_id: z.string().uuid(),
  role: z.string().max(100).optional(),
  is_influencer: z.boolean().default(false),
});

// Export types
export type ContactCreateInput = z.infer<typeof ContactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>;
export type ContactBulkImportInput = z.infer<typeof ContactBulkImportSchema>;
export type ContactFilterInput = z.infer<typeof ContactFilterSchema>;
export type ContactCompanyAssociationInput = z.infer<typeof ContactCompanyAssociationSchema>;
export type ContactDealAssociationInput = z.infer<typeof ContactDealAssociationSchema>;