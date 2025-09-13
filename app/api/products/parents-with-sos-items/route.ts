import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET() {
  try {
    // Fetch ALL parent products using pagination
    let allParents: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data: parents, error: parentsError } = await supabase
        .from('airtable_master_items')
        .select('*')
        .eq('is_parent', true)
        .order('name')
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      if (parentsError) throw parentsError
      
      if (parents && parents.length > 0) {
        allParents = [...allParents, ...parents]
        page++
        hasMore = parents.length === pageSize
      } else {
        hasMore = false
      }
    }
    
    const parents = allParents
    
    // For each parent, get SOS items through variants
    const parentsWithSOS = await Promise.all(
      (parents || []).map(async (parent) => {
        const sosItems = []
        
        if (parent.product_variants && parent.product_variants.length > 0) {
          // Get variants for this parent
          const { data: variants } = await supabase
            .from('airtable_products_variants')
            .select('*')
            .in('airtable_id', parent.product_variants)
          
          // For each variant, try to get matching SOS item
          for (const variant of (variants || [])) {
            let sosItem = null
            
            // Try matching by style_code/SKU first
            if (variant.style_code) {
              const { data: item } = await supabase
                .from('items')
                .select('*')
                .eq('sku', variant.style_code)
                .single()
              
              if (item) {
                sosItem = { ...item, matched_via: 'SKU' }
              }
            }
            
            // Try matching by name
            if (!sosItem && variant.name) {
              const { data: item } = await supabase
                .from('items')
                .select('*')
                .eq('name', variant.name)
                .single()
              
              if (item) {
                sosItem = { ...item, matched_via: 'Name' }
              }
            }
            
            // Try partial name match
            if (!sosItem && variant.name) {
              const cleanName = variant.name.replace(/\s*\/\s*\d+(\(\w+\))?$/, '').trim()
              
              const { data: items } = await supabase
                .from('items')
                .select('*')
                .ilike('name', `${cleanName}%`)
                .limit(1)
              
              if (items && items.length > 0) {
                sosItem = { ...items[0], matched_via: 'Partial Name' }
              }
            }
            
            if (sosItem) {
              // Check if we already have this SOS item
              const exists = sosItems.some(item => item.id === sosItem.id)
              if (!exists) {
                sosItems.push({
                  ...sosItem,
                  variant_name: variant.name,
                  variant_id: variant.airtable_id
                })
              }
            }
          }
        }
        
        return {
          ...parent,
          sos_items: sosItems,
          sos_count: sosItems.length
        }
      })
    )
    
    return NextResponse.json({ parents: parentsWithSOS })
  } catch (error) {
    console.error('Error fetching parents with SOS items:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}