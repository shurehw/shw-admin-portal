import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin-dashboard-mcl1q2vbc-shureprint.vercel.app';

    // Get the pending invite
    const { data: invite, error: fetchError } = await supabaseAdmin
      .from('pending_invites')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (fetchError || !invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    // Resend the email
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          role: invite.role,
          invited_by: 'admin'
        },
        redirectTo: `${appUrl}/admin/login`
      }
    );

    if (inviteError) {
      console.error(`Error resending invite to ${email}:`, inviteError);
      return res.status(500).json({ error: 'Failed to resend invite email' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Successfully resent invite to ${email}` 
    });
  } catch (error) {
    console.error('Error resending invite:', error);
    res.status(500).json({ error: 'Failed to resend invite' });
  }
}
