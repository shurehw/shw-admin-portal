import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return mock data for development
    return NextResponse.json({
      success: true,
      data: [
        { id: 111, name: 'Industrial Widget Pro', sku: 'IWP-001', base_price: 45.99, category: 'Hardware' },
        { id: 112, name: 'Commercial Fastener Set', sku: 'CFS-002', base_price: 89.99, category: 'Fasteners' },
        { id: 113, name: 'Heavy Duty Bracket', sku: 'HDB-003', base_price: 34.50, category: 'Brackets' },
        { id: 114, name: 'Premium Lock Assembly', sku: 'PLA-004', base_price: 156.00, category: 'Locks' },
        { id: 115, name: 'Stainless Steel Hinge', sku: 'SSH-005', base_price: 28.75, category: 'Hinges' },
        { id: 116, name: 'Industrial Cable 100ft', sku: 'IC-006', base_price: 234.99, category: 'Cables' },
        { id: 117, name: 'Safety Equipment Kit', sku: 'SEK-007', base_price: 189.00, category: 'Safety' },
        { id: 118, name: 'Precision Tool Set', sku: 'PTS-008', base_price: 567.50, category: 'Tools' },
        { id: 119, name: 'Bulk Screws Pack', sku: 'BSP-009', base_price: 19.99, category: 'Fasteners' },
        { id: 120, name: 'Aluminum Panel 4x8', sku: 'AP-010', base_price: 145.00, category: 'Materials' }
      ]
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products'
    }, { status: 500 })
  }
}