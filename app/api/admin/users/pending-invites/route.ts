import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmeWpqdmJxbXl5dWh6cG94bHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTUzMjksImV4cCI6MjA3MDM3MTMyOX0.yXS4pbap1yVfhidFCN4MZkZE4lbkF5yS9V-nR88V1kc',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              cookieStore.set(name, value)
            })
          },
        },
      }
    );

    // Get all pending invites
    const { data: invites, error } = await supabase
      .from('pending_invites')
      .select('*')
      .eq('status', 'pending')
      .order('invited_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending invites:', error);
      return NextResponse.json({ error: 'Failed to fetch pending invites' }, { status: 500 });
    }

    // Get all existing user emails to filter out invites for users who already signed up
    const { data: existingUsers } = await supabase
      .from('user_profiles')
      .select('email');

    const existingEmails = new Set(existingUsers?.map(u => u.email.toLowerCase()) || []);

    // Filter out invites for users who already exist
    const activeInvites = (invites || []).filter(
      invite => !existingEmails.has(invite.email.toLowerCase())
    );

    // Clean up database by removing invites for users who already signed up
    const invitesToRemove = (invites || []).filter(
      invite => existingEmails.has(invite.email.toLowerCase())
    );

    if (invitesToRemove.length > 0) {
      await supabase
        .from('pending_invites')
        .delete()
        .in('id', invitesToRemove.map(i => i.id));
    }

    return NextResponse.json(activeInvites);
  } catch (error) {
    console.error('Error in pending invites API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}