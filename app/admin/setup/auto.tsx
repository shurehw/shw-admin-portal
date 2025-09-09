'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AutoSetupPage() {
  const [status, setStatus] = useState('Setting up admin access...');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    setupAdmin();
  }, []);

  const setupAdmin = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not signed in');
        return;
      }

      setStatus(`Setting up admin for: ${user.email}`);

      // Create or update profile directly
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'admin',
          status: 'active'
        }, {
          onConflict: 'user_id'
        });

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        // Try direct insert
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            role: 'admin',
            status: 'active'
          });
        
        if (insertError && insertError.code !== '23505') {
          setError(`Database error: ${insertError.message}`);
          return;
        }
      }

      setStatus('Admin access granted! Redirecting...');
      
      // Refresh session
      await supabase.auth.refreshSession();
      
      // Hard redirect to force reload
      setTimeout(() => {
        window.location.href = '/admin/dashboard';
      }, 1500);

    } catch (err: any) {
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-6">Admin Setup</h1>
        
        {error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        ) : (
          <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
            {status}
          </div>
        )}
      </div>
    </div>
  );
}