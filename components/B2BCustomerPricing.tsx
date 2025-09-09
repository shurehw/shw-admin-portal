'use client'

import { DollarSign, TrendingDown, Tag, Package, AlertCircle } from 'lucide-react'
import { useB2BPricing, calculateBulkSavings } from '@/hooks/useB2BPricing'

interface B2BCustomerPricingProps {
  companyId?: string
  customerId?: string
  productId: number
  quantity?: number
  showRetailPrice?: boolean
  showDiscountPercent?: boolean
  showBulkTiers?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function B2BCustomerPricing({
  companyId,
  customerId,
  productId,
  quantity = 1,
  showRetailPrice = true,
  showDiscountPercent = true,
  showBulkTiers = false,
  size = 'md',
  className = ''
}: B2BCustomerPricingProps) {
  const { loading, error, getProductPrice, priceLists } = useB2BPricing(companyId, customerId)

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 h-6 w-20 rounded"></div>
        {showRetailPrice && <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>}
      </div>
    )
  }

  const priceInfo = getProductPrice(productId, quantity)

  if (error || !priceInfo) {
    // No B2B pricing found - show retail only
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <span className="flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          Contact for pricing
        </span>
      </div>
    )
  }

  const sizeClasses = {
    sm: { price: 'text-lg', retail: 'text-xs', badge: 'text-xs px-1.5 py-0.5' },
    md: { price: 'text-xl', retail: 'text-sm', badge: 'text-xs px-2 py-1' },
    lg: { price: 'text-2xl', retail: 'text-base', badge: 'text-sm px-3 py-1' }
  }

  const classes = sizeClasses[size]
  const hasDiscount = priceInfo.discount_percent > 0

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Main Price */}
      <div className="flex items-center gap-2">
        <span className={`font-bold ${hasDiscount ? 'text-green-600' : 'text-gray-900'} ${classes.price}`}>
          ${priceInfo.customer_price.toFixed(2)}
        </span>
        
        {/* Price Tier Badge */}
        {priceInfo.tier_name && (
          <span className={`inline-flex items-center rounded-full font-medium bg-blue-100 text-blue-800 ${classes.badge}`}>
            <Tag className="w-3 h-3 mr-1" />
            {priceInfo.tier_name}
          </span>
        )}
      </div>

      {/* Retail Price & Discount */}
      {showRetailPrice && hasDiscount && (
        <div className="flex items-center gap-2">
          <span className={`line-through text-gray-500 ${classes.retail}`}>
            ${priceInfo.retail_price.toFixed(2)}
          </span>
          {showDiscountPercent && (
            <span className={`inline-flex items-center rounded-full font-medium bg-green-100 text-green-800 ${classes.badge}`}>
              <TrendingDown className="w-3 h-3 mr-1" />
              {priceInfo.discount_percent.toFixed(1)}% off
            </span>
          )}
        </div>
      )}

      {/* Bulk Pricing Tiers */}
      {showBulkTiers && priceLists.length > 0 && (
        <BulkPricingTiers 
          priceLists={priceLists} 
          productId={productId} 
          currentQuantity={quantity}
        />
      )}

      {/* Minimum Quantity */}
      {priceInfo.minimum_quantity && priceInfo.minimum_quantity > 1 && (
        <div className={`flex items-center gap-1 ${classes.retail}`}>
          <Package className="w-3 h-3" />
          <span className={quantity >= priceInfo.minimum_quantity ? 'text-green-600' : 'text-orange-600'}>
            Min qty: {priceInfo.minimum_quantity}
            {quantity < priceInfo.minimum_quantity && ` (${priceInfo.minimum_quantity - quantity} more needed)`}
          </span>
        </div>
      )}

      {/* Savings Calculation */}
      {hasDiscount && quantity > 1 && (
        <div className={`text-green-600 font-medium ${classes.retail}`}>
          Save ${((priceInfo.retail_price - priceInfo.customer_price) * quantity).toFixed(2)} on {quantity} items
        </div>
      )}
    </div>
  )
}

// Component to show bulk pricing tiers
interface BulkPricingTiersProps {
  priceLists: any[]
  productId: number
  currentQuantity: number
}

function BulkPricingTiers({ priceLists, productId, currentQuantity }: BulkPricingTiersProps) {
  // Find the product in price lists
  let bulkTiers: any[] = []
  
  for (const priceList of priceLists) {
    const item = priceList.items?.find((i: any) => 
      i.product_id === productId || i.variant_id === productId
    )
    if (item?.bulk_pricing_tiers) {
      bulkTiers = item.bulk_pricing_tiers
      break
    }
  }

  if (bulkTiers.length === 0) return null

  return (
    <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
      <div className="font-medium text-blue-900 mb-1">Volume Pricing:</div>
      <div className="space-y-1">
        {bulkTiers.map((tier, index) => {
          const isActive = currentQuantity >= tier.quantity_min && 
            (!tier.quantity_max || currentQuantity <= tier.quantity_max)
          
          return (
            <div 
              key={index} 
              className={`flex justify-between ${isActive ? 'text-blue-700 font-medium' : 'text-gray-600'}`}
            >
              <span>
                {tier.quantity_min}
                {tier.quantity_max ? `-${tier.quantity_max}` : '+'} units
              </span>
              <span>
                {tier.type === 'fixed' 
                  ? `$${tier.amount.toFixed(2)}` 
                  : `${tier.amount}% off`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Bulk pricing component for cart/multiple products
interface BulkB2BPricingProps {
  companyId?: string
  customerId?: string
  products: { id: number; quantity: number }[]
  className?: string
}

export function BulkB2BCustomerPricing({
  companyId,
  customerId,
  products,
  className = ''
}: BulkB2BPricingProps) {
  const { loading, priceLists } = useB2BPricing(companyId, customerId)

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 h-16 w-full rounded ${className}`}></div>
    )
  }

  if (priceLists.length === 0 || products.length === 0) {
    return null
  }

  const { total_retail, total_customer, total_savings } = calculateBulkSavings(priceLists, products)
  
  if (total_savings <= 0) {
    return null
  }

  const discountPercent = (total_savings / total_retail) * 100

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-green-800">Your B2B Pricing</span>
        <span className="text-xs text-green-600">
          {products.length} item{products.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="flex justify-between items-end">
        <div>
          <div className="text-2xl font-bold text-green-600">${total_customer.toFixed(2)}</div>
          <div className="text-sm text-gray-500">
            <span className="line-through">${total_retail.toFixed(2)}</span>
            <span className="ml-2 text-green-600">({discountPercent.toFixed(1)}% off)</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-semibold text-green-600">
            Save ${total_savings.toFixed(2)}
          </div>
          <div className="text-xs text-green-500">vs retail pricing</div>
        </div>
      </div>

      {/* Show price source */}
      <div className="mt-3 pt-3 border-t border-green-200">
        <p className="text-xs text-green-700">
          Pricing from: {priceLists[0]?.name || 'Enterprise Agreement'}
        </p>
      </div>
    </div>
  )
}