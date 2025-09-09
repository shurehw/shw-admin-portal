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

    const savedInvites = [];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin-dashboard-mcl1q2vbc-shureprint.vercel.app';

    for (const invite of invites) {
      try {
        const admin = supabaseAdmin();
        // Save to pending_invites table
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

        if (error) {
          console.error(`Database error for ${invite.email}:`, error);
        } else if (data) {
          console.log(`Successfully saved invite for ${invite.email}`, data);
          
          // Send invite email using Supabase Auth
          const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
            invite.email,
            {
              data: {
                role: invite.role,
                invited_by: 'admin'
              },
              redirectTo: `${appUrl}/admin/login`
            }
          );

          if (inviteError) {
            console.error(`Error sending email to ${invite.email}:`, inviteError);
            // Even if email fails, the invite is saved
          }

          savedInvites.push(data);
        }
      } catch (err) {
        console.error(`Error processing invite for ${invite.email}:`, err);
      }
    }
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully invited ${savedInvites.length} user(s). They will receive an email invitation.`,
      invited: savedInvites 
    });
  } catch (error) {
    console.error('Error sending invites:', error);
    res.status(500).json({ error: 'Failed to send invites' });
  }
}
