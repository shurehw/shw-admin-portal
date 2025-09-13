import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://jvzswjyflmgenzxsrlwj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

export async function POST(request: Request) {
  try {
    const { variantId, parentName } = await request.json()
    
    if (!variantId || !parentName) {
      return NextResponse.json({ error: 'Variant ID and parent name are required' }, { status: 400 })
    }
    
    // Get the variant details
    const { data: variant, error: variantError } = await supabase
      .from('airtable_products_variants')
      .select('*')
      .eq('airtable_id', variantId)
      .single()
    
    if (variantError || !variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
    }
    
    // Generate a unique Airtable ID for the new parent
    const newParentId = `recNEW${Date.now()}${Math.random().toString(36).substr(2, 9)}`
    
    // Create the new parent product
    const { data: newParent, error: createError } = await supabase
      .from('airtable_master_items')
      .insert({
        airtable_id: newParentId,
        name: parentName,
        is_parent: true,
        product_variants: [variantId],
        categories: variant.categories || [],
        photos: variant.photos || []
      })
      .select()
      .single()
    
    if (createError) {
      console.error('Error creating parent:', createError)
      return NextResponse.json({ error: 'Failed to create parent product' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      parent: newParent,
      message: `Created parent "${parentName}" with variant "${variant.name}"`
    })
  } catch (error) {
    console.error('Error creating parent from variant:', error)
    return NextResponse.json({ error: 'Failed to create parent product' }, { status: 500 })
  }
}