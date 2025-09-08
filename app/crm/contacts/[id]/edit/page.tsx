import { notFound } from 'next/navigation';
import { contactsRepo } from '@/lib/crm/repos/contacts-repo';
import ContactForm from '@/components/crm/ContactForm';

// Default org ID - in production, get from session
const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

interface EditContactPageProps {
  params: {
    id: string;
  };
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const contact = await contactsRepo.findById(params.id, DEFAULT_ORG_ID);
  
  if (!contact) {
    notFound();
  }
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Contact</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <ContactForm contact={contact} contactId={params.id} />
      </div>
    </div>
  );
}