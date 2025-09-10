import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete users' }, { status: 403 });
    }

    // Don't allow deleting yourself
    if (params.id === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if this is a pending invite or actual user
    if (params.id.startsWith('invite-')) {
      // Delete pending invite
      const inviteId = params.id.replace('invite-', '');
      const { error } = await supabase
        .from('pending_invites')
        .delete()
        .eq('id', inviteId);

      if (error) {
        console.error('Error deleting invite:', error);
        return NextResponse.json({ error: 'Failed to delete invite' }, { status: 500 });
      }
    } else {
      // Delete user profile
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', params.id);

      if (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
      }

      // Note: We don't delete from auth.users as that requires service role
      // The user profile deletion is sufficient for access control
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in delete user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
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

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role and permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, department')
      .eq('user_id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';
    const isManager = ['sales_manager', 'cs_manager', 'production_manager'].includes(profile?.role || '');
    
    if (!profile || (!isAdmin && !isManager)) {
      return NextResponse.json({ error: 'Only admins and managers can update users' }, { status: 403 });
    }
    
    // If user is a manager, check if they can edit this specific user
    if (isManager && !isAdmin) {
      // Get the target user's department
      const { data: targetUser } = await supabase
        .from('user_profiles')
        .select('department')
        .eq('user_id', params.id)
        .single();
      
      // Managers can only edit users in their department
      if (targetUser?.department !== profile.department) {
        return NextResponse.json({ error: 'Managers can only edit users in their department' }, { status: 403 });
      }
      
      // Managers cannot change users to admin role
      if (body.role === 'admin') {
        return NextResponse.json({ error: 'Only admins can assign admin role' }, { status: 403 });
      }
    }

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        full_name: body.full_name,
        role: body.role,
        department: body.department,
        phone: body.phone,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in update user API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}