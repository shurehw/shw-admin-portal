import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/clients/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require authenticated admin
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return res.status(401).json({ error: 'Unauthorized' });
    const { data: me } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();
    if (me?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // Check if table exists and get all records
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('pending_invites')
      .select('*');

    if (error) {
      return res.status(500).json({ 
        error: 'Table error', 
        details: error.message,
        code: error.code 
      });
    }

    res.status(200).json({ 
      success: true,
      count: data?.length || 0,
      invites: data || []
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Server error', 
      details: error.message 
    });
  }
}
