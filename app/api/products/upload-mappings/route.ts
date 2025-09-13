import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// SOS Backup Supabase credentials
const sosSupabaseUrl = 'https://jvzswjyflmgenzxsrlwj.supabase.co';
const sosSupabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2enN3anlmbG1nZW56eHNybHdqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAyNDI3NywiZXhwIjoyMDcwNjAwMjc3fQ.o-WD_2YwWz8cmNRBxqmSJ0lJ1gDh7h6FX21o0HYey8w';

const sosSupabase = createClient(sosSupabaseUrl, sosSupabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const text = await file.text();
    
    // Parse CSV or TSV
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(/[,\t]/);
    
    // Map headers to expected fields
    const parentSkuIdx = headers.findIndex(h => h.includes('parent') && h.includes('sku'));
    const parentNameIdx = headers.findIndex(h => h.includes('parent') && h.includes('name'));
    const variantSkuIdx = headers.findIndex(h => h.includes('variant') && h.includes('sku')) >= 0 
      ? headers.findIndex(h => h.includes('variant') && h.includes('sku'))
      : headers.findIndex(h => h === 'sku');
    const variantNameIdx = headers.findIndex(h => h.includes('variant') && h.includes('name'));
    const sizeIdx = headers.findIndex(h => h.includes('size'));
    const colorIdx = headers.findIndex(h => h.includes('color'));
    const packIdx = headers.findIndex(h => h.includes('pack'));
    const categoryIdx = headers.findIndex(h => h.includes('category'));
    const brandIdx = headers.findIndex(h => h.includes('brand'));

    if (parentSkuIdx === -1 || variantSkuIdx === -1) {
      return NextResponse.json(
        { success: false, error: 'CSV must contain parent_sku and variant_sku/sku columns' },
        { status: 400 }
      );
    }

    // Parse data rows
    const mappings = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(/[,\t]/).map(v => v.trim().replace(/^["']|["']$/g, ''));
      
      if (values[parentSkuIdx] && values[variantSkuIdx]) {
        mappings.push({
          parent_sku: values[parentSkuIdx],
          parent_name: parentNameIdx >= 0 ? values[parentNameIdx] : values[parentSkuIdx],
          variant_sku: values[variantSkuIdx],
          variant_name: variantNameIdx >= 0 ? values[variantNameIdx] : null,
          size_option: sizeIdx >= 0 ? values[sizeIdx] : null,
          color_option: colorIdx >= 0 ? values[colorIdx] : null,
          pack_option: packIdx >= 0 ? values[packIdx] : null,
          category: categoryIdx >= 0 ? values[categoryIdx] : null,
          brand: brandIdx >= 0 ? values[brandIdx] : null
        });
      }
    }

    if (mappings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid mappings found in file' },
        { status: 400 }
      );
    }

    // Import mappings to database
    const { data, error } = await sosSupabase
      .rpc('import_parent_mappings', {
        p_mappings: mappings
      });

    if (error) {
      console.error('Error importing mappings:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imported: data || mappings.length,
      message: `Successfully imported ${data || mappings.length} parent mappings`
    });

  } catch (error) {
    console.error('Error uploading mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload parent mappings' },
      { status: 500 }
    );
  }
}