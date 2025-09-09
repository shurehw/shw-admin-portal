import { useState, useEffect } from 'react'

interface PriceListItem {
  product_id: number
  variant_id?: number
  sku?: string
  price: number
  sale_price?: number
  retail_price?: number
  bulk_pricing_tiers?: BulkPricingTier[]
}

interface BulkPricingTier {
  quantity_min: number
  quantity_max?: number
  type: 'fixed' | 'percent' | 'relative'
  amount: number
}

interface B2BPricing {
  loading: boolean
  error: string | null
  priceLists: any[]
  getProductPrice: (productId: number, quantity?: number) => PriceInfo | null
  refreshPricing: () => Promise<void>
}

interface PriceInfo {
  retail_price: number
  customer_price: number
  sale_price?: number
  bulk_price?: number
  discount_percent: number
  tier_name?: string
  minimum_quantity?: number
}

export function useB2BPricing(companyId?: string, customerId?: string) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [priceLists, setPriceLists] = useState<any[]>([])

  useEffect(() => {
    if (companyId || customerId) {
      fetchPriceLists()
    }
  }, [companyId, customerId])

  const fetchPriceLists = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (companyId) params.append('company_id', companyId)
      if (customerId) params.append('customer_id', customerId)

      const response = await fetch(`/api/b2b/price-lists?${params}`)
      const result = await response.json()

      if (result.success) {
        setPriceLists(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch pricing')
      }
    } catch (err) {
      console.error('Error fetching B2B pricing:', err)
      setError('Failed to load pricing')
    } finally {
      setLoading(false)
    }
  }

  const getProductPrice = (productId: number, quantity: number = 1): PriceInfo | null => {
    // Search through all price lists for this product
    for (const priceList of priceLists) {
      if (!priceList.active) continue

      const item = priceList.items?.find((i: PriceListItem) => 
        i.product_id === productId || i.variant_id === productId
      )

      if (item) {
        let customerPrice = item.price
        let bulkPrice = null
        let tierName = 'Standard'

        // Check bulk pricing tiers
        if (item.bulk_pricing_tiers && item.bulk_pricing_tiers.length > 0) {
          const applicableTier = item.bulk_pricing_tiers.find(tier => 
            quantity >= tier.quantity_min && 
            (!tier.quantity_max || quantity <= tier.quantity_max)
          )

          if (applicableTier) {
            if (applicableTier.type === 'fixed') {
              bulkPrice = applicableTier.amount
              customerPrice = applicableTier.amount
            } else if (applicableTier.type === 'percent') {
              bulkPrice = item.price * (1 - applicableTier.amount / 100)
              customerPrice = bulkPrice
            }
            
            // Set tier name based on quantity
            if (quantity >= 100) tierName = 'Volume'
            else if (quantity >= 50) tierName = 'Bulk'
            else if (quantity >= 10) tierName = 'Wholesale'
          }
        }

        const retailPrice = item.retail_price || item.price
        const discountPercent = ((retailPrice - customerPrice) / retailPrice) * 100

        return {
          retail_price: retailPrice,
          customer_price: customerPrice,
          sale_price: item.sale_price,
          bulk_price: bulkPrice,
          discount_percent: discountPercent,
          tier_name: tierName,
          minimum_quantity: item.bulk_pricing_tiers?.[0]?.quantity_min
        }
      }
    }

    return null
  }

  return {
    loading,
    error,
    priceLists,
    getProductPrice,
    refreshPricing: fetchPriceLists
  }
}

// Helper function to calculate total savings for multiple products
export function calculateBulkSavings(
  priceLists: any[],
  products: { id: number; quantity: number }[]
): { total_retail: number; total_customer: number; total_savings: number } {
  let totalRetail = 0
  let totalCustomer = 0

  products.forEach(product => {
    // Find pricing for this product
    for (const priceList of priceLists) {
      if (!priceList.active) continue

      const item = priceList.items?.find((i: PriceListItem) => 
        i.product_id === product.id || i.variant_id === product.id
      )

      if (item) {
        const retailPrice = item.retail_price || item.price
        let customerPrice = item.price

        // Apply bulk pricing if applicable
        if (item.bulk_pricing_tiers) {
          const tier = item.bulk_pricing_tiers.find(t => 
            product.quantity >= t.quantity_min && 
            (!t.quantity_max || product.quantity <= t.quantity_max)
          )

          if (tier) {
            if (tier.type === 'fixed') {
              customerPrice = tier.amount
            } else if (tier.type === 'percent') {
              customerPrice = item.price * (1 - tier.amount / 100)
            }
          }
        }

        totalRetail += retailPrice * product.quantity
        totalCustomer += customerPrice * product.quantity
        break
      }
    }
  })

  return {
    total_retail: totalRetail,
    total_customer: totalCustomer,
    total_savings: totalRetail - totalCustomer
  }
}