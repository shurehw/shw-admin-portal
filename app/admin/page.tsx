'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the dashboard which now contains the Order Status tab
    router.replace('/admin/dashboard');
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-lg text-gray-600">Redirecting to dashboard...</div>
    </div>
  );
}