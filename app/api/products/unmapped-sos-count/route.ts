import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedPage = parseInt(searchParams.get('page') || '0')
  const limit = parseInt(searchParams.get('limit') || '100')
  try {
    // Get ALL mapped SOS IDs (paginated to handle 12,377 records)
    let allMappedSosIds: string[] = []
    let page = 0
    const pageSize = 1000
    
    while (true) {
      const { data: variants } = await supabase
        .from('airtable_products_variants')
        .select('sos_id')
        .not('sos_id', 'is', null)
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      if (!variants || variants.length === 0) break
      allMappedSosIds.push(...variants.map(v => String(v.sos_id)))
      if (variants.length < pageSize) break
      page++
    }
    
    const mappedSet = new Set(allMappedSosIds)
    
    // Now find ALL truly unmapped items first
    const allUnmappedItems: any[] = []
    page = 0
    
    while (true) {
      const { data: sosItems } = await supabase
        .from('items')
        .select('id, name, sku, description, sos_id')
        .order('name')
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      if (!sosItems || sosItems.length === 0) break
      
      for (const item of sosItems) {
        if (!mappedSet.has(String(item.sos_id))) {
          allUnmappedItems.push(item)
        }
      }
      
      if (sosItems.length < pageSize) break
      page++
    }
    
    // Return paginated results
    const start = requestedPage * limit
    const end = start + limit
    const paginatedItems = allUnmappedItems.slice(start, end)
    
    return NextResponse.json({ 
      items: paginatedItems,
      total: allUnmappedItems.length,
      showing: paginatedItems.length,
      page: requestedPage,
      totalPages: Math.ceil(allUnmappedItems.length / limit),
      note: `Showing items ${start + 1}-${Math.min(end, allUnmappedItems.length)} of ${allUnmappedItems.length} truly unmapped items`
    })
  } catch (error) {
    console.error('Error fetching unmapped SOS items:', error)
    return NextResponse.json({ error: 'Failed to fetch unmapped SOS items' }, { status: 500 })
  }
}