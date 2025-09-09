import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/clients/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Require authenticated admin
  const supabase = createServerSupabaseClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { data: me, error: meErr } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', session.user.id)
    .single();
  if (meErr || me?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // GET - List all users
  if (req.method === 'GET') {
    try {
      const { data: profiles, error } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get auth users for last sign in info
      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();
      
      // Merge profile and auth data
      const mergedUsers = profiles?.map(profile => {
        const authUser = authUsers?.find(u => u.id === profile.user_id);
        return {
          ...profile,
          id: profile.user_id,
          last_sign_in_at: authUser?.last_sign_in_at,
        };
      }) || [];

      return res.status(200).json(mergedUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Create new user
  if (req.method === 'POST') {
    try {
      const { email, password, full_name, role, department, phone } = req.body;

      // Create auth user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role,
        },
      });

      if (authError) throw authError;

      // Create profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert([{
          user_id: authUser.user.id,
          email,
          full_name,
          role,
          department,
          phone,
          status: 'active',
        }])
        .select()
        .single();

      if (profileError) {
        // Rollback auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        throw profileError;
      }

      return res.status(201).json({
        ...profile,
        id: profile.user_id,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
