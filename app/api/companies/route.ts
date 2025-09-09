import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock data for development - replace with real API call later
    return NextResponse.json({
      success: true,
      data: [
        {
          id: 1,
          name: 'Acme Corporation',
          email: 'purchasing@acme.com',
          status: 'active',
          industry: 'Manufacturing',
          annual_revenue: 5000000,
          employee_count: 250,
          address: '123 Industrial Way, Detroit, MI 48201',
          phone: '(313) 555-0100'
        },
        {
          id: 2,
          name: 'TechStart Solutions',
          email: 'procurement@techstart.com',
          status: 'active',
          industry: 'Technology',
          annual_revenue: 2500000,
          employee_count: 75,
          address: '456 Innovation Blvd, San Francisco, CA 94105',
          phone: '(415) 555-0200'
        },
        {
          id: 3,
          name: 'Global Retail Group',
          email: 'buyer@globalretail.com',
          status: 'active',
          industry: 'Retail',
          annual_revenue: 15000000,
          employee_count: 500,
          address: '789 Commerce St, New York, NY 10013',
          phone: '(212) 555-0300'
        },
        {
          id: 4,
          name: 'BuildRight Construction',
          email: 'orders@buildright.com',
          status: 'active',
          industry: 'Construction',
          annual_revenue: 8000000,
          employee_count: 150,
          address: '321 Builder Ave, Austin, TX 78701',
          phone: '(512) 555-0400'
        },
        {
          id: 5,
          name: 'Healthcare Plus',
          email: 'supplies@healthcareplus.com',
          status: 'pending',
          industry: 'Healthcare',
          annual_revenue: 12000000,
          employee_count: 300,
          address: '654 Medical Plaza, Boston, MA 02108',
          phone: '(617) 555-0500'
        }
      ]
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch companies'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Mock implementation - would save to database in production
    return NextResponse.json({
      success: true,
      data: {
        id: Math.floor(Math.random() * 10000),
        ...data
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create company'
    }, { status: 500 })
  }
}