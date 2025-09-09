import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { customer_id, start_date, end_date } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!customer_id || typeof customer_id !== 'string') {
    return res.status(400).json({ error: 'Customer ID required' });
  }

  try {
    // Set date range (default to last 90 days)
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date 
      ? new Date(start_date as string) 
      : new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch customer details
    const customerResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customer_id}`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    const customer = customerResponse.data;

    // Fetch all orders for the customer in date range
    const ordersResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        },
        params: {
          customer_id: customer_id,
          min_date_created: startDate.toISOString(),
          max_date_created: endDate.toISOString(),
          limit: 250,
          sort: 'date_created:asc'
        }
      }
    );

    const orders = ordersResponse.data;

    // Try to fetch payment records from Supabase if available
    let payments = [];
    try {
      const { data: paymentData } = await supabase
        .from('customer_payments')
        .select('*')
        .eq('customer_id', customer_id)
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString())
        .order('payment_date', { ascending: true });
      
      if (paymentData) {
        payments = paymentData;
      }
    } catch (error) {
      console.log('Payment records not available');
    }

    // Build transaction list combining orders and payments
    const transactions = [];
    let runningBalance = 0;

    // Add opening balance if exists
    const openingBalance = await getOpeningBalance(customer_id, startDate);
    if (openingBalance !== 0) {
      transactions.push({
        id: 'opening',
        date: startDate.toISOString(),
        type: 'balance_forward',
        description: 'Opening Balance',
        reference: '',
        debit: openingBalance > 0 ? openingBalance : 0,
        credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
        balance: openingBalance
      });
      runningBalance = openingBalance;
    }

    // Add orders as debits
    orders.forEach((order: any) => {
      const amount = parseFloat(order.total_inc_tax);
      runningBalance += amount;
      
      transactions.push({
        id: `order-${order.id}`,
        date: order.date_created,
        type: 'invoice',
        description: `Order #${order.id}`,
        reference: order.id.toString(),
        debit: amount,
        credit: 0,
        balance: runningBalance
      });
    });

    // Add payments as credits
    payments.forEach((payment: any) => {
      runningBalance -= payment.amount;
      
      transactions.push({
        id: `payment-${payment.id}`,
        date: payment.payment_date,
        type: 'payment',
        description: `Payment - ${payment.method || 'Check'}`,
        reference: payment.reference || '',
        debit: 0,
        credit: payment.amount,
        balance: runningBalance
      });
    });

    // Sort transactions by date
    transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate summary
    const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);
    const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
    const endingBalance = runningBalance;

    // Calculate aging
    const aging = calculateAging(orders);

    const statement = {
      statement_id: `STMT-${Date.now()}`,
      customer: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        company: customer.company || '',
        email: customer.email,
        phone: customer.phone || ''
      },
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      transactions,
      summary: {
        opening_balance: openingBalance,
        total_debits: totalDebits,
        total_credits: totalCredits,
        ending_balance: endingBalance
      },
      aging,
      generated_at: new Date().toISOString()
    };

    res.status(200).json(statement);

  } catch (error) {
    console.error('Error generating statement:', error);
    res.status(500).json({ 
      error: 'Failed to generate statement',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getOpeningBalance(customerId: string, startDate: Date): Promise<number> {
  // This would typically fetch from a database
  // For now, return 0 as placeholder
  return 0;
}

function calculateAging(orders: any[]): any {
  const now = new Date();
  const aging = {
    current: 0,
    days_30: 0,
    days_60: 0,
    days_90: 0,
    over_90: 0
  };

  orders.forEach((order: any) => {
    if (order.status === 'Pending' || order.status === 'Awaiting Payment') {
      const orderDate = new Date(order.date_created);
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = parseFloat(order.total_inc_tax);

      if (daysDiff <= 30) {
        aging.current += amount;
      } else if (daysDiff <= 60) {
        aging.days_30 += amount;
      } else if (daysDiff <= 90) {
        aging.days_60 += amount;
      } else if (daysDiff <= 120) {
        aging.days_90 += amount;
      } else {
        aging.over_90 += amount;
      }
    }
  });

  return aging;
}