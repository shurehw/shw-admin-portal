export interface Quote {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  title: string;
  description?: string;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  tax_amount?: number;
  total: number;
  valid_until?: string;
  created_at: string;
  updated_at: string;
  quote_items?: QuoteItem[];
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  item_id: string;
  quantity: number;
  cost_price: number;
  cost_with_pad: number;
  markup_percentage: number;
  selling_price: number;
  previous_supplier?: string;
  previous_price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  item?: Item;
}

export interface Item {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  cost_price?: number;
  selling_price?: number;
  category?: string;
  supplier?: string;
  supplier_sku?: string;
  unit?: string;
  weight?: number;
  dimensions?: string;
  images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteItemInput {
  item_id: string;
  quantity: number;
  cost_price: number;
  cost_with_pad: number;
  markup_percentage: number;
  selling_price: number;
  previous_supplier?: string;
  previous_price?: number;
  notes?: string;
}

export interface CreateQuoteRequest {
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  title: string;
  description?: string;
  notes?: string;
  items?: QuoteItemInput[];
  status?: Quote['status'];
}

export interface UpdateQuoteRequest extends Partial<CreateQuoteRequest> {
  items?: QuoteItemInput[];
}

// Helper functions for calculations
export const calculateCostWithPad = (costPrice: number, padPercentage: number = 10): number => {
  return costPrice * (1 + padPercentage / 100);
};

export const calculateSellingPrice = (costWithPad: number, markupPercentage: number): number => {
  return costWithPad * (1 + markupPercentage / 100);
};

export const calculateMarkupFromPrices = (costWithPad: number, sellingPrice: number): number => {
  if (costWithPad === 0) return 0;
  return ((sellingPrice - costWithPad) / costWithPad) * 100;
};

export const calculateQuoteTotal = (items: QuoteItem[]): number => {
  return items.reduce((total, item) => total + (item.selling_price * item.quantity), 0);
};

// Price history tracking
export interface PriceHistory {
  id: string;
  item_id: string;
  supplier: string;
  cost_price: number;
  date: string;
  quote_id?: string;
  notes?: string;
}

// Supplier information
export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}