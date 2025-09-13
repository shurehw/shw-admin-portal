import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET() {
  try {
    // Fetch parent products
    const { data: parents, error: parentsError } = await supabase
      .from('airtable_master_items')
      .select('*')
      .eq('is_parent', true)
      .order('name')
      .limit(100)
    
    if (parentsError) throw parentsError
    
    // For each parent, fetch its variants
    const parentsWithVariants = await Promise.all(
      (parents || []).map(async (parent) => {
        if (parent.product_variants && parent.product_variants.length > 0) {
          // Fetch variant details
          const { data: variants } = await supabase
            .from('airtable_products_variants')
            .select('*')
            .in('airtable_id', parent.product_variants)
          
          // For each variant, try to get SOS item
          const variantsWithItems = await Promise.all(
            (variants || []).map(async (variant) => {
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
          
          return {
            ...parent,
            variants: variantsWithItems
          }
        }
        
        return {
          ...parent,
          variants: []
        }
      })
    )
    
    return NextResponse.json({ parents: parentsWithVariants })
  } catch (error) {
    console.error('Error fetching parents with variants:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}