import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { supabaseAdmin } from '@/lib/clients/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
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

    const { inviteId } = req.body;
    
    if (!inviteId) {
      return res.status(400).json({ error: 'Invite ID is required' });
    }

    // Delete the pending invite
    const admin = supabaseAdmin();
    const { error } = await admin
      .from('pending_invites')
      .delete()
      .eq('id', inviteId);

    if (error) {
      console.error('Error cancelling invite:', error);
      return res.status(500).json({ error: 'Failed to cancel invite' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Invite cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling invite:', error);
    res.status(500).json({ error: 'Failed to cancel invite' });
  }
}
