import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET(
  request: Request,
  { params }: { params: { parentId: string } }
) {
  try {
    const parentId = params.parentId
    
    // Get the parent
    const { data: parent, error: parentError } = await supabase
      .from('airtable_master_items')
      .select('product_variants')
      .eq('airtable_id', parentId)
      .single()
    
    if (parentError || !parent) {
      return NextResponse.json({ error: 'Parent not found' }, { status: 404 })
    }
    
    if (!parent.product_variants || parent.product_variants.length === 0) {
      return NextResponse.json({ variants: [] })
    }
    
    // Get variants
    const { data: variants } = await supabase
      .from('airtable_products_variants')
      .select('*')
      .in('airtable_id', parent.product_variants)
    
    // For each variant, try to get SOS item
    const variantsWithSOS = await Promise.all(
      (variants || []).map(async (variant) => {
        let sosItem = null
        
        // Try matching by style_code/SKU
        if (variant.style_code) {
          const { data: item } = await supabase
            .from('items')
            .select('id, name, sku, description, sos_id')
            .eq('sku', variant.style_code)
            .single()
          
          if (item) sosItem = item
        }
        
        // Try matching by name if no SKU match
        if (!sosItem && variant.name) {
          const { data: item } = await supabase
            .from('items')
            .select('id, name, sku, description, sos_id')
            .eq('name', variant.name)
            .single()
          
          if (item) sosItem = item
        }
        
        return {
          ...variant,
          sos_item: sosItem
        }
      })
    )
    
    return NextResponse.json({ variants: variantsWithSOS })
  } catch (error) {
    console.error('Error fetching parent variants:', error)
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
  }
}