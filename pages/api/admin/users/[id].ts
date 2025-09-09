import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  // PUT - Update user
  if (req.method === 'PUT') {
    try {
      const { full_name, role, department, phone, status } = req.body;

      // Update profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          full_name,
          role,
          department,
          phone,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', id)
        .select()
        .single();

      if (profileError) throw profileError;

      // Update auth user metadata
      await supabaseAdmin.auth.admin.updateUserById(id as string, {
        user_metadata: {
          full_name,
          role,
        },
      });

      return res.status(200).json({
        ...profile,
        id: profile.user_id,
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - Delete user
  if (req.method === 'DELETE') {
    try {
      // Delete auth user (will cascade delete profile due to foreign key)
      const { error } = await supabaseAdmin.auth.admin.deleteUser(id as string);
      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - Reset password
  if (req.method === 'POST') {
    try {
      const { action, newPassword } = req.body;

      if (action === 'reset-password') {
        // Set new password
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id as string, {
          password: newPassword,
        });

        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Password reset successfully' });
      }

      if (action === 'send-reset-email') {
        // Get user email
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('email')
          .eq('user_id', id)
          .single();

        if (!profile) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Send password reset email
        const { error } = await supabaseAdmin.auth.resetPasswordForEmail(profile.email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin-dashboard-p750a8z28-shureprint.vercel.app'}/admin/reset-password`,
        });

        if (error) throw error;

        return res.status(200).json({ success: true, message: 'Password reset email sent' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}