import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;
const BUNDLE_B2B_URL = process.env.NEXT_PUBLIC_BUNDLEB2B_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Customer ID required' });
  }

  switch (req.method) {
    case 'GET':
      return getCreditInfo(id, res);
    case 'PUT':
      return updateCreditInfo(id, req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCreditInfo(customerId: string, res: NextApiResponse) {
  try {
    // Try to get credit info from Bundle B2B first
    let creditData = null;
    if (BUNDLE_B2B_URL) {
      try {
        const b2bResponse = await axios.get(
          `${BUNDLE_B2B_URL}/api/customers/${customerId}/credit`,
          {
            headers: {
              'Authorization': `Bearer ${ACCESS_TOKEN}`
            }
          }
        );
        creditData = b2bResponse.data;
      } catch (error) {
        console.log('B2B credit data not available');
      }
    }

    // If no B2B data, check Supabase for custom credit limits
    if (!creditData) {
      const { data: supabaseCredit } = await supabase
        .from('customer_credit')
        .select('*')
        .eq('customer_id', customerId)
        .single();
      
      if (supabaseCredit) {
        creditData = supabaseCredit;
      }
    }

    // Get pending orders to calculate used credit
    const ordersResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/orders`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        },
        params: {
          customer_id: customerId,
          status_id: '1,11', // Pending and Awaiting Payment statuses
          limit: 250
        }
      }
    );

    const pendingOrders = ordersResponse.data;
    
    // Calculate used credit from pending orders
    const usedCredit = pendingOrders.reduce((sum: number, order: any) => {
      return sum + parseFloat(order.total_inc_tax);
    }, 0);

    // Get customer group for default credit limit
    const customerResponse = await axios.get(
      `https://api.bigcommerce.com/stores/${STORE_HASH}/v2/customers/${customerId}`,
      {
        headers: {
          'X-Auth-Token': ACCESS_TOKEN,
          'Accept': 'application/json'
        }
      }
    );

    const customer = customerResponse.data;
    
    // Determine credit limit based on customer group or default
    let creditLimit = 10000; // Default credit limit
    let paymentTerms = 'Net 30'; // Default payment terms
    
    if (creditData) {
      creditLimit = creditData.credit_limit;
      paymentTerms = creditData.payment_terms || paymentTerms;
    } else if (customer.customer_group_id) {
      // You could fetch group-specific limits here
      switch (customer.customer_group_id) {
        case 1: // Wholesale
          creditLimit = 50000;
          paymentTerms = 'Net 30';
          break;
        case 2: // VIP
          creditLimit = 100000;
          paymentTerms = 'Net 45';
          break;
        case 3: // Regular B2B
          creditLimit = 25000;
          paymentTerms = 'Net 30';
          break;
        default:
          creditLimit = 10000;
          paymentTerms = 'Net 30';
      }
    }

    // Get payment history for credit score calculation
    const { data: paymentHistory } = await supabase
      .from('customer_payments')
      .select('*')
      .eq('customer_id', customerId)
      .order('payment_date', { ascending: false })
      .limit(12);

    // Calculate simple credit score based on payment history
    let creditScore = 'Good'; // Default
    if (paymentHistory && paymentHistory.length > 0) {
      const latePayments = paymentHistory.filter((p: any) => p.days_late > 0).length;
      const avgDaysLate = paymentHistory.reduce((sum: number, p: any) => 
        sum + (p.days_late || 0), 0) / paymentHistory.length;
      
      if (avgDaysLate > 30 || latePayments > 3) {
        creditScore = 'Poor';
      } else if (avgDaysLate > 15 || latePayments > 1) {
        creditScore = 'Fair';
      } else {
        creditScore = 'Excellent';
      }
    }

    const response = {
      customer_id: customerId,
      credit_limit: creditLimit,
      used_credit: usedCredit,
      available_credit: Math.max(0, creditLimit - usedCredit),
      payment_terms: paymentTerms,
      credit_score: creditScore,
      credit_utilization: creditLimit > 0 ? (usedCredit / creditLimit) * 100 : 0,
      pending_orders: pendingOrders.length,
      payment_history: {
        total_payments: paymentHistory?.length || 0,
        on_time_payments: paymentHistory?.filter((p: any) => !p.days_late || p.days_late === 0).length || 0,
        late_payments: paymentHistory?.filter((p: any) => p.days_late > 0).length || 0,
        average_days_to_pay: paymentHistory && paymentHistory.length > 0
          ? paymentHistory.reduce((sum: number, p: any) => sum + (p.days_to_pay || 30), 0) / paymentHistory.length
          : 30
      },
      last_updated: new Date().toISOString()
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error fetching credit info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch credit information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function updateCreditInfo(customerId: string, req: NextApiRequest, res: NextApiResponse) {
  try {
    const { credit_limit, payment_terms, notes } = req.body;

    // Update or insert credit info in Supabase
    const creditData = {
      customer_id: customerId,
      credit_limit: credit_limit,
      payment_terms: payment_terms,
      notes: notes,
      updated_at: new Date().toISOString(),
      updated_by: 'admin' // You might want to get this from auth context
    };

    const { data, error } = await supabase
      .from('customer_credit')
      .upsert(creditData, {
        onConflict: 'customer_id'
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist, try to create it
      if (error.code === '42P01') {
        // Create table
        await supabase.rpc('create_customer_credit_table');
        
        // Retry insert
        const { data: retryData, error: retryError } = await supabase
          .from('customer_credit')
          .insert(creditData)
          .select()
          .single();
        
        if (retryError) {
          throw retryError;
        }
        
        return res.status(200).json(retryData);
      }
      throw error;
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Error updating credit info:', error);
    res.status(500).json({ 
      error: 'Failed to update credit information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}