'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authData } } = await supabase.auth.getUser();
      setAuthUser(authData);
      
      if (authData) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', authData.id)
          .single();
        setProfile(profileData);
      }
    }
    checkAuth();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Authentication</h1>
      
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-semibold mb-2">Auth Context User:</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
        <p className="mt-2">Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <h2 className="font-semibold mb-2">Supabase Auth User:</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
          {authUser ? JSON.stringify({
            id: authUser.id,
            email: authUser.email,
            provider: authUser.app_metadata?.provider,
            metadata: authUser.user_metadata
          }, null, 2) : 'Not logged in'}
        </pre>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-2">User Profile from DB:</h2>
        <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">
          {profile ? JSON.stringify(profile, null, 2) : 'No profile found'}
        </pre>
      </div>

      {profile && profile.role !== 'admin' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Your role is currently "{profile.role}". To see admin features, your role needs to be "admin".
          </p>
        </div>
      )}
    </div>
  );
}