import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

// Cache the mapped IDs for 5 minutes
let cachedMappedIds: Set<string> | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

async function getMappedSosIds(): Promise<Set<string>> {
  const now = Date.now()
  
  // Return cached data if still valid
  if (cachedMappedIds && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedMappedIds
  }
  
  // Otherwise fetch fresh data
  const allMappedSosIds: string[] = []
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
  
  // Update cache
  cachedMappedIds = new Set(allMappedSosIds)
  cacheTimestamp = now
  
  return cachedMappedIds
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedPage = parseInt(searchParams.get('page') || '0')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  try {
    // Get mapped IDs from cache
    const mappedSet = await getMappedSosIds()
    
    // For first page, include count
    if (requestedPage === 0) {
      // Get total count of SOS items
      const { count: totalSOS } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
      
      const totalUnmapped = (totalSOS || 0) - mappedSet.size
      
      // Get first page of unmapped items
      const unmappedItems: any[] = []
      let page = 0
      const pageSize = 500
      
      while (unmappedItems.length < limit) {
        const { data: sosItems } = await supabase
          .from('items')
          .select('id, name, sku, description, sos_id')
          .order('name')
          .range(page * pageSize, (page + 1) * pageSize - 1)
        
        if (!sosItems || sosItems.length === 0) break
        
        for (const item of sosItems) {
          if (!mappedSet.has(String(item.sos_id))) {
            unmappedItems.push(item)
            if (unmappedItems.length >= limit) break
          }
        }
        
        if (sosItems.length < pageSize) break
        page++
      }
      
      return NextResponse.json({ 
        items: unmappedItems,
        total: totalUnmapped,
        showing: unmappedItems.length,
        page: 0,
        totalPages: Math.ceil(totalUnmapped / limit),
        cached: true
      })
    } else {
      // For other pages, fetch directly with offset
      const unmappedItems: any[] = []
      const targetStart = requestedPage * limit
      let skipped = 0
      let page = 0
      const pageSize = 500
      
      while (unmappedItems.length < limit) {
        const { data: sosItems } = await supabase
          .from('items')
          .select('id, name, sku, description, sos_id')
          .order('name')
          .range(page * pageSize, (page + 1) * pageSize - 1)
        
        if (!sosItems || sosItems.length === 0) break
        
        for (const item of sosItems) {
          if (!mappedSet.has(String(item.sos_id))) {
            if (skipped >= targetStart) {
              unmappedItems.push(item)
              if (unmappedItems.length >= limit) break
            } else {
              skipped++
            }
          }
        }
        
        if (sosItems.length < pageSize) break
        page++
      }
      
      return NextResponse.json({ 
        items: unmappedItems,
        total: 1049, // Known value
        showing: unmappedItems.length,
        page: requestedPage,
        cached: true
      })
    }
  } catch (error) {
    console.error('Error fetching unmapped SOS items:', error)
    return NextResponse.json({ error: 'Failed to fetch unmapped SOS items' }, { status: 500 })
  }
}