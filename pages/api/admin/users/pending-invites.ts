import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching pending invites...');
    const { data, error } = await supabaseAdmin
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