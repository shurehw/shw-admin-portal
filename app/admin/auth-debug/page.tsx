'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthDebugPage() {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Get user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      setAuthInfo({
        session: session ? {
          userId: session.user.id,
          email: session.user.email,
          provider: session.user.app_metadata?.provider,
          role: session.user.role,
          aud: session.user.aud,
        } : null,
        sessionError: sessionError?.message,
        user: user ? {
          id: user.id,
          email: user.email,
          metadata: user.user_metadata,
          appMetadata: user.app_metadata,
        } : null,
        userError: userError?.message,
      });

      // Try to get profile
      if (session?.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        setProfileInfo({
          profile,
          error: profileError?.message,
        });
      }
    } catch (error: any) {
      console.error('Debug error:', error);
      setAuthInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Debug Info</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Auth Status</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(authInfo, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Profile Status</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(profileInfo, null, 2)}
        </pre>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = '/admin/login';
          }}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}