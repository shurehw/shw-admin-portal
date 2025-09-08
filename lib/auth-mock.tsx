'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Valid demo accounts
const validAccounts = [
  { email: 'admin@shurehw.com', password: 'admin123', name: 'Admin User', role: 'admin', isAdmin: true },
  { email: 'sales@shurehw.com', password: 'sales123', name: 'Sales Rep', role: 'sales_rep', isAdmin: true },
  { email: 'cs@shurehw.com', password: 'cs123', name: 'Customer Service', role: 'customer_service', isAdmin: true },
  { email: 'production@shurehw.com', password: 'prod123', name: 'Production Team', role: 'production', isAdmin: true },
  { email: 'art@shurehw.com', password: 'art123', name: 'Art Department', role: 'art_team', isAdmin: true }
];

// Create context
const SessionContext = createContext<{
  data: any | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: (session: any) => void;
}>({
  data: null,
  status: 'unauthenticated',
  update: () => {}
});

// Mock useSession hook
export function useSession() {
  return useContext(SessionContext);
}

// Mock SessionProvider
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage)
    const storedSession = localStorage.getItem('mockSession');
    if (storedSession) {
      setSession(JSON.parse(storedSession));
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  const update = (newSession: any) => {
    if (newSession) {
      localStorage.setItem('mockSession', JSON.stringify(newSession));
      setSession(newSession);
      setStatus('authenticated');
    } else {
      localStorage.removeItem('mockSession');
      setSession(null);
      setStatus('unauthenticated');
    }
  };

  return (
    <SessionContext.Provider value={{ data: session, status, update }}>
      {children}
    </SessionContext.Provider>
  );
}

// Mock signIn function
export async function signIn(provider?: string, options?: any) {
  console.log('Mock signIn called:', provider, options);
  
  // Validate credentials
  const account = validAccounts.find(
    acc => acc.email === options?.email && acc.password === options?.password
  );

  if (account) {
    const session = {
      user: {
        email: account.email,
        name: account.name,
        role: account.role,
        isAdmin: account.isAdmin
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Store session
    localStorage.setItem('mockSession', JSON.stringify(session));
    
    // Redirect after successful login
    setTimeout(() => {
      window.location.href = '/admin/dashboard';
    }, 100);
    
    return { error: null, status: 200, ok: true, url: '/admin/dashboard' };
  }
  
  return { error: 'Invalid credentials', status: 401, ok: false, url: null };
}

// Mock signOut function  
export async function signOut(options?: any) {
  console.log('Mock signOut called:', options);
  localStorage.removeItem('mockSession');
  
  if (options?.redirect !== false) {
    window.location.href = '/admin/login';
  }
  
  return { url: '/admin/login' };
}