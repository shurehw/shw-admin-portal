'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixAuthPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    if (user?.email) {
      setEmail(user.email);
    }
  };

  const fixAdmin = async () => {
    if (!email) {
      setStatus('Please enter your email');
      return;
    }

    setLoading(true);
    setStatus('Fixing admin access...');

    try {
      // First, ensure you're logged in with this email
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user || user.email !== email) {
        setStatus(`Please sign in with ${email} first`);
        setLoading(false);
        return;
      }

      // Call the fix endpoint
      const response = await fetch(`/api/auth/fix-admin?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok) {
        setStatus(`Success! ${data.message}. Please refresh the page.`);
        // Force refresh auth
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 2000);
      } else {
        setStatus(`Error: ${data.error}`);
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/admin/fix-auth`,
      },
    });
    
    if (error) {
      setStatus(`Sign in error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Fix Admin Access</h1>
        
        {currentUser && (
          <div className="mb-4 p-3 bg-green-50 text-green-800 rounded-md text-sm">
            Signed in as: {currentUser.email}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jacob@shurehw.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            onClick={fixAdmin}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Fixing...' : 'Make Me Admin'}
          </button>

          {!currentUser && (
            <div className="text-center p-4 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800 font-semibold mb-3">You must sign in first!</p>
              <button
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Sign in with Google
              </button>
            </div>
          )}

          {status && (
            <div className={`p-3 rounded-md text-sm ${
              status.includes('Success') ? 'bg-green-50 text-green-800' : 
              status.includes('Error') ? 'bg-red-50 text-red-800' : 
              'bg-blue-50 text-blue-800'
            }`}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}