import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { inviteId } = req.body;
    
    if (!inviteId) {
      return res.status(400).json({ error: 'Invite ID is required' });
    }

    // Delete the pending invite
    const { error } = await supabaseAdmin
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