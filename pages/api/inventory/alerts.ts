import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

interface StockAlert {
  id?: string;
  product_id: number;
  product_name: string;
  sku: string;
  current_stock: number;
  threshold: number;
  alert_type: 'low_stock' | 'out_of_stock' | 'back_in_stock';
  status: 'active' | 'resolved' | 'acknowledged';
  created_at?: string;
  resolved_at?: string | null;
  notes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return getAlerts(req, res);
    case 'POST':
      return checkAndCreateAlerts(req, res);
    case 'PUT':
      return updateAlert(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getAlerts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { status, limit = 50 } = req.query;
    
    // Get alerts from Supabase
    let query = supabase
      .from('inventory_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Number(limit));
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: alerts, error } = await query;
    
    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') {
        return res.status(200).json({ data: [], message: 'Alerts table not initialized' });
      }
      throw error;
    }
    
    res.status(200).json({ data: alerts || [] });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
}

async function checkAndCreateAlerts(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch all products from BigCommerce
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
          limit: 250
        }
      }
    );

    const products = productsResponse.data.data;
    const newAlerts: StockAlert[] = [];
    const resolvedAlerts: string[] = [];
    
    // Get existing active alerts
    const { data: existingAlerts } = await supabase
      .from('inventory_alerts')
      .select('*')
      .eq('status', 'active');
    
    const existingAlertMap = new Map(
      (existingAlerts || []).map(alert => [alert.product_id, alert])
    );
    
    // Check each product for stock issues
    for (const product of products) {
      const inventoryLevel = product.inventory_level || 0;
      const warningLevel = product.inventory_warning_level || 10;
      const existingAlert = existingAlertMap.get(product.id);
      
      if (inventoryLevel === 0) {
        // Out of stock
        if (!existingAlert || existingAlert.alert_type !== 'out_of_stock') {
          newAlerts.push({
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            current_stock: inventoryLevel,
            threshold: warningLevel,
            alert_type: 'out_of_stock',
            status: 'active'
          });
        }
      } else if (inventoryLevel <= warningLevel) {
        // Low stock
        if (!existingAlert || existingAlert.alert_type !== 'low_stock') {
          newAlerts.push({
            product_id: product.id,
            product_name: product.name,
            sku: product.sku,
            current_stock: inventoryLevel,
            threshold: warningLevel,
            alert_type: 'low_stock',
            status: 'active'
          });
        }
      } else if (existingAlert && inventoryLevel > warningLevel) {
        // Stock restored
        resolvedAlerts.push(existingAlert.id);
        
        // Create a "back in stock" notification
        newAlerts.push({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          current_stock: inventoryLevel,
          threshold: warningLevel,
          alert_type: 'back_in_stock',
          status: 'resolved',
          resolved_at: new Date().toISOString()
        });
      }
    }
    
    // Insert new alerts
    if (newAlerts.length > 0) {
      const { error: insertError } = await supabase
        .from('inventory_alerts')
        .insert(newAlerts);
      
      if (insertError && insertError.code !== '42P01') {
        throw insertError;
      }
    }
    
    // Resolve old alerts
    if (resolvedAlerts.length > 0) {
      const { error: updateError } = await supabase
        .from('inventory_alerts')
        .update({ 
          status: 'resolved', 
          resolved_at: new Date().toISOString() 
        })
        .in('id', resolvedAlerts);
      
      if (updateError && updateError.code !== '42P01') {
        throw updateError;
      }
    }
    
    res.status(200).json({
      message: 'Stock alerts checked',
      new_alerts: newAlerts.length,
      resolved_alerts: resolvedAlerts.length,
      alerts: newAlerts
    });
    
  } catch (error) {
    console.error('Error checking stock alerts:', error);
    res.status(500).json({ error: 'Failed to check stock alerts' });
  }
}

async function updateAlert(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { status, notes } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Alert ID required' });
    }
    
    const updates: any = {};
    if (status) updates.status = status;
    if (notes) updates.notes = notes;
    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }
    
    const { data, error } = await supabase
      .from('inventory_alerts')
      .update(updates)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === '42P01') {
        return res.status(404).json({ error: 'Alerts table not initialized' });
      }
      throw error;
    }
    
    res.status(200).json({ data });
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
}