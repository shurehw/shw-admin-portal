import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;
const BUNDLE_B2B_URL = process.env.NEXT_PUBLIC_BUNDLEB2B_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Customer ID required' });
  }

  try {
    // Fetch customer from BigCommerce
    const customerResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${id}`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    const customer = customerResponse.data;

    // Fetch customer orders
    const ordersResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        },
        params: {
          customer_id: id,
          limit: 50,
          sort: 'date_created:desc'
        }
      }
    );

    const orders = ordersResponse.data;

    // Try to fetch B2B-specific data if available
    let b2bData = null;
    if (BUNDLE_B2B_URL) {
      try {
        const b2bResponse = await axios.get(
          `${BUNDLE_B2B_URL}/api/customers/${id}/b2b`,
          {
            headers: {
              'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
          }
        );
        b2bData = b2bResponse.data;
      } catch (error) {
        console.log('B2B data not available for customer');
      }
    }

    // Calculate credit information
    const creditInfo = {
      credit_limit: b2bData?.credit_limit || 50000,
      payment_terms: b2bData?.payment_terms || 'Net 30',
      used_credit: orders.reduce((sum: number, order: any) => {
        if (order.status === 'Pending' || order.status === 'Awaiting Payment') {
          return sum + parseFloat(order.total_inc_tax);
        }
        return sum;
      }, 0),
      available_credit: 0
    };
    creditInfo.available_credit = creditInfo.credit_limit - creditInfo.used_credit;

    // Format response
    const response = {
      id: customer.id,
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      phone: customer.phone || '',
      company: customer.company || '',
      date_created: customer.date_created,
      customer_group_id: customer.customer_group_id,
      notes: customer.notes || '',
      tax_exempt_category: customer.tax_exempt_category || '',
      addresses: customer.addresses || [],
      credit_info: creditInfo,
      recent_orders: orders.slice(0, 5),
      total_orders: orders.length,
      total_spent: orders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.total_inc_tax), 0
      ),
      b2b_data: b2bData
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ 
      error: 'Failed to fetch customer data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}