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
        setError('Not signed in - redirecting to login...');
        setTimeout(() => {
          window.location.href = '/admin/login';
        }, 2000);
        return;
      }

      setStatus(`Setting up admin for: ${user.email}`);

      // First, delete any existing profile to start fresh
      await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', user.id);

      // Create new admin profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        setError(`Could not create admin profile: ${insertError.message}`);
        return;
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
        
        {error && (
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}