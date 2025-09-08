import axios from 'axios';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;
const API_URL = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3`;
const B2B_API_URL = `https://api-b2b.bigcommerce.com/api/v3/io`;

const bigcommerceAPI = axios.create({
  baseURL: API_URL,
  headers: {
    'X-Auth-Token': ACCESS_TOKEN,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  sale_price?: number;
  retail_price?: number;
  cost_price?: number;
  calculated_price?: number;
  inventory_level?: number;
  description: string;
  is_visible: boolean;
  images?: ProductImage[];
  categories?: number[];
  custom_fields?: CustomField[];
}

export interface ProductImage {
  id: number;
  product_id: number;
  url_standard: string;
  url_thumbnail: string;
  url_tiny: string;
  url_zoom: string;
}

export interface CustomField {
  id: number;
  name: string;
  value: string;
}

export interface Customer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  phone?: string;
  customer_group_id?: number;
}

export interface B2BPriceRule {
  product_id: number;
  customer_group_id: number;
  price: number;
  bulk_pricing?: BulkPricing[];
}

export interface BulkPricing {
  min_quantity: number;
  max_quantity?: number;
  type: 'fixed' | 'percent' | 'off';
  amount: number;
}

export const bigcommerce = {
  async getProducts(params?: { 
    limit?: number; 
    page?: number; 
    categories?: number[];
    is_visible?: boolean;
  }) {
    const response = await bigcommerceAPI.get('/catalog/products', { params });
    return response.data;
  },

  async getProduct(id: number) {
    const response = await bigcommerceAPI.get(`/catalog/products/${id}`);
    return response.data;
  },

  async getCategories() {
    const response = await bigcommerceAPI.get('/catalog/categories');
    return response.data;
  },

  async getCustomer(id: number) {
    const response = await bigcommerceAPI.get(`/customers/${id}`);
    return response.data;
  },

  async getCustomerByEmail(email: string) {
    const response = await bigcommerceAPI.get('/customers', {
      params: { 'email:in': email }
    });
    return response.data.data[0];
  },

  async createCustomer(customerData: Partial<Customer>) {
    const response = await bigcommerceAPI.post('/customers', [customerData]);
    return response.data;
  },

  async getCustomerGroups() {
    const response = await bigcommerceAPI.get('/customer_groups');
    return response.data;
  },

  async createCart(items: any[]) {
    const response = await bigcommerceAPI.post('/carts', {
      line_items: items
    });
    return response.data;
  },

  async updateCart(cartId: string, items: any[]) {
    const response = await bigcommerceAPI.put(`/carts/${cartId}`, {
      line_items: items
    });
    return response.data;
  },

  async getCart(cartId: string) {
    const response = await bigcommerceAPI.get(`/carts/${cartId}`);
    return response.data;
  },

  async createCheckout(cartId: string) {
    const response = await bigcommerceAPI.post(`/carts/${cartId}/redirect_urls`);
    return response.data;
  },

  async getOrders(params?: { customer_id?: number; limit?: number; page?: number }) {
    const response = await bigcommerceAPI.get('/orders', { params });
    return response.data;
  },

  async getOrder(orderId: number) {
    const response = await bigcommerceAPI.get(`/orders/${orderId}`);
    return response.data;
  },

  async applyB2BPricing(products: Product[], customerGroupId: number): Promise<Product[]> {
    return products.map(product => {
      const b2bPrice = calculateB2BPrice(product, customerGroupId);
      return {
        ...product,
        calculated_price: b2bPrice
      };
    });
  }
};

function calculateB2BPrice(product: Product, customerGroupId: number): number {
  const basePrice = product.sale_price || product.price;
  
  if (customerGroupId === 2) {
    return basePrice * 0.8;
  } else if (customerGroupId === 3) {
    return basePrice * 0.75;
  } else if (customerGroupId === 4) {
    return basePrice * 0.7;
  }
  
  return basePrice;
}

export default bigcommerce;