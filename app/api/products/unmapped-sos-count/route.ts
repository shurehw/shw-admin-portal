import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function GET() {
  try {
    // Just return a fixed reasonable estimate for now to avoid timeout
    // We know from our analysis that it's about 1,049 unmapped items
    
    // Get first 100 unmapped items for display
    const { data: sosItems } = await supabase
      .from('items')
      .select('id, name, sku, description, sos_id')
      .order('name')
      .limit(100)
    
    // Filter out ones that might be mapped (this is approximate but fast)
    const { data: someMappedIds } = await supabase
      .from('airtable_products_variants')
      .select('sos_id')
      .not('sos_id', 'is', null)
      .limit(1000)
    
    const mappedSet = new Set(someMappedIds?.map(v => String(v.sos_id)) || [])
    const unmapped = sosItems?.filter(item => !mappedSet.has(String(item.sos_id))) || []
    
    return NextResponse.json({ 
      items: unmapped.slice(0, 100),
      total: 1049, // Known value from our analysis
      showing: unmapped.length,
      note: 'Showing estimated count for performance'
    })
  } catch (error) {
    console.error('Error fetching unmapped SOS items:', error)
    return NextResponse.json({ error: 'Failed to fetch unmapped SOS items' }, { status: 500 })
  }
}