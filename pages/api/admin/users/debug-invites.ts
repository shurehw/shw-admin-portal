import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if table exists and get all records
    const { data, error } = await supabaseAdmin
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