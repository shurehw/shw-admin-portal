'use client';

import { Contact } from '@/lib/crm/types';
import { Mail, Phone, Building, Calendar, User, Edit, Trash } from 'lucide-react';
import Link from 'next/link';
import { deleteContact } from '@/app/crm/actions/contacts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ContactDetailProps {
  contact: Contact;
}

export default function ContactDetail({ contact }: ContactDetailProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteContact(contact.id);
      if (result.success) {
        router.push('/crm/contacts');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {contact.first_name} {contact.last_name}
            </h1>
            {contact.title && (
              <p className="text-gray-600 mt-1">{contact.title}</p>
            )}
            <div className="mt-2">
              <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800">
                {contact.lifecycle_stage.replace('_', ' ')}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/crm/contacts/${contact.id}/edit`}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
            >
              <Trash className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="font-medium text-lg">Contact Information</h2>
          
          <div className="space-y-3">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                  {contact.email}
                </a>
              </div>
            )}
            
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            
            {contact.company_id && (
              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-gray-400" />
                <Link href={`/crm/companies/${contact.company_id}`} className="text-blue-600 hover:underline">
                  View Company
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-medium text-lg">Details</h2>
          
          <div className="space-y-3">
            {contact.owner_id && (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Owner: {contact.owner_id}</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Created: {formatDate(contact.created_at)}</span>
            </div>
            
            {contact.updated_at && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Updated: {formatDate(contact.updated_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {contact.custom && Object.keys(contact.custom).length > 0 && (
        <div className="p-6 border-t">
          <h2 className="font-medium text-lg mb-4">Custom Properties</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(contact.custom).map(([key, value]) => (
              <div key={key}>
                <span className="text-sm text-gray-600">{key}:</span>
                <p className="font-medium">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}