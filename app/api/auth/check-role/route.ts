import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from the auth header or session
    const authHeader = request.headers.get('authorization');
    const userId = request.nextUrl.searchParams.get('userId');
    const email = request.nextUrl.searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json({ error: 'No user identifier provided' }, { status: 400 });
    }

    // First, try to get the user profile
    let query = supabase.from('user_profiles').select('*');
    
    if (userId) {
      query = query.eq('user_id', userId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: profile, error } = await query.single();

    if (error || !profile) {
      // Profile doesn't exist, create one
      console.log('Profile not found, creating admin profile for:', email || userId);
      
      // For jacob@shurehw.com, always make admin
      const isJacob = email === 'jacob@shurehw.com';
      
      const newProfile = {
        user_id: userId || crypto.randomUUID(),
        email: email || 'unknown@shurehw.com',
        full_name: email ? email.split('@')[0] : 'Admin User',
        role: isJacob ? 'admin' : 'admin', // Default to admin for now
        status: 'active',
        created_at: new Date().toISOString()
      };

      const { data: created, error: createError } = await supabase
        .from('user_profiles')
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({ 
          role: 'admin', 
          message: 'Default admin role (profile creation failed)' 
        });
      }

      return NextResponse.json({ 
        role: created.role,
        profile: created,
        message: 'Profile created' 
      });
    }

    // Profile exists, check if it needs updating
    if (!profile.role || profile.role === null) {
      // Update the profile to have admin role
      const { data: updated, error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('id', profile.id)
        .select()
        .single();

      if (!updateError && updated) {
        return NextResponse.json({ 
          role: 'admin',
          profile: updated,
          message: 'Profile updated with admin role' 
        });
      }
    }

    return NextResponse.json({ 
      role: profile.role || 'admin',
      profile: profile,
      message: 'Profile found' 
    });

  } catch (error) {
    console.error('Error checking user role:', error);
    return NextResponse.json({ 
      role: 'admin',
      message: 'Error checking role, defaulting to admin' 
    });
  }
}