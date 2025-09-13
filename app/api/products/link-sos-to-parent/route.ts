import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function POST(request: Request) {
  try {
    const { sosItemId, parentId, sosItem } = await request.json()
    
    if (!sosItemId || !parentId || !sosItem) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create a new variant for this SOS item
    const variantId = `recSOS${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    
    // Insert the variant into airtable_products_variants
    const { error: variantError } = await supabase
      .from('airtable_products_variants')
      .insert({
        airtable_id: variantId,
        name: sosItem.name,
        sos_id: sosItem.sos_id,
        style_code: sosItem.sku,
        description: sosItem.description
      })
    
    if (variantError) throw variantError
    
    // Get the parent product
    const { data: parent, error: parentError } = await supabase
      .from('airtable_master_items')
      .select('product_variants')
      .eq('airtable_id', parentId)
      .single()
    
    if (parentError) throw parentError
    
    // Update parent's product_variants array
    const updatedVariants = parent.product_variants || []
    updatedVariants.push(variantId)
    
    const { error: updateError } = await supabase
      .from('airtable_master_items')
      .update({ product_variants: updatedVariants })
      .eq('airtable_id', parentId)
    
    if (updateError) throw updateError
    
    return NextResponse.json({ 
      success: true, 
      message: `Linked ${sosItem.name} to parent`,
      variantId 
    })
  } catch (error) {
    console.error('Error linking SOS item to parent:', error)
    return NextResponse.json({ error: 'Failed to link SOS item' }, { status: 500 })
  }
}