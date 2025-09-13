import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET() {
  try {
    // Get ALL SOS items using pagination
    let allSosItems: any[] = []
    let page = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data: sosItems, error: sosError } = await supabase
        .from('items')
        .select('*')
        .order('name')
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      if (sosError) throw sosError
      
      if (sosItems && sosItems.length > 0) {
        allSosItems = [...allSosItems, ...sosItems]
        page++
        hasMore = sosItems.length === pageSize
      } else {
        hasMore = false
      }
    }
    
    const sosItems = allSosItems
    
    // Get ALL Airtable variants using pagination to find which SOS items are already mapped
    let allVariants: any[] = []
    let variantPage = 0
    const variantPageSize = 1000
    let hasMoreVariants = true
    
    while (hasMoreVariants) {
      const { data: variants, error: variantsError } = await supabase
        .from('airtable_products_variants')
        .select('style_code, name, sos_id')
        .range(variantPage * variantPageSize, (variantPage + 1) * variantPageSize - 1)
      
      if (variantsError) throw variantsError
      
      if (variants && variants.length > 0) {
        allVariants = [...allVariants, ...variants]
        variantPage++
        hasMoreVariants = variants.length === variantPageSize
      } else {
        hasMoreVariants = false
      }
    }
    
    const variants = allVariants
    
    // Create sets for faster lookup
    const mappedSkus = new Set<string>()
    const mappedNames = new Set<string>()
    const mappedSosIds = new Set<string>()
    
    variants?.forEach(variant => {
      if (variant.style_code) {
        mappedSkus.add(variant.style_code)
      }
      if (variant.name) {
        mappedNames.add(variant.name)
        // Also add clean name without quantity suffix
        const cleanName = variant.name.replace(/\s*\/\s*\d+(\(\w+\))?$/, '').trim()
        mappedNames.add(cleanName)
      }
      if (variant.sos_id) {
        mappedSosIds.add(String(variant.sos_id))
      }
    })
    
    // Filter SOS items to find unmapped ones
    const unmappedItems = sosItems?.filter(item => {
      // Check if this SOS item is mapped by SOS ID
      if (item.sos_id && mappedSosIds.has(String(item.sos_id))) {
        return false
      }
      
      // Check if this SOS item is mapped by SKU
      if (item.sku && mappedSkus.has(item.sku)) {
        return false
      }
      
      // Check if this SOS item is mapped by name
      if (item.name && mappedNames.has(item.name)) {
        return false
      }
      
      // This item is unmapped
      return true
    }) || []
    
    return NextResponse.json({ 
      items: unmappedItems,
      total: unmappedItems.length 
    })
  } catch (error) {
    console.error('Error fetching unmapped SOS items:', error)
    return NextResponse.json({ error: 'Failed to fetch unmapped SOS items' }, { status: 500 })
  }
}