import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { low_stock_only, category_id, search } = req.query;
    
    // Get products with inventory tracking
    const productsResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/catalog/products`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        },
        params: {
          include: 'variants,inventory',
          inventory_tracking: 'product',
          limit: 250,
          ...(category_id && { categories: category_id }),
          ...(search && { keyword: search })
        }
      }
    );

    const products = productsResponse.data.data;
    
    // Get inventory levels for all products
    const inventoryData = await Promise.all(
      products.map(async (product: any) => {
        try {
          // Get inventory by product ID
          const inventoryResponse = await axios.get(
            `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/inventory/items`,
            {
              headers: {
                'X-Auth-Token': ACCESS_TOKEN,
                'Accept': 'application/json'
              },
              params: {
                product_id: product.id
              }
            }
          );
          
          const inventory = inventoryResponse.data.data[0] || {};
          const totalInventory = inventory.available || product.inventory_level || 0;
          const lowStockThreshold = product.inventory_warning_level || 10;
          
          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            category: product.categories?.[0] || 'Uncategorized',
            inventory_level: totalInventory,
            inventory_warning_level: lowStockThreshold,
            is_low_stock: totalInventory <= lowStockThreshold && totalInventory > 0,
            is_out_of_stock: totalInventory <= 0,
            backorder_enabled: product.availability === 'available' && totalInventory <= 0,
            variants: product.variants?.map((v: any) => ({
              id: v.id,
              sku: v.sku,
              option_values: v.option_values,
              inventory_level: v.inventory_level || 0
            })) || [],
            image: product.images?.[0]?.url_thumbnail || null
          };
        } catch (error) {
          console.error(`Error fetching inventory for product ${product.id}:`, error);
          return {
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            inventory_level: product.inventory_level || 0,
            inventory_warning_level: product.inventory_warning_level || 10,
            is_low_stock: false,
            is_out_of_stock: false,
            backorder_enabled: false,
            variants: [],
            image: product.images?.[0]?.url_thumbnail || null
          };
        }
      })
    );

    // Filter for low stock if requested
    let filteredInventory = inventoryData;
    if (low_stock_only === 'true') {
      filteredInventory = inventoryData.filter(item => item.is_low_stock || item.is_out_of_stock);
    }

    // Calculate summary statistics
    const stats = {
      total_products: inventoryData.length,
      low_stock_count: inventoryData.filter(item => item.is_low_stock).length,
      out_of_stock_count: inventoryData.filter(item => item.is_out_of_stock).length,
      backorder_count: inventoryData.filter(item => item.backorder_enabled).length,
      total_inventory_value: inventoryData.reduce((sum, item) => 
        sum + (item.inventory_level * item.price), 0
      )
    };

    res.status(200).json({
      data: filteredInventory,
      stats,
      meta: {
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Inventory fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch inventory data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}