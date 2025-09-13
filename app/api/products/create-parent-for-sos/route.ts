import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function POST(request: Request) {
  try {
    const { sosItem, parentName, category } = await request.json()
    
    if (!sosItem || !parentName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Create IDs
    const parentId = `recNEW${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    const variantId = `recSOS${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    
    // Create a variant for this SOS item
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
    
    // Create the new parent product
    const { data: newParent, error: parentError } = await supabase
      .from('airtable_master_items')
      .insert({
        airtable_id: parentId,
        name: parentName,
        is_parent: true,
        product_variants: [variantId],
        category: category || 'Uncategorized'
      })
      .select()
      .single()
    
    if (parentError) throw parentError
    
    return NextResponse.json({ 
      success: true, 
      parent: newParent,
      message: `Created parent "${parentName}" with SOS item "${sosItem.name}"`
    })
  } catch (error) {
    console.error('Error creating parent for SOS item:', error)
    return NextResponse.json({ error: 'Failed to create parent' }, { status: 500 })
  }
}