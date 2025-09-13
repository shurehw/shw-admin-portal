'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvzswjyflmgenzxsrlwj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w'
)

/**
 * Link an unmapped SOS item to a parent product
 */
export async function linkSosToParent(formData: FormData) {
  const sosId = formData.get('sosId') as string
  const parentId = formData.get('parentId') as string
  const sosName = formData.get('sosName') as string
  
  try {
    // Create a new variant linking the SOS item to the parent
    const { data: variant, error } = await supabase
      .from('airtable_products_variants')
      .insert({
        airtable_product_id: parentId,
        sos_id: sosId,
        name: sosName,
        mapped_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Invalidate caches
    revalidateTag('sos-mappings')
    revalidateTag('unmapped-items')
    revalidateTag('products')
    revalidatePath('/admin/products-sos-optimized')
    
    return { 
      success: true, 
      variant,
      message: `Successfully linked ${sosName} to parent product`
    }
  } catch (error) {
    console.error('Error linking SOS to parent:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to link SOS item'
    }
  }
}

/**
 * Create a new parent product from an unmapped SOS item
 */
export async function createParentFromSos(formData: FormData) {
  const sosId = formData.get('sosId') as string
  const sosName = formData.get('sosName') as string
  const parentName = formData.get('name') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  
  try {
    // Create parent product
    const { data: parent, error: parentError } = await supabase
      .from('airtable_products')
      .insert({
        name: parentName,
        category,
        description,
        created_from_sos: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (parentError) throw parentError
    
    // Create variant linking SOS to new parent
    const { data: variant, error: variantError } = await supabase
      .from('airtable_products_variants')
      .insert({
        airtable_product_id: parent.airtable_id,
        sos_id: sosId,
        name: sosName,
        is_primary: true,
        mapped_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (variantError) throw variantError
    
    // Invalidate all related caches
    revalidateTag('sos-mappings')
    revalidateTag('unmapped-items')
    revalidateTag('products')
    revalidateTag('parents')
    revalidatePath('/admin/products-sos-optimized')
    
    return { 
      success: true, 
      parent,
      variant,
      message: `Successfully created parent "${parentName}" with SOS item`
    }
  } catch (error) {
    console.error('Error creating parent from SOS:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create parent product'
    }
  }
}

/**
 * Refresh cached data manually
 */
export async function refreshCache() {
  revalidateTag('sos-mappings')
  revalidateTag('unmapped-items')
  revalidateTag('products')
  revalidateTag('parents')
  revalidatePath('/admin/products-sos-optimized')
  
  return { success: true, message: 'Cache refreshed successfully' }
}