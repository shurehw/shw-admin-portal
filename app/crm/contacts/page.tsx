import { Suspense } from 'react';
import { contactsRepo } from '@/lib/crm/repos/contacts-repo';
import ContactsTable from '@/components/crm/ContactsTable';
import ContactsHeader from '@/components/crm/ContactsHeader';
import { ContactFilterSchema } from '@/lib/crm/schemas/contact';

// Default org ID - in production, get from session
const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

interface ContactsPageProps {
  searchParams: {
    q?: string;
    owner_id?: string;
    lifecycle_stage?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    page?: string;
  };
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  // Parse and validate filters
  const filters = ContactFilterSchema.parse({
    q: searchParams.q,
    owner_id: searchParams.owner_id,
    lifecycle_stage: searchParams.lifecycle_stage,
    sort_by: searchParams.sort_by || 'created_at',
    sort_order: searchParams.sort_order || 'desc',
    offset: ((parseInt(searchParams.page || '1') - 1) * 20),
    limit: 20,
  });

  // Fetch contacts
  const response = await contactsRepo.findAll(DEFAULT_ORG_ID, filters);

  return (
    <div className="flex flex-col h-full">
      <ContactsHeader totalCount={response.total} />
      
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<ContactsTableSkeleton />}>
          <ContactsTable 
            initialData={response.data}
            totalCount={response.total}
            currentPage={response.page}
            hasMore={response.has_more}
            filters={filters}
          />
        </Suspense>
      </div>
    </div>
  );
}

function ContactsTableSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4" />
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2" />
        ))}
      </div>
    </div>
  );
}