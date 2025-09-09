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

    const { invites } = req.body;
    
    if (!invites || !Array.isArray(invites)) {
      return res.status(400).json({ error: 'Invalid invites data' });
    }

    // Save each invite to the pending_invites table
    const savedInvites = [];
    for (const invite of invites) {
      try {
        // Save to pending_invites table
        const admin = supabaseAdmin();
        const { data, error } = await admin
          .from('pending_invites')
          .upsert({
            email: invite.email.toLowerCase(),
            role: invite.role,
            status: 'pending'
          }, {
            onConflict: 'email'
          })
          .select()
          .single();

        if (!error) {
          savedInvites.push(data);
        }
      } catch (err) {
        console.error(`Error saving invite for ${invite.email}:`, err);
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully invited ${savedInvites.length} user(s). They can now sign in with Google.`,
      invited: savedInvites 
    });
  } catch (error) {
    console.error('Error saving invites:', error);
    res.status(500).json({ error: 'Failed to save invites' });
  }
}
