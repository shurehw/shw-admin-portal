import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

/**
 * Get all mapped SOS IDs with caching
 * Cached for 5 minutes, invalidated on updates
 */
export const getMappedSosIds = unstable_cache(
  async (orgId: string = 'default') => {
    const startTime = Date.now()
    
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
    
    const duration = Date.now() - startTime
    
    return {
      ids: new Set(allMappedSosIds),
      count: allMappedSosIds.length,
      cachedAt: new Date().toISOString(),
      queryTime: duration
    }
  },
  ['mapped-sos-ids'], // Cache key with tags
  {
    revalidate: 300, // 5 minutes
    tags: ['sos-mappings', 'products']
  }
)

/**
 * Get unmapped SOS items with pagination
 */
export const getUnmappedSosItems = unstable_cache(
  async (page: number = 0, limit: number = 100, orgId: string = 'default') => {
    const startTime = Date.now()
    
    // Get cached mapped IDs
    const { ids: mappedSet } = await getMappedSosIds(orgId)
    
    // Get total count
    const { count: totalSOS } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
    
    const totalUnmapped = (totalSOS || 0) - mappedSet.size
    
    // Get paginated unmapped items
    const unmappedItems: any[] = []
    let dbPage = 0
    const pageSize = 500
    let skipped = 0
    const targetStart = page * limit
    
    while (unmappedItems.length < limit) {
      const { data: sosItems } = await supabase
        .from('items')
        .select('id, name, sku, description, sos_id')
        .order('name')
        .range(dbPage * pageSize, (dbPage + 1) * pageSize - 1)
      
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
      dbPage++
    }
    
    const duration = Date.now() - startTime
    
    return {
      items: unmappedItems,
      total: totalUnmapped,
      page,
      totalPages: Math.ceil(totalUnmapped / limit),
      queryTime: duration
    }
  },
  ['unmapped-sos-items'], // Dynamic cache key
  {
    revalidate: 300,
    tags: ['sos-mappings', 'unmapped-items']
  }
)

/**
 * Get parent products with SOS items
 */
export const getParentProductsWithSOS = unstable_cache(
  async (page: number = 0, limit: number = 100) => {
    const startTime = Date.now()
    
    const { data: parents, count } = await supabase
      .from('airtable_products')
      .select(`
        *,
        airtable_products_variants!inner (
          count
        )
      `, { count: 'exact' })
      .order('name')
      .range(page * limit, (page + 1) * limit - 1)
    
    const duration = Date.now() - startTime
    
    return {
      parents: parents || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
      queryTime: duration
    }
  },
  ['parent-products'],
  {
    revalidate: 300,
    tags: ['products', 'parents']
  }
)