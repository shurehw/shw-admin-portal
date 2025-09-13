import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '100')
    
    // Fetch a page of parent products
    const { data: parents, error: parentsError } = await supabase
      .from('airtable_master_items')
      .select('*')
      .eq('is_parent', true)
      .order('name')
      .range(page * limit, (page + 1) * limit - 1)
    
    if (parentsError) throw parentsError
    
    // Get total count
    const { count } = await supabase
      .from('airtable_master_items')
      .select('*', { count: 'exact', head: true })
      .eq('is_parent', true)
    
    // For each parent, get summary of SOS items
    const parentsWithSOS = await Promise.all(
      (parents || []).map(async (parent) => {
        let sosCount = 0
        let hasSosItems = false
        
        if (parent.product_variants && parent.product_variants.length > 0) {
          // Just get count of variants with SOS items
          const { count: sosLinkedCount } = await supabase
            .from('airtable_products_variants')
            .select('*', { count: 'exact', head: true })
            .in('airtable_id', parent.product_variants)
            .not('sos_id', 'is', null)
          
          sosCount = sosLinkedCount || 0
          hasSosItems = sosCount > 0
        }
        
        return {
          ...parent,
          sos_count: sosCount,
          has_sos_items: hasSosItems,
          variant_count: parent.product_variants?.length || 0
        }
      })
    )
    
    return NextResponse.json({ 
      parents: parentsWithSOS,
      total: count,
      page,
      limit,
      hasMore: (page + 1) * limit < (count || 0)
    })
  } catch (error) {
    console.error('Error fetching parents:', error)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}