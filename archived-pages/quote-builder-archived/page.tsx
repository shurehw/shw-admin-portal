'use client';

export const dynamic = 'force-dynamic';

// This file now redirects to the new quotes page
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuoteBuilder() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/quotes/new');
  }, [router]);
  
  return null;
}