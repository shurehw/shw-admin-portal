import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function POST(request: Request) {
  try {
    const { variantId, parentId } = await request.json()
    
    // Get the current parent
    const { data: parent, error: parentError } = await supabase
      .from('airtable_master_items')
      .select('product_variants, variant_count')
      .eq('airtable_id', parentId)
      .single()
    
    if (parentError) throw parentError
    
    // Remove variant from parent's variant array
    const updatedVariants = (parent.product_variants || []).filter((id: string) => id !== variantId)
    
    // Update parent with new variant list
    const { data, error } = await supabase
      .from('airtable_master_items')
      .update({
        product_variants: updatedVariants,
        variant_count: updatedVariants.length,
        updated_at: new Date().toISOString()
      })
      .eq('airtable_id', parentId)
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error unlinking variant:', error)
    return NextResponse.json({ error: 'Failed to unlink variant' }, { status: 500 })
  }
}