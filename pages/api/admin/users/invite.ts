import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { invites } = req.body;
    
    if (!invites || !Array.isArray(invites)) {
      return res.status(400).json({ error: 'Invalid invites data' });
    }

    // Save each invite to the pending_invites table
    const savedInvites = [];
    for (const invite of invites) {
      try {
        // Save to pending_invites table
        const { data, error } = await supabaseAdmin
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