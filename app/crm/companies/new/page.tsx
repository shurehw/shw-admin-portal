'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import DynamicForm from '@/components/DynamicForm';
import { MinimalCompanyService, MinimalCompany } from '@/lib/supabase';
import { FieldDefinitionService } from '@/lib/field-definitions';
import { Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewCompanyPage() {
  const router = useRouter();
  const [companyData, setCompanyData] = useState<Partial<MinimalCompany>>({
    props: {}
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: { [key: string]: string } = {};
    
    try {
      // Get field definitions for validation
      const fieldDefinitions = await FieldDefinitionService.getFieldDefinitions('company');
      
      for (const field of fieldDefinitions) {
        const value = field.key === 'name' || field.key === 'domain' || field.key === 'phone' 
          ? companyData[field.key as keyof MinimalCompany]
          : companyData.props?.[field.key];
          
        const validation = FieldDefinitionService.validateFieldValue(field, value);
        if (!validation.valid) {
          newErrors[field.key] = validation.error || '';
        }
      }

      // Company name is always required
      if (!companyData.name) {
        newErrors.name = 'Company name is required';
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
      
      // Prepare company data
      const companyToCreate = {
        name: companyData.name || '',
        domain: companyData.domain,
        phone: companyData.phone,
        address: companyData.address,
        address2: companyData.address2,
        city: companyData.city,
        state: companyData.state,
        zip: companyData.zip,
        country: companyData.country,
        industry: companyData.industry,
        lifecycle_stage: companyData.lifecycle_stage || 'Prospect',
        account_tier: companyData.account_tier,
        territory: companyData.territory,
        price_list: companyData.price_list,
        payment_terms: companyData.payment_terms,
        credit_limit: companyData.credit_limit,
        credit_status: companyData.credit_status,
        props: companyData.props || {}
      };

      const newCompany = await MinimalCompanyService.create(companyToCreate);
      
      router.push(`/crm/companies/${newCompany.id}`);
    } catch (error) {
      console.error('Error creating company:', error);
      setErrors({ form: 'Failed to create company. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/crm/companies"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Companies
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">New Company</h1>
                <p className="text-gray-600">Add a new company to your CRM</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href="/crm/companies"
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
                {saving ? 'Creating...' : 'Create Company'}
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
              entity="company"
              data={companyData}
              onChange={setCompanyData}
              errors={errors}
              showSystemFields={true}
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Domain Association</h3>
          <p className="text-sm text-blue-800">
            When you enter a website domain, future contacts with email addresses from this domain 
            will automatically be associated with this company. You can also add additional domains 
            for multi-brand companies.
          </p>
        </div>
      </div>
    </CRMLayout>
  );
}