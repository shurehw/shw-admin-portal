'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/supabase';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { userPermissions, defaultRole, allowedDomains } from '@/config/user-permissions';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: 'Not implemented' }),
  signOut: async () => {},
  refreshProfile: async () => {},
  isAdmin: false,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a mock during static generation
    return {
      user: null,
      loading: true,
      signIn: async () => ({ error: 'Not implemented' }),
      signOut: async () => {},
      refreshProfile: async () => {},
      isAdmin: false,
    };
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active sessions and sets the user
    checkUser();

    // Listen for auth changes
    const supabase = getSupabaseBrowser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const supabase = getSupabaseBrowser();
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Checking user session:', session?.user?.email, error);
      
      if (error) {
        console.error('Session error:', error);
        // Try to refresh the session
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
        if (refreshedSession?.user) {
          await fetchUserProfile(refreshedSession.user.id);
        }
      } else if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      const supabase = getSupabaseBrowser();
      console.log('Fetching user profile for userId:', userId);
      
      // First check if user_profiles table exists and has data
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      console.log('Profile fetch result:', profile, 'Error:', error);

      if (error) {
        // If profile doesn't exist, create one with default values
        if (error.code === 'PGRST116') {
          console.log('Profile not found, attempting to create one');
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user) {
            // Check if email domain is allowed
            const emailDomain = authUser.user.email?.split('@')[1];
            
            if (emailDomain && !allowedDomains.includes(emailDomain)) {
              // Sign out unauthorized user
              await supabase.auth.signOut();
              console.error('Unauthorized email domain:', emailDomain);
              return;
            }
            // Extract name from Google profile or email
            const fullName = authUser.user.user_metadata?.full_name || 
                           authUser.user.user_metadata?.name ||
                           authUser.user.email?.split('@')[0];
            
            // Check if this is the first user (make them admin)
            const { count } = await supabase
              .from('user_profiles')
              .select('*', { count: 'exact', head: true });
            
            const isFirstUser = count === 0;
            
            // Check for pending invite first
            const userEmail = authUser.user.email?.toLowerCase() || '';
            let assignedRole = defaultRole;
            
            // Check pending_invites table
            const { data: pendingInvite } = await supabase
              .from('pending_invites')
              .select('role')
              .eq('email', userEmail)
              .single();
            
            if (pendingInvite) {
              assignedRole = pendingInvite.role;
              // Update invite status to accepted
              await supabase
                .from('pending_invites')
                .update({ status: 'accepted' })
                .eq('email', userEmail);
            } else {
              // Fall back to config file
              assignedRole = userPermissions[userEmail] || defaultRole;
            }
            
            const newProfile = {
              user_id: userId,
              email: authUser.user.email,
              full_name: fullName,
              role: isFirstUser ? 'admin' : assignedRole as const,
              status: 'active' as const,
            };
            
            const { data: createdProfile } = await supabase
              .from('user_profiles')
              .insert([newProfile])
              .select()
              .single();
            
            if (createdProfile) {
              setUser({
                id: userId,
                email: createdProfile.email,
                full_name: createdProfile.full_name,
                role: createdProfile.role,
                roles: [createdProfile.role], // Add roles array
                department: createdProfile.department,
                phone: createdProfile.phone,
                status: createdProfile.status,
                created_at: createdProfile.created_at,
                last_sign_in_at: new Date().toISOString(),
              });
            }
          }
        }
        return;
      }

      if (profile) {
        // Check domain for existing users too
        const emailDomain = profile.email?.split('@')[1];
        
        if (emailDomain && !allowedDomains.includes(emailDomain)) {
          await supabase.auth.signOut();
          console.error('Unauthorized email domain:', emailDomain);
          return;
        }
        
        setUser({
          id: userId,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          roles: [profile.role], // Add roles array
          department: profile.department,
          phone: profile.phone,
          status: profile.status,
          created_at: profile.created_at,
          last_sign_in_at: new Date().toISOString(),
        });
      } else {
        // If we can't find or create a profile, at least set basic user info
        console.log('Setting basic user info as fallback');
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          setUser({
            id: userId,
            email: authUser.user.email || '',
            full_name: authUser.user.user_metadata?.full_name || '',
            role: 'admin', // Default to admin for jacob@shurehw.com
            roles: ['admin'],
            department: 'admin',
            phone: '',
            status: 'active',
            created_at: authUser.user.created_at || new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Even on error, try to set basic user info
      const supabase = getSupabaseBrowser();
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser?.user) {
        console.log('Setting fallback user data due to error');
        setUser({
          id: userId,
          email: authUser.user.email || '',
          full_name: authUser.user.user_metadata?.full_name || '',
          role: 'admin', // Default to admin
          roles: ['admin'],
          department: 'admin',
          phone: '',
          status: 'active',
          created_at: authUser.user.created_at || new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
        });
      }
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        await fetchUserProfile(data.user.id);
        router.push('/admin/dashboard');
        return { error: null };
      }

      return { error: 'Sign in failed' };
    } catch (error: any) {
      return { error: error.message || 'An error occurred during sign in' };
    }
  }

  async function signOut() {
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      setUser(null);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  async function refreshProfile() {
    const supabase = getSupabaseBrowser();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchUserProfile(authUser.id);
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshProfile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}