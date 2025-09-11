import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return NextResponse.json({ 
        error: 'Error fetching profile', 
        details: fetchError 
      }, { status: 500 });
    }

    if (!existingProfile) {
      // Create admin profile for jacob@shurehw.com
      if (user.email === 'jacob@shurehw.com') {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: user.id,
            email: user.email,
            full_name: 'Jacob Shure',
            role: 'admin',
            department: 'admin',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json({ 
            error: 'Failed to create profile', 
            details: createError 
          }, { status: 500 });
        }

        return NextResponse.json({ 
          message: 'Admin profile created successfully',
          profile: newProfile 
        });
      } else {
        return NextResponse.json({ 
          error: 'No profile found and not authorized to create admin profile' 
        }, { status: 403 });
      }
    }

    // Update existing profile to admin if it's jacob@shurehw.com
    if (user.email === 'jacob@shurehw.com' && existingProfile.role !== 'admin') {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          role: 'admin',
          department: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating profile:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update profile', 
          details: updateError 
        }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Profile updated to admin',
        profile: updatedProfile 
      });
    }

    return NextResponse.json({ 
      message: 'Profile already exists and is configured correctly',
      profile: existingProfile 
    });
  } catch (error) {
    console.error('Error in fix-admin API:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error 
    }, { status: 500 });
  }
}