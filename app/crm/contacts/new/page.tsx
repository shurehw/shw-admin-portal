'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DynamicForm from '@/components/DynamicForm';
import { MinimalContactService, MinimalContact } from '@/lib/supabase';
import { FieldDefinitionService } from '@/lib/field-definitions';
import { AutoAssociationService } from '@/lib/auto-association';
import { Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewContactPage() {
  const router = useRouter();
  const [contactData, setContactData] = useState<Partial<MinimalContact>>({
    props: {}
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: { [key: string]: string } = {};
    
    try {
      // Get field definitions for validation
      const fieldDefinitions = await FieldDefinitionService.getFieldDefinitions('contact');
      
      for (const field of fieldDefinitions) {
        const value = field.key === 'email' || field.key === 'first_name' || field.key === 'last_name' 
          ? contactData[field.key as keyof MinimalContact]
          : contactData.props?.[field.key];
          
        const validation = FieldDefinitionService.validateFieldValue(field, value);
        if (!validation.valid) {
          newErrors[field.key] = validation.error || '';
        }
      }

      // Email is always required
      if (!contactData.email) {
        newErrors.email = 'Email is required';
      }

    } catch (error) {
      console.error('Validation error:', error);
      newErrors.form = 'Validation failed. Please try again.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      setSaving(true);
      
      // Auto-associate with company based on email domain
      let companyId = undefined;
      if (contactData.email) {
        const company = await AutoAssociationService.getOrCreateCompanyForEmail(contactData.email);
        if (company) {
          companyId = company.id;
        }
      }
      
      // Prepare contact data
      const contactToCreate = {
        email: contactData.email || '',
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        job_title: contactData.job_title,
        phone: contactData.phone,
        mobile_phone: contactData.mobile_phone,
        lifecycle_stage: contactData.lifecycle_stage || 'Lead',
        lead_status: contactData.lead_status,
        next_step: contactData.next_step,
        next_step_due: contactData.next_step_due,
        preferred_channel: contactData.preferred_channel,
        time_zone: contactData.time_zone,
        tags: contactData.tags || [],
        company_id: companyId,
        props: contactData.props || {}
      };

      const newContact = await MinimalContactService.create(contactToCreate);
      
      router.push(`/crm/contacts/${newContact.id}`);
    } catch (error) {
      console.error('Error creating contact:', error);
      setErrors({ form: 'Failed to create contact. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/crm/contacts"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Contacts
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">New Contact</h1>
                <p className="text-gray-600">Add a new contact to your CRM</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href="/crm/contacts"
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Creating...' : 'Create Contact'}
              </button>
            </div>
          </div>
        </div>

        {/* Form Errors */}
        {errors.form && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{errors.form}</p>
          </div>
        )}

        {/* Dynamic Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <DynamicForm
              entity="contact"
              data={contactData}
              onChange={setContactData}
              errors={errors}
              showSystemFields={true}
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Auto-Association</h3>
          <p className="text-sm text-blue-800">
            When you enter an email address, the contact will automatically be associated with a company 
            based on the email domain. If no company exists, a new one will be created automatically.
          </p>
        </div>
      </div>
  );
}