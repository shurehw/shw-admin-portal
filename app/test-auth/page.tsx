'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAuthPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testGoogleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      setResult({ data, error });
    } catch (error: any) {
      setResult({ error: error.message });
    }
    setLoading(false);
  };

  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    setResult({ session, error });
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setResult({ message: 'Signed out', error });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testGoogleLogin}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Google Login
        </button>
        
        <button
          onClick={checkSession}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-4"
        >
          Check Session
        </button>
        
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ml-4"
        >
          Sign Out
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
        <p>Callback URL: {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'N/A'}</p>
      </div>
    </div>
  );
}