import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET() {
  try {
    // Use a more efficient approach - let the database do the work
    // Get unmapped SOS items directly using a SQL query
    const { data: unmappedItems, error } = await supabase.rpc('get_unmapped_sos_items')
    
    if (error) {
      // Fallback to manual approach if RPC doesn't exist
      console.log('RPC not found, using manual approach')
      
      // Get count of total SOS items
      const { count: totalSOS } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
      
      // Get ALL unique SOS IDs that are mapped in variants
      let allMappedSosIds: string[] = []
      let variantPage = 0
      const variantPageSize = 1000
      
      while (true) {
        const { data: variants } = await supabase
          .from('airtable_products_variants')
          .select('sos_id')
          .not('sos_id', 'is', null)
          .range(variantPage * variantPageSize, (variantPage + 1) * variantPageSize - 1)
        
        if (!variants || variants.length === 0) break
        
        allMappedSosIds.push(...variants.map(v => String(v.sos_id)))
        
        if (variants.length < variantPageSize) break
        variantPage++
      }
      
      const mappedIds = new Set(allMappedSosIds)
      
      // Get unmapped items (paginated for performance)
      const unmapped: any[] = []
      let page = 0
      const pageSize = 1000
      
      while (unmapped.length < 100 && page < 10) { // Limit to first 100 unmapped for UI performance
        const { data: sosItems } = await supabase
          .from('items')
          .select('id, name, sku, description, sos_id')
          .order('name')
          .range(page * pageSize, (page + 1) * pageSize - 1)
        
        if (!sosItems || sosItems.length === 0) break
        
        for (const item of sosItems) {
          if (!mappedIds.has(String(item.sos_id))) {
            unmapped.push(item)
            if (unmapped.length >= 100) break
          }
        }
        
        page++
      }
      
      return NextResponse.json({ 
        items: unmapped,
        total: (totalSOS || 0) - mappedIds.size,
        showing: unmapped.length
      })
    }
    
    return NextResponse.json({ 
      items: unmappedItems || [],
      total: unmappedItems?.length || 0
    })
  } catch (error) {
    console.error('Error fetching unmapped SOS items:', error)
    return NextResponse.json({ error: 'Failed to fetch unmapped SOS items' }, { status: 500 })
  }
}