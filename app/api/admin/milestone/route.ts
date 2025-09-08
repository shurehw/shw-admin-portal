import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // In a real application, this would update the database
    console.log('Adding milestone:', body);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Milestone added successfully',
      milestone: body 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add milestone' },
      { status: 500 }
    );
  }
}