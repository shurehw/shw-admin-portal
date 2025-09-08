import type { NextApiRequest, NextApiResponse } from 'next';

const BIGCOMMERCE_API_URL = 'https://api.bigcommerce.com/stores/lsgscaxueg/v3';
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { page, offset, limit = '10', search, category, sort } = req.query;
  
  // Calculate page from offset if provided
  const currentPage = page || (offset ? Math.floor(Number(offset) / Number(limit)) + 1 : 1);

  try {
    // Build query parameters
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(limit),
      include: 'images,variants',
      ...(search && { keyword: String(search) }),
      ...(category && { categories: String(category) })
    });
    
    const response = await fetch(
      `${BIGCOMMERCE_API_URL}/catalog/products?${params}`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN || '',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    const products = data.data.map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: parseFloat(product.price || 0),
      b2b_price: product.calculated_price ? parseFloat(product.calculated_price) : parseFloat(product.price || 0) * 0.8,
      retail_price: parseFloat(product.retail_price || product.price || 0),
      description: product.description,
      inventory_level: product.inventory_level,
      images: product.images?.map((img: any) => ({
        url_standard: img.url_standard,
        url_thumbnail: img.url_thumbnail
      })) || [],
      bulk_pricing: product.bulk_pricing_rules?.map((rule: any) => ({
        minQuantity: rule.quantity_min,
        maxQuantity: rule.quantity_max,
        price: parseFloat(rule.amount)
      })) || []
    }));

    res.status(200).json({
      data: products,
      meta: data.meta
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}