import { NextRequest, NextResponse } from 'next/server'

interface CustomerPricing {
  product_id: number
  product_sku: string
  retail_price: number
  customer_price: number
  discount_percent: number
  min_quantity: number
  price_tier?: string
}

// Mock pricing data - in a real app this would query the database
const mockPriceList = [
  {
    id: '1',
    company_id: 1,
    product_id: 1,
    product_sku: 'CPT-12',
    retail_price: 45.99,
    custom_price: 38.99,
    discount_percent: 15.2,
    min_quantity: 10,
    effective_date: '2024-01-01',
    expires_date: '2024-12-31'
  },
  {
    id: '2',
    company_id: 1,
    product_id: 2,
    product_sku: 'HDTB-100',
    retail_price: 72.99,
    custom_price: 65.99,
    discount_percent: 9.6,
    min_quantity: 5,
    effective_date: '2024-01-01',
    expires_date: null
  },
  {
    id: '3',
    company_id: 2,
    product_id: 1,
    product_sku: 'CPT-12',
    retail_price: 45.99,
    custom_price: 41.99,
    discount_percent: 8.7,
    min_quantity: 20,
    effective_date: '2024-01-01',
    expires_date: null
  },
  {
    id: '4',
    company_id: 3,
    product_id: 3,
    product_sku: 'IHS-5L',
    retail_price: 28.50,
    custom_price: 24.99,
    discount_percent: 12.3,
    min_quantity: 12,
    effective_date: '2024-01-01',
    expires_date: null
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const customerId = searchParams.get('customer_id') 
    const productIds = searchParams.get('product_ids')
    const sku = searchParams.get('sku')

    if (!companyId && !customerId) {
      return NextResponse.json({
        success: false,
        error: 'Either company_id or customer_id is required'
      }, { status: 400 })
    }

    // In a real app, you'd map customer_id to company_id via database lookup
    let targetCompanyId = companyId ? parseInt(companyId) : null
    
    if (!targetCompanyId && customerId) {
      // Mock customer to company mapping
      const customerCompanyMap: { [key: string]: number } = {
        '1': 1,  // Customer 1 -> Marriott Hotels (company 1)
        '2': 2,  // Customer 2 -> Hilton Hotels (company 2)
        '3': 3,  // Customer 3 -> Local Restaurant Group (company 3)
        '4': 4   // Customer 4 -> ABC Manufacturing (company 4)
      }
      targetCompanyId = customerCompanyMap[customerId]
    }

    if (!targetCompanyId) {
      return NextResponse.json({
        success: false,
        error: 'No company found for the provided customer'
      }, { status: 404 })
    }

    // Filter prices for the company
    let companyPrices = mockPriceList.filter(item => 
      item.company_id === targetCompanyId &&
      (!item.expires_date || new Date(item.expires_date) > new Date())
    )

    // Filter by specific products if requested
    if (productIds) {
      const productIdArray = productIds.split(',').map(id => parseInt(id.trim()))
      companyPrices = companyPrices.filter(item => 
        productIdArray.includes(item.product_id)
      )
    }

    // Filter by SKU if requested
    if (sku) {
      companyPrices = companyPrices.filter(item => 
        item.product_sku.toLowerCase() === sku.toLowerCase()
      )
    }

    // Transform to customer pricing format
    const customerPricing: CustomerPricing[] = companyPrices.map(item => ({
      product_id: item.product_id,
      product_sku: item.product_sku,
      retail_price: item.retail_price,
      customer_price: item.custom_price,
      discount_percent: item.discount_percent,
      min_quantity: item.min_quantity,
      price_tier: item.discount_percent >= 15 ? 'Premium' : 
                  item.discount_percent >= 10 ? 'Standard' : 'Basic'
    }))

    return NextResponse.json({
      success: true,
      company_id: targetCompanyId,
      data: customerPricing,
      count: customerPricing.length
    })
  } catch (error) {
    console.error('Error fetching customer pricing:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch customer pricing'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { company_id, customer_id, product_ids, quantity = 1 } = data

    if (!company_id && !customer_id) {
      return NextResponse.json({
        success: false,
        error: 'Either company_id or customer_id is required'
      }, { status: 400 })
    }

    if (!product_ids || !Array.isArray(product_ids)) {
      return NextResponse.json({
        success: false,
        error: 'product_ids array is required'
      }, { status: 400 })
    }

    // Map customer to company if needed
    let targetCompanyId = company_id ? parseInt(company_id) : null
    
    if (!targetCompanyId && customer_id) {
      const customerCompanyMap: { [key: string]: number } = {
        '1': 1, '2': 2, '3': 3, '4': 4
      }
      targetCompanyId = customerCompanyMap[customer_id]
    }

    if (!targetCompanyId) {
      return NextResponse.json({
        success: false,
        error: 'No company found for the provided customer'
      }, { status: 404 })
    }

    // Get pricing for the requested products
    const pricingResults = product_ids.map((productId: number) => {
      const priceRule = mockPriceList.find(item => 
        item.company_id === targetCompanyId &&
        item.product_id === productId &&
        (!item.expires_date || new Date(item.expires_date) > new Date())
      )

      // If no custom pricing found, use retail pricing
      if (!priceRule) {
        // Mock retail prices - in real app would fetch from products table
        const retailPrices: { [key: number]: number } = {
          1: 45.99, 2: 72.99, 3: 28.50, 4: 35.75
        }
        
        return {
          product_id: productId,
          retail_price: retailPrices[productId] || 0,
          customer_price: retailPrices[productId] || 0,
          discount_percent: 0,
          min_quantity: 1,
          price_tier: 'Retail',
          has_custom_pricing: false
        }
      }

      return {
        product_id: productId,
        product_sku: priceRule.product_sku,
        retail_price: priceRule.retail_price,
        customer_price: priceRule.custom_price,
        discount_percent: priceRule.discount_percent,
        min_quantity: priceRule.min_quantity,
        price_tier: priceRule.discount_percent >= 15 ? 'Premium' : 
                    priceRule.discount_percent >= 10 ? 'Standard' : 'Basic',
        has_custom_pricing: true,
        quantity_qualifies: quantity >= priceRule.min_quantity
      }
    })

    return NextResponse.json({
      success: true,
      company_id: targetCompanyId,
      data: pricingResults,
      total_savings: pricingResults.reduce((sum, item) => 
        sum + ((item.retail_price - item.customer_price) * quantity), 0
      ),
      requested_quantity: quantity
    })
  } catch (error) {
    console.error('Error calculating customer pricing:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to calculate customer pricing'
    }, { status: 500 })
  }
}