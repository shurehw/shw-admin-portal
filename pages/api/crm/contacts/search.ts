import type { NextApiRequest, NextApiResponse } from 'next';
import { contactsRepo } from '@/lib/crm/repos/contacts-repo';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, limit = '20' } = req.query;
    
    // In a real app, you'd get org_id from the authenticated user
    // For now, we'll use a placeholder or get from session
    const orgId = 'placeholder-org-id'; // TODO: Get from user session
    
    const contacts = await contactsRepo.findAll(orgId, {
      q: q as string,
      limit: parseInt(limit as string),
      sort_by: 'first_name',
      sort_order: 'asc'
    });

    // Transform contacts for the dropdown
    const transformedContacts = contacts.data.map(contact => ({
      id: contact.id,
      name: contact.full_name || `${contact.first_name} ${contact.last_name}`.trim() || contact.email,
      email: contact.email,
      company: contact.company?.name || '',
      phone: contact.phone || ''
    }));

    res.status(200).json({
      success: true,
      contacts: transformedContacts,
      total: contacts.total
    });
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
}