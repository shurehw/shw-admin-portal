import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function POST(request: Request) {
  try {
    const { type, id, updates } = await request.json()
    
    if (type === 'parent') {
      // Update parent product in airtable_master_items
      const { data, error } = await supabase
        .from('airtable_master_items')
        .update({
          name: updates.name,
          category: updates.category,
          subcategory: updates.subcategory,
          updated_at: new Date().toISOString()
        })
        .eq('airtable_id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({ success: true, data })
    } else if (type === 'variant') {
      // Update variant in airtable_products_variants
      const { data, error } = await supabase
        .from('airtable_products_variants')
        .update({
          name: updates.name,
          sos_id: updates.sos_id,
          cost: updates.cost ? parseFloat(updates.cost) : null,
          created_at: new Date().toISOString()
        })
        .eq('airtable_id', id)
        .select()
        .single()
      
      if (error) throw error
      
      return NextResponse.json({ success: true, data })
    }
    
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}