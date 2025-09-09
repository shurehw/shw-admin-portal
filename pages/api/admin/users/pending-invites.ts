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

    console.log('Fetching pending invites...');
    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from('pending_invites')
      .select('*')
      .eq('status', 'pending')
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invites:', error);
      return res.status(500).json({ error: 'Failed to fetch pending invites', details: error.message });
    }

    console.log('Found pending invites:', data);
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch pending invites' });
  }
}
