import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET() {
  try {
    // Get all variant IDs that are referenced by parents
    const { data: parents } = await supabase
      .from('airtable_master_items')
      .select('product_variants')
      .eq('is_parent', true)
      .not('product_variants', 'is', null)
    
    // Flatten all referenced variant IDs
    const referencedVariantIds = new Set<string>()
    parents?.forEach(parent => {
      if (parent.product_variants) {
        parent.product_variants.forEach((id: string) => referencedVariantIds.add(id))
      }
    })
    
    // Get all variants
    const { data: allVariants } = await supabase
      .from('airtable_products_variants')
      .select('*')
      .limit(1000)
    
    // Filter to find orphans (variants not referenced by any parent)
    const orphanedVariants = (allVariants || []).filter(
      variant => !referencedVariantIds.has(variant.airtable_id)
    )
    
    // Add SOS item info if available
    const orphansWithItems = await Promise.all(
      orphanedVariants.map(async (variant) => {
        let sosItem = null
        
        // First try matching by style_code/SKU (most reliable)
        if (!sosItem && variant.style_code) {
          const { data: item } = await supabase
            .from('items')
            .select('id, name, sku, description, sos_id')
            .eq('sku', variant.style_code)
            .single()
          
          sosItem = item
        }
        
        // Try matching by name (exact match first)
        if (!sosItem && variant.name) {
          const { data: item } = await supabase
            .from('items')
            .select('id, name, sku, description, sos_id')
            .eq('name', variant.name)
            .single()
          
          sosItem = item
        }
        
        // Try partial name match (remove quantity suffix)
        if (!sosItem && variant.name) {
          // Remove quantity patterns like "/ 100" or "/ 1"
          const cleanName = variant.name.replace(/\s*\/\s*\d+(\(\w+\))?$/, '').trim()
          
          const { data: items } = await supabase
            .from('items')
            .select('id, name, sku, description, sos_id')
            .ilike('name', `${cleanName}%`)
            .limit(1)
          
          if (items && items.length > 0) {
            sosItem = items[0]
          }
        }
        
        // Last resort: try SOS ID if nothing else matched
        if (!sosItem && variant.sos_id && variant.sos_id !== '-1' && variant.sos_id !== '0') {
          const { data: item } = await supabase
            .from('items')
            .select('id, name, sku, description, sos_id')
            .eq('sos_id', variant.sos_id)
            .single()
          
          sosItem = item
        }
        
        return {
          ...variant,
          sos_item: sosItem
        }
      })
    )
    
    return NextResponse.json({ variants: orphansWithItems })
  } catch (error) {
    console.error('Error fetching orphaned variants:', error)
    return NextResponse.json({ error: 'Failed to fetch orphaned variants' }, { status: 500 })
  }
}