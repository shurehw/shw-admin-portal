'use client';

import AdminLayout from '@/components/AdminLayout';
import EnhancedQuoteForm from '@/components/EnhancedQuoteForm';

export default function NewQuotePage() {
  return (
    <AdminLayout>
      <div className="p-6">
        <EnhancedQuoteForm />
      </div>
    </AdminLayout>
  );
}