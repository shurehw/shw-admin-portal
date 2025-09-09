import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Get the current user from the request
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Check if user_profiles table exists
    const { data: tables } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (!tables) {
      // Create the user_profiles table if it doesn't exist
      const { error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS user_profiles (
            user_id UUID PRIMARY KEY,
            email TEXT NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'viewer',
            department TEXT,
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.error('Error creating table:', createError);
      }
    }

    // Get the user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      // Update to admin
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id)
        .select()
        .single();
      
      return NextResponse.json({ message: 'Updated to admin', profile: data });
    } else {
      // Create admin profile
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: user.id,
          email: email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          role: 'admin',
          status: 'active'
        })
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ message: 'Created admin profile', profile: data });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}