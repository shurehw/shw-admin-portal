'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactCreateSchema } from '@/lib/crm/schemas/contact';
import { createContact, updateContact } from '@/app/crm/actions/contacts';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';

type ContactFormData = z.infer<typeof ContactCreateSchema>;

interface ContactFormProps {
  contact?: Partial<ContactFormData>;
  contactId?: string;
}

export default function ContactForm({ contact, contactId }: ContactFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactCreateSchema),
    defaultValues: contact || {
      lifecycle_stage: 'lead',
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });

      if (contactId) {
        const result = await updateContact(contactId, formData);
        if (result.success) {
          router.push(`/crm/contacts/${contactId}`);
        } else {
          setError(result.error || 'Failed to update contact');
        }
      } else {
        await createContact(formData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            First Name
          </label>
          <input
            {...register('first_name')}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.first_name && (
            <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Last Name
          </label>
          <input
            {...register('last_name')}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.last_name && (
            <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          {...register('email')}
          type="email"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Phone
        </label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Job Title
        </label>
        <input
          {...register('title')}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Lifecycle Stage
        </label>
        <select
          {...register('lifecycle_stage')}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="lead">Lead</option>
          <option value="marketing_qualified">Marketing Qualified</option>
          <option value="sales_qualified">Sales Qualified</option>
          <option value="opportunity">Opportunity</option>
          <option value="customer">Customer</option>
          <option value="evangelist">Evangelist</option>
        </select>
        {errors.lifecycle_stage && (
          <p className="text-red-500 text-sm mt-1">{errors.lifecycle_stage.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : contactId ? 'Update Contact' : 'Create Contact'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}