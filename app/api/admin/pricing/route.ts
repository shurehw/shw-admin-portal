import { NextRequest, NextResponse } from 'next/server'

interface PriceListItem {
  id: string
  company_id: number
  company_name: string
  product_id: number
  product_name: string
  product_sku: string
  retail_price: number
  custom_price: number
  discount_percent: number
  min_quantity: number
  effective_date: string
  expires_date: string | null
  created_at: string
  updated_at: string
}

// Mock data - in a real app this would be in a database
let mockPriceList: PriceListItem[] = [
  {
    id: '1',
    company_id: 1,
    company_name: 'Marriott Hotels',
    product_id: 1,
    product_name: 'Commercial Paper Towels - 12 Pack',
    product_sku: 'CPT-12',
    retail_price: 45.99,
    custom_price: 38.99,
    discount_percent: 15.2,
    min_quantity: 10,
    effective_date: '2024-01-01',
    expires_date: '2024-12-31',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    company_id: 1,
    company_name: 'Marriott Hotels',
    product_id: 2,
    product_name: 'Heavy Duty Trash Bags - 100ct',
    product_sku: 'HDTB-100',
    retail_price: 72.99,
    custom_price: 65.99,
    discount_percent: 9.6,
    min_quantity: 5,
    effective_date: '2024-01-01',
    expires_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    company_id: 2,
    company_name: 'Hilton Hotels',
    product_id: 1,
    product_name: 'Commercial Paper Towels - 12 Pack',
    product_sku: 'CPT-12',
    retail_price: 45.99,
    custom_price: 41.99,
    discount_percent: 8.7,
    min_quantity: 20,
    effective_date: '2024-01-01',
    expires_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const productId = searchParams.get('product_id')

    let filteredPrices = mockPriceList

    // Filter by company if specified
    if (companyId) {
      filteredPrices = filteredPrices.filter(item => item.company_id === parseInt(companyId))
    }

    // Filter by product if specified
    if (productId) {
      filteredPrices = filteredPrices.filter(item => item.product_id === parseInt(productId))
    }

    // Filter out expired prices unless specifically requested
    const includeExpired = searchParams.get('include_expired') === 'true'
    if (!includeExpired) {
      filteredPrices = filteredPrices.filter(item => 
        !item.expires_date || new Date(item.expires_date) > new Date()
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredPrices,
      count: filteredPrices.length
    })
  } catch (error) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pricing data'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Validate required fields
    const { company_id, product_id, custom_price, min_quantity = 1, effective_date } = data
    
    if (!company_id || !product_id || !custom_price || !effective_date) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: company_id, product_id, custom_price, effective_date'
      }, { status: 400 })
    }

    // Check if price rule already exists for this company/product combination
    const existingRule = mockPriceList.find(item => 
      item.company_id === company_id && item.product_id === product_id
    )

    if (existingRule) {
      return NextResponse.json({
        success: false,
        error: 'Price rule already exists for this company and product combination'
      }, { status: 409 })
    }

    // Mock product and company data - in real app would fetch from database
    const mockProducts = [
      { id: 1, name: 'Commercial Paper Towels - 12 Pack', sku: 'CPT-12', retail_price: 45.99 },
      { id: 2, name: 'Heavy Duty Trash Bags - 100ct', sku: 'HDTB-100', retail_price: 72.99 },
      { id: 3, name: 'Industrial Hand Soap - 5L', sku: 'IHS-5L', retail_price: 28.50 },
      { id: 4, name: 'Disposable Gloves - 500ct', sku: 'DG-500', retail_price: 35.75 }
    ]

    const mockCompanies = [
      { id: 1, name: 'Marriott Hotels' },
      { id: 2, name: 'Hilton Hotels' },
      { id: 3, name: 'Local Restaurant Group' },
      { id: 4, name: 'ABC Manufacturing' }
    ]

    const product = mockProducts.find(p => p.id === product_id)
    const company = mockCompanies.find(c => c.id === company_id)

    if (!product || !company) {
      return NextResponse.json({
        success: false,
        error: 'Product or company not found'
      }, { status: 404 })
    }

    // Calculate discount percentage
    const discountPercent = ((product.retail_price - custom_price) / product.retail_price) * 100

    const newPriceItem: PriceListItem = {
      id: Date.now().toString(),
      company_id,
      company_name: company.name,
      product_id,
      product_name: product.name,
      product_sku: product.sku,
      retail_price: product.retail_price,
      custom_price: parseFloat(custom_price),
      discount_percent: discountPercent,
      min_quantity: parseInt(min_quantity),
      effective_date,
      expires_date: data.expires_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockPriceList.push(newPriceItem)

    return NextResponse.json({
      success: true,
      data: newPriceItem,
      message: 'Price rule created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating price rule:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create price rule'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { id, custom_price, min_quantity, effective_date, expires_date } = data

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing price rule ID'
      }, { status: 400 })
    }

    const existingIndex = mockPriceList.findIndex(item => item.id === id)
    
    if (existingIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Price rule not found'
      }, { status: 404 })
    }

    const existingItem = mockPriceList[existingIndex]
    
    // Update fields if provided
    if (custom_price !== undefined) {
      existingItem.custom_price = parseFloat(custom_price)
      existingItem.discount_percent = ((existingItem.retail_price - existingItem.custom_price) / existingItem.retail_price) * 100
    }
    
    if (min_quantity !== undefined) existingItem.min_quantity = parseInt(min_quantity)
    if (effective_date !== undefined) existingItem.effective_date = effective_date
    if (expires_date !== undefined) existingItem.expires_date = expires_date
    
    existingItem.updated_at = new Date().toISOString()
    mockPriceList[existingIndex] = existingItem

    return NextResponse.json({
      success: true,
      data: existingItem,
      message: 'Price rule updated successfully'
    })
  } catch (error) {
    console.error('Error updating price rule:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update price rule'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Missing price rule ID'
      }, { status: 400 })
    }

    const existingIndex = mockPriceList.findIndex(item => item.id === id)
    
    if (existingIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Price rule not found'
      }, { status: 404 })
    }

    mockPriceList.splice(existingIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Price rule deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting price rule:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete price rule'
    }, { status: 500 })
  }
}