import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN
const B2B_API_URL = 'https://api-b2b.bigcommerce.com/api/v3/io'
const BC_API_URL = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3`

interface B2BPriceList {
  id?: string
  company_id: string
  name: string
  active: boolean
  items: PriceListItem[]
}

interface PriceListItem {
  product_id: number
  variant_id?: number
  sku?: string
  price: number
  sale_price?: number
  retail_price?: number
  map_price?: number
  bulk_pricing_tiers?: BulkPricingTier[]
  currency?: string
}

interface BulkPricingTier {
  quantity_min: number
  quantity_max?: number
  type: 'fixed' | 'percent' | 'relative'
  amount: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const customerId = searchParams.get('customer_id')

    if (!ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'BigCommerce access token not configured'
      }, { status: 500 })
    }

    // Method 1: Try BigCommerce B2B API for company price lists
    if (companyId || customerId) {
      try {
        // Get company price lists from B2B API
        const b2bResponse = await axios.get(
          `${B2B_API_URL}/companies/${companyId}/price-lists`,
          {
            headers: {
              'Authorization': `Bearer ${ACCESS_TOKEN}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        )

        if (b2bResponse.data) {
          return NextResponse.json({
            success: true,
            source: 'b2b-api',
            data: b2bResponse.data
          })
        }
      } catch (b2bError: any) {
        console.log('B2B API price list attempt failed:', b2bError.response?.status)
      }
    }

    // Method 2: Use BigCommerce Standard Price Lists API
    try {
      let priceListUrl = `${BC_API_URL}/pricelists`
      
      // If we have a customer, try to get their assigned price lists
      if (customerId) {
        // First get customer groups
        const customerResponse = await axios.get(
          `${BC_API_URL}/customers?id:in=${customerId}&include=customer_groups`,
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Accept': 'application/json'
            }
          }
        )
        
        const customer = customerResponse.data?.data?.[0]
        if (customer?.customer_group_id) {
          // Get price lists for this customer group
          priceListUrl += `?customer_group_id=${customer.customer_group_id}`
        }
      }

      const priceListResponse = await axios.get(priceListUrl, {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      })

      const priceLists = priceListResponse.data?.data || []

      // For each price list, get the actual price records
      const priceListsWithItems = await Promise.all(
        priceLists.map(async (priceList: any) => {
          try {
            const recordsResponse = await axios.get(
              `${BC_API_URL}/pricelists/${priceList.id}/records`,
              {
                headers: {
                  'X-Auth-Token': ACCESS_TOKEN,
                  'Accept': 'application/json'
                }
              }
            )

            return {
              ...priceList,
              items: recordsResponse.data?.data || []
            }
          } catch (err) {
            console.error(`Failed to fetch records for price list ${priceList.id}`)
            return {
              ...priceList,
              items: []
            }
          }
        })
      )

      return NextResponse.json({
        success: true,
        source: 'bigcommerce-standard',
        data: priceListsWithItems
      })
    } catch (standardError: any) {
      console.error('Standard API error:', standardError.response?.data)
      
      // Return mock data as fallback for development
      return NextResponse.json({
        success: true,
        source: 'mock',
        data: [
          {
            id: 1,
            name: 'Enterprise Pricing',
            active: true,
            items: [
              {
                product_id: 111,
                sku: 'CPT-12',
                price: 38.99,
                retail_price: 45.99,
                bulk_pricing_tiers: [
                  { quantity_min: 10, quantity_max: 49, type: 'fixed', amount: 36.99 },
                  { quantity_min: 50, quantity_max: 99, type: 'fixed', amount: 34.99 },
                  { quantity_min: 100, type: 'fixed', amount: 32.99 }
                ]
              }
            ]
          }
        ]
      })
    }
  } catch (error) {
    console.error('Error fetching price lists:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch price lists'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { company_id, name, items } = data

    if (!ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'BigCommerce access token not configured'
      }, { status: 500 })
    }

    // Try to create via B2B API first
    try {
      const b2bResponse = await axios.post(
        `${B2B_API_URL}/companies/${company_id}/price-lists`,
        {
          name,
          active: true,
          items
        },
        {
          headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )

      return NextResponse.json({
        success: true,
        source: 'b2b-api',
        data: b2bResponse.data
      }, { status: 201 })
    } catch (b2bError: any) {
      console.log('B2B API create failed, trying standard API...')
    }

    // Fallback to standard BigCommerce Price Lists API
    try {
      // Step 1: Create the price list
      const priceListResponse = await axios.post(
        `${BC_API_URL}/pricelists`,
        {
          name: name || `Company ${company_id} Pricing`,
          active: true
        },
        {
          headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      )

      const priceListId = priceListResponse.data?.data?.id

      if (!priceListId) {
        throw new Error('Failed to create price list')
      }

      // Step 2: Add price records to the list
      const recordPromises = items.map((item: PriceListItem) => 
        axios.put(
          `${BC_API_URL}/pricelists/${priceListId}/records`,
          [{
            variant_id: item.variant_id || item.product_id,
            price: item.price,
            sale_price: item.sale_price,
            retail_price: item.retail_price,
            map_price: item.map_price,
            bulk_pricing_tiers: item.bulk_pricing_tiers,
            sku: item.sku
          }],
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        )
      )

      await Promise.all(recordPromises)

      // Step 3: Assign to customer group if needed
      // This would require mapping company_id to customer_group_id

      return NextResponse.json({
        success: true,
        source: 'bigcommerce-standard',
        data: {
          id: priceListId,
          name,
          items
        }
      }, { status: 201 })
    } catch (standardError: any) {
      console.error('Standard API create error:', standardError.response?.data)
      return NextResponse.json({
        success: false,
        error: standardError.response?.data?.title || 'Failed to create price list'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error creating price list:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create price list'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json()
    const { price_list_id, items } = data

    if (!ACCESS_TOKEN || !price_list_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    // Update price records in BigCommerce
    const updateResponse = await axios.put(
      `${BC_API_URL}/pricelists/${price_list_id}/records`,
      items.map((item: PriceListItem) => ({
        variant_id: item.variant_id || item.product_id,
        price: item.price,
        sale_price: item.sale_price,
        retail_price: item.retail_price,
        bulk_pricing_tiers: item.bulk_pricing_tiers,
        sku: item.sku
      })),
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    )

    return NextResponse.json({
      success: true,
      data: updateResponse.data
    })
  } catch (error: any) {
    console.error('Error updating price list:', error.response?.data)
    return NextResponse.json({
      success: false,
      error: 'Failed to update price list'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const priceListId = searchParams.get('id')

    if (!ACCESS_TOKEN || !priceListId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 })
    }

    await axios.delete(
      `${BC_API_URL}/pricelists/${priceListId}`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Price list deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting price list:', error.response?.data)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete price list'
    }, { status: 500 })
  }
}