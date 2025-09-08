'use client';

// This file now redirects to the full art proofs
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ArtProofs() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/admin/production/art-proofs-full');
  }, [router]);
  
  return null;
}