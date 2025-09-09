'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingDown, Tag, Package } from 'lucide-react'
import { useB2BPricing } from '@/hooks/useB2BPricing'

interface PricingData {
  product_id: number
  product_sku?: string
  retail_price: number
  customer_price: number
  discount_percent: number
  min_quantity: number
  price_tier?: string
  has_custom_pricing?: boolean
  quantity_qualifies?: boolean
}

interface CustomerPricingProps {
  companyId?: number
  customerId?: number
  productId: number
  quantity?: number
  showRetailPrice?: boolean
  showDiscountPercent?: boolean
  showMinQuantity?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function CustomerPricing({
  companyId,
  customerId,
  productId,
  quantity = 1,
  showRetailPrice = true,
  showDiscountPercent = true,
  showMinQuantity = true,
  size = 'md',
  className = ''
}: CustomerPricingProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPricing()
  }, [companyId, customerId, productId, quantity])

  const fetchPricing = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        product_ids: productId.toString()
      })

      if (companyId) params.append('company_id', companyId.toString())
      if (customerId) params.append('customer_id', customerId.toString())

      const response = await fetch(`/api/customer-pricing?${params}`)
      const result = await response.json()

      if (result.success && result.data.length > 0) {
        setPricing(result.data[0])
      } else {
        setError('No pricing found')
      }
    } catch (err) {
      console.error('Error fetching pricing:', err)
      setError('Failed to load pricing')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        {showRetailPrice && <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>}
      </div>
    )
  }

  if (error || !pricing) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Pricing unavailable
      </div>
    )
  }

  const sizeClasses = {
    sm: { price: 'text-lg', retail: 'text-xs', badge: 'text-xs px-1.5 py-0.5' },
    md: { price: 'text-xl', retail: 'text-sm', badge: 'text-xs px-2 py-1' },
    lg: { price: 'text-2xl', retail: 'text-base', badge: 'text-sm px-3 py-1' }
  }

  const classes = sizeClasses[size]
  
  const hasDiscount = pricing.discount_percent > 0
  const meetsMinQuantity = quantity >= pricing.min_quantity

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Main Price */}
      <div className="flex items-center gap-2">
        <span className={`font-bold ${hasDiscount ? 'text-green-600' : 'text-gray-900'} ${classes.price}`}>
          ${pricing.customer_price.toFixed(2)}
        </span>
        
        {/* Price Tier Badge */}
        {pricing.price_tier && pricing.has_custom_pricing && (
          <span className={`inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 ${classes.badge}`}>
            <Tag className="w-3 h-3 mr-1" />
            {pricing.price_tier}
          </span>
        )}
      </div>

      {/* Retail Price & Discount */}
      {showRetailPrice && hasDiscount && (
        <div className="flex items-center gap-2">
          <span className={`line-through text-gray-500 ${classes.retail}`}>
            ${pricing.retail_price.toFixed(2)}
          </span>
          {showDiscountPercent && (
            <span className={`inline-flex items-center rounded-full font-medium bg-green-100 text-green-800 ${classes.badge}`}>
              <TrendingDown className="w-3 h-3 mr-1" />
              {pricing.discount_percent.toFixed(1)}% off
            </span>
          )}
        </div>
      )}

      {/* Minimum Quantity Warning */}
      {showMinQuantity && pricing.min_quantity > 1 && (
        <div className={`flex items-center gap-1 ${classes.retail}`}>
          <Package className="w-3 h-3" />
          <span className={meetsMinQuantity ? 'text-green-600' : 'text-orange-600'}>
            Min qty: {pricing.min_quantity}
            {!meetsMinQuantity && ` (${pricing.min_quantity - quantity} more needed)`}
          </span>
        </div>
      )}

      {/* Savings Calculation */}
      {hasDiscount && quantity > 1 && (
        <div className={`text-green-600 font-medium ${classes.retail}`}>
          Save ${((pricing.retail_price - pricing.customer_price) * quantity).toFixed(2)} on {quantity} items
        </div>
      )}
    </div>
  )
}

// Bulk pricing component for multiple products
interface BulkPricingProps {
  companyId?: number
  customerId?: number
  products: { id: number; quantity: number }[]
  className?: string
}

export function BulkCustomerPricing({
  companyId,
  customerId,
  products,
  className = ''
}: BulkPricingProps) {
  const [pricing, setPricing] = useState<PricingData[]>([])
  const [loading, setLoading] = useState(true)
  const [totalSavings, setTotalSavings] = useState(0)

  useEffect(() => {
    if (products.length > 0) {
      fetchBulkPricing()
    }
  }, [companyId, customerId, products])

  const fetchBulkPricing = async () => {
    try {
      setLoading(true)

      const requestData = {
        company_id: companyId,
        customer_id: customerId,
        product_ids: products.map(p => p.id),
        quantity: products.reduce((sum, p) => sum + p.quantity, 0)
      }

      const response = await fetch('/api/customer-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (result.success) {
        setPricing(result.data)
        setTotalSavings(result.total_savings || 0)
      }
    } catch (err) {
      console.error('Error fetching bulk pricing:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 h-16 w-full rounded ${className}`}></div>
    )
  }

  if (pricing.length === 0) {
    return null
  }

  const totalRetail = pricing.reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id)
    return sum + (item.retail_price * (product?.quantity || 1))
  }, 0)

  const totalCustomer = pricing.reduce((sum, item) => {
    const product = products.find(p => p.id === item.product_id)
    return sum + (item.customer_price * (product?.quantity || 1))
  }, 0)

  const totalDiscount = ((totalRetail - totalCustomer) / totalRetail) * 100

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-green-800">Your B2B Pricing</span>
        <span className="text-xs text-green-600">{pricing.filter(p => p.has_custom_pricing).length} custom prices</span>
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="text-2xl font-bold text-green-600">${totalCustomer.toFixed(2)}</div>
          {totalDiscount > 0 && (
            <div className="text-sm text-gray-500">
              <span className="line-through">${totalRetail.toFixed(2)}</span>
              <span className="ml-2 text-green-600">({totalDiscount.toFixed(1)}% off)</span>
            </div>
          )}
        </div>
        
        {totalSavings > 0 && (
          <div className="text-right">
            <div className="text-lg font-semibold text-green-600">
              Save ${totalSavings.toFixed(2)}
            </div>
            <div className="text-xs text-green-500">vs retail pricing</div>
          </div>
        )}
      </div>
    </div>
  )
}