import { NextApiRequest, NextApiResponse } from 'next';

const BIGCOMMERCE_STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH || 'lsgscaxueg';
const BIGCOMMERCE_ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN || 'sfo47kc8jzqe2rlizafi7kvlvv34o0t';
const BIGCOMMERCE_API_URL = `https://api.bigcommerce.com/stores/${BIGCOMMERCE_STORE_HASH}/v3`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page, offset, limit = '24', search, category, sort } = req.query;
    
    // Headless Shure Hospitality channel ID: 1572493
    // Note: Products are filtered by channel assignment in BigCommerce admin
    // The API automatically returns products assigned to the channel based on the store configuration
    
    // Calculate page from offset if provided
    const currentPage = page || (offset ? Math.floor(Number(offset) / Number(limit)) + 1 : 1);
    
    // Build query parameters for BigCommerce API
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      include: 'images,variants,custom_fields',
      ...(search && { keyword: String(search) }),
      ...(sort && { sort: String(sort) })
    });
    
    // BigCommerce requires 'categories:in' parameter for category filtering
    // Can accept multiple category IDs separated by commas
    if (category) {
      // If multiple categories are provided (comma-separated), use them all
      if (String(category).includes(',')) {
        params.append('categories:in', String(category));
      } else {
        params.append('categories:in', String(category));
      }
    }

    console.log('[API] Fetching products from BigCommerce');
    console.log('[API] Store Hash:', BIGCOMMERCE_STORE_HASH);
    console.log('[API] Query params:', params.toString());

    // Fetch products from BigCommerce REST API
    const response = await fetch(
      `${BIGCOMMERCE_API_URL}/catalog/products?${params}`,
      {
        headers: {
          'X-Auth-Token': BIGCOMMERCE_ACCESS_TOKEN,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error('BigCommerce API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`BigCommerce API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] Received products:', data.data?.length || 0);
    
    // Transform BigCommerce data to match our frontend format
    const transformedProducts = (data.data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: parseFloat(product.price || 0),
      b2b_price: product.calculated_price ? parseFloat(product.calculated_price) : parseFloat(product.price || 0) * 0.8, // 20% B2B discount
      retail_price: parseFloat(product.retail_price || product.price || 0),
      description: product.description,
      inventory_level: product.inventory_level,
      images: product.images?.map((img: any) => ({
        url_standard: img.url_standard,
        url_thumbnail: img.url_thumbnail
      })) || [],
      categories: product.categories,
      minOrderQty: product.order_quantity_minimum || 1,
      bulk_pricing: product.bulk_pricing_rules?.map((rule: any) => ({
        minQuantity: rule.quantity_min,
        maxQuantity: rule.quantity_max,
        price: parseFloat(rule.amount)
      })) || []
    }));

    return res.status(200).json({
      data: transformedProducts,
      meta: data.meta
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Return actual error for debugging
    return res.status(500).json({ 
      error: 'Failed to fetch products from BigCommerce',
      details: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Check that your BIGCOMMERCE_STORE_HASH and BIGCOMMERCE_ACCESS_TOKEN are correctly set'
    });
  }
}