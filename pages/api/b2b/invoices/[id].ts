import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invoice/Order ID required' });
  }

  try {
    // Fetch order details from BigCommerce
    const orderResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders/${id}`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    const order = orderResponse.data;

    // Fetch order products
    const productsResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders/${id}/products`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    const products = productsResponse.data;

    // Fetch customer details
    const customerResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${order.customer_id}`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    const customer = customerResponse.data;

    // Create invoice data
    const invoiceData = {
      invoice_number: `INV-${order.id}`,
      order_id: order.id,
      date: order.date_created,
      due_date: new Date(new Date(order.date_created).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        name: `${customer.first_name} ${customer.last_name}`,
        company: customer.company || '',
        email: customer.email,
        phone: customer.phone || '',
        billing_address: order.billing_address
      },
      items: products.map((product: any) => ({
        sku: product.sku,
        name: product.name,
        quantity: product.quantity,
        price: parseFloat(product.price_ex_tax),
        total: parseFloat(product.total_ex_tax)
      })),
      subtotal: parseFloat(order.subtotal_ex_tax),
      tax: parseFloat(order.total_tax),
      shipping: parseFloat(order.shipping_cost_ex_tax),
      total: parseFloat(order.total_inc_tax),
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      notes: order.staff_notes || order.customer_message || '',
      // Add PDF download URL for client-side generation
      pdf_url: `/api/b2b/invoices/${id}?format=pdf`
    };

    // Return JSON invoice data
    res.status(200).json(invoiceData);

  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to generate invoice',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}