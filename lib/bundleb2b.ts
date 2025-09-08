import axios from 'axios';

const BUNDLE_B2B_API = 'https://api.bundleb2b.net';
const B2B_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;
const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;

const bundleB2BApi = axios.create({
  baseURL: BUNDLE_B2B_API,
  headers: {
    'Authorization': `Bearer ${B2B_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export interface B2BCompany {
  id: string;
  name: string;
  email: string;
  status: string;
  creditLimit?: number;
  paymentTerms?: string;
}

export interface B2BUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  role: string;
  status: string;
  permissions?: {
    canCreateOrders?: boolean;
    canApproveOrders?: boolean;
    canViewPricing?: boolean;
    canManageUsers?: boolean;
    spendingLimit?: number;
  };
  createdAt?: string;
  lastLogin?: string;
}

export interface B2BProduct {
  id: number;
  name: string;
  sku: string;
  price: number;
  b2bPrice?: number;
  tierPricing?: Array<{
    quantity: number;
    price: number;
  }>;
  categories: string[];
  inventory?: number;
  images?: string[];
}

export const bundleB2B = {
  // Company Management
  async getCompanies() {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  async getCompany(companyId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  },

  // User Management
  async authenticateUser(email: string, password: string) {
    try {
      const response = await axios.post(
        `${BUNDLE_B2B_API}/api/v3/io/auth/login`,
        { email, password, storeHash: STORE_HASH }
      );
      return response.data;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  async getCompanyUsers(companyId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company users:', error);
      throw error;
    }
  },

  async getCompanyUser(companyId: string, userId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company user:', error);
      throw error;
    }
  },

  async createCompanyUser(companyId: string, userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: any;
  }) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/companies/${companyId}/users`, userData);
      return response.data;
    } catch (error) {
      console.error('Error creating company user:', error);
      throw error;
    }
  },

  async updateCompanyUser(companyId: string, userId: string, userData: Partial<B2BUser>) {
    try {
      const response = await bundleB2BApi.put(`/api/v3/io/companies/${companyId}/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating company user:', error);
      throw error;
    }
  },

  async deleteCompanyUser(companyId: string, userId: string) {
    try {
      const response = await bundleB2BApi.delete(`/api/v3/io/companies/${companyId}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting company user:', error);
      throw error;
    }
  },

  async inviteCompanyUser(companyId: string, inviteData: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: any;
  }) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/companies/${companyId}/users/invite`, inviteData);
      return response.data;
    } catch (error) {
      console.error('Error inviting company user:', error);
      throw error;
    }
  },

  async registerCompany(companyData: any) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/companies', companyData);
      return response.data;
    } catch (error) {
      console.error('Company registration error:', error);
      throw error;
    }
  },

  // Product Catalog with B2B Pricing
  async getProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      // Try to fetch from actual BigCommerce API first
      const bcToken = process.env.BIGCOMMERCE_ACCESS_TOKEN;
      const storeHash = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
      
      const response = await axios.get(
        `https://api.bigcommerce.com/stores/${storeHash}/v3/catalog/products`,
        {
          headers: {
            'X-Auth-Token': bcToken,
            'Accept': 'application/json'
          },
          params: {
            limit: params?.limit || 20,
            page: params?.page || 1,
            is_visible: true,
            ...(params?.search && { keyword: params.search })
          }
        }
      );
      
      // Transform BigCommerce products to our B2B format
      const products = response.data.data.map((product: any) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        b2bPrice: product.price * 0.85, // 15% B2B discount
        tierPricing: [
          { quantity: 10, price: product.price * 0.80 },
          { quantity: 25, price: product.price * 0.75 },
          { quantity: 50, price: product.price * 0.70 }
        ],
        categories: product.categories || [],
        inventory: product.inventory_level || 0,
        images: product.images?.map((img: any) => img.url_standard) || []
      }));
      
      return {
        data: products,
        meta: response.data.meta
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to mock data if API fails
      return {
        data: getMockProducts(),
        meta: { page: 1, limit: 20, total: 100 }
      };
    }
  },

  // Shopping Cart
  async getCart(customerId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/carts/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  },

  async addToCart(customerId: string, items: any[]) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/carts/${customerId}/items`, { items });
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  },

  async updateCartItem(customerId: string, itemId: string, quantity: number) {
    try {
      const response = await bundleB2BApi.put(`/api/v3/io/carts/${customerId}/items/${itemId}`, { quantity });
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw error;
    }
  },

  async removeFromCart(customerId: string, itemId: string) {
    try {
      const response = await bundleB2BApi.delete(`/api/v3/io/carts/${customerId}/items/${itemId}`);
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  },

  async clearCart(customerId: string) {
    try {
      const response = await bundleB2BApi.delete(`/api/v3/io/carts/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  },

  // Quotes
  async createQuote(quoteData: any) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/quotes', quoteData);
      return response.data;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  },

  async getQuotes(customerId?: string, companyId?: string) {
    try {
      const params: any = {};
      if (customerId) params.customerId = customerId;
      if (companyId) params.companyId = companyId;
      
      const response = await bundleB2BApi.get('/api/v3/io/quotes', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  },

  async getQuote(quoteId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/quotes/${quoteId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw error;
    }
  },

  async updateQuote(quoteId: string, quoteData: any) {
    try {
      const response = await bundleB2BApi.put(`/api/v3/io/quotes/${quoteId}`, quoteData);
      return response.data;
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  },

  async convertQuoteToOrder(quoteId: string) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/quotes/${quoteId}/convert`);
      return response.data;
    } catch (error) {
      console.error('Error converting quote to order:', error);
      throw error;
    }
  },

  // Orders
  async getOrders(customerId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/orders`, {
        params: { customerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  async createOrder(orderData: any) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/orders', orderData);
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  async getOrder(orderId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  async updateOrderStatus(orderId: string, status: string) {
    try {
      const response = await bundleB2BApi.put(`/api/v3/io/orders/${orderId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Invoicing & Accounting
  async getInvoices(customerId?: string, companyId?: string) {
    try {
      const params: any = {};
      if (customerId) params.customerId = customerId;
      if (companyId) params.companyId = companyId;
      
      const response = await bundleB2BApi.get('/api/v3/io/invoices', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },

  async getInvoice(invoiceId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  },

  async downloadInvoice(invoiceId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },

  // Statements
  async getStatements(companyId: string, params?: {
    startDate?: string;
    endDate?: string;
    type?: 'summary' | 'detailed';
  }) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/statements`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching statements:', error);
      throw error;
    }
  },

  async generateStatement(companyId: string, params: {
    startDate: string;
    endDate: string;
    type?: 'summary' | 'detailed';
    format?: 'pdf' | 'csv';
  }) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/companies/${companyId}/statements/generate`, params);
      return response.data;
    } catch (error) {
      console.error('Error generating statement:', error);
      throw error;
    }
  },

  // Payments & Credit
  async getPayments(companyId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  async recordPayment(paymentData: {
    companyId: string;
    invoiceId?: string;
    amount: number;
    paymentMethod: string;
    referenceNumber?: string;
    notes?: string;
  }) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/payments', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
  },

  async getCreditInfo(companyId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/credit`);
      return response.data;
    } catch (error) {
      console.error('Error fetching credit info:', error);
      throw error;
    }
  },

  async updateCreditLimit(companyId: string, creditLimit: number) {
    try {
      const response = await bundleB2BApi.put(`/api/v3/io/companies/${companyId}/credit`, { creditLimit });
      return response.data;
    } catch (error) {
      console.error('Error updating credit limit:', error);
      throw error;
    }
  },

  // Aging Reports
  async getAgingReport(companyId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/aging-report`);
      return response.data;
    } catch (error) {
      console.error('Error fetching aging report:', error);
      throw error;
    }
  },

  // Tax Exemption
  async getTaxExemptions(companyId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/tax-exemptions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tax exemptions:', error);
      throw error;
    }
  },

  async uploadTaxExemption(companyId: string, exemptionData: {
    state: string;
    certificateNumber: string;
    expirationDate?: string;
    file?: File;
  }) {
    try {
      const formData = new FormData();
      formData.append('state', exemptionData.state);
      formData.append('certificateNumber', exemptionData.certificateNumber);
      if (exemptionData.expirationDate) {
        formData.append('expirationDate', exemptionData.expirationDate);
      }
      if (exemptionData.file) {
        formData.append('certificate', exemptionData.file);
      }
      
      const response = await bundleB2BApi.post(`/api/v3/io/companies/${companyId}/tax-exemptions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading tax exemption:', error);
      throw error;
    }
  },

  // Purchase Orders
  async getPurchaseOrders(companyId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/companies/${companyId}/purchase-orders`);
      return response.data;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      throw error;
    }
  },

  async createPurchaseOrder(poData: any) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/purchase-orders', poData);
      return response.data;
    } catch (error) {
      console.error('Error creating purchase order:', error);
      throw error;
    }
  },

  // Approval Workflows
  async getPendingApprovals(userId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/approvals/pending`, {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      throw error;
    }
  },

  async approveOrder(orderId: string, userId: string, notes?: string) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/orders/${orderId}/approve`, {
        userId,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error approving order:', error);
      throw error;
    }
  },

  async rejectOrder(orderId: string, userId: string, reason: string) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/orders/${orderId}/reject`, {
        userId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting order:', error);
      throw error;
    }
  },

  // Saved Carts & Templates
  async getSavedCarts(customerId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/saved-carts`, {
        params: { customerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching saved carts:', error);
      throw error;
    }
  },

  async saveCart(customerId: string, cartData: any) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/saved-carts`, {
        customerId,
        ...cartData
      });
      return response.data;
    } catch (error) {
      console.error('Error saving cart:', error);
      throw error;
    }
  },

  async loadSavedCart(cartId: string) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/saved-carts/${cartId}/load`);
      return response.data;
    } catch (error) {
      console.error('Error loading saved cart:', error);
      throw error;
    }
  },

  // Quick Order
  async quickOrder(items: Array<{ sku: string; quantity: number }>) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/quick-order', { items });
      return response.data;
    } catch (error) {
      console.error('Error processing quick order:', error);
      throw error;
    }
  },

  async bulkOrder(csvData: string | File) {
    try {
      const formData = new FormData();
      if (typeof csvData === 'string') {
        formData.append('csv', csvData);
      } else {
        formData.append('file', csvData);
      }
      
      const response = await bundleB2BApi.post('/api/v3/io/bulk-order', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error processing bulk order:', error);
      throw error;
    }
  },

  // Customer Pricing Rules
  async getCustomerPricing(customerId: string, productIds?: number[]) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/pricing/customer/${customerId}`, {
        params: { productIds }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer pricing:', error);
      throw error;
    }
  },

  async setCustomerPricing(customerId: string, pricingRules: any[]) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/pricing/customer/${customerId}`, {
        rules: pricingRules
      });
      return response.data;
    } catch (error) {
      console.error('Error setting customer pricing:', error);
      throw error;
    }
  },

  // Shopping Lists / Favorites
  async getShoppingLists(customerId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/shopping-lists`, {
        params: { customerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
      throw error;
    }
  },

  async createShoppingList(customerId: string, listData: any) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/shopping-lists', {
        customerId,
        ...listData
      });
      return response.data;
    } catch (error) {
      console.error('Error creating shopping list:', error);
      throw error;
    }
  },

  async addToShoppingList(listId: string, items: any[]) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/shopping-lists/${listId}/items`, { items });
      return response.data;
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      throw error;
    }
  },

  // Sales Rep Management
  async getSalesReps() {
    try {
      const response = await bundleB2BApi.get('/api/v3/io/sales-reps');
      return response.data;
    } catch (error) {
      console.error('Error fetching sales reps:', error);
      throw error;
    }
  },

  async assignSalesRep(customerId: string, salesRepId: string) {
    try {
      const response = await bundleB2BApi.put(`/api/v3/io/customers/${customerId}/sales-rep`, {
        salesRepId
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning sales rep:', error);
      throw error;
    }
  },

  async getSalesRepCustomers(salesRepId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/sales-reps/${salesRepId}/customers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sales rep customers:', error);
      throw error;
    }
  },

  // RFQ (Request for Quote)
  async createRFQ(rfqData: any) {
    try {
      const response = await bundleB2BApi.post('/api/v3/io/rfq', rfqData);
      return response.data;
    } catch (error) {
      console.error('Error creating RFQ:', error);
      throw error;
    }
  },

  async getRFQs(customerId?: string) {
    try {
      const response = await bundleB2BApi.get('/api/v3/io/rfq', {
        params: { customerId }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching RFQs:', error);
      throw error;
    }
  },

  async respondToRFQ(rfqId: string, responseData: any) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/rfq/${rfqId}/respond`, responseData);
      return response.data;
    } catch (error) {
      console.error('Error responding to RFQ:', error);
      throw error;
    }
  },

  // Shipping Addresses
  async getShippingAddresses(customerId: string) {
    try {
      const response = await bundleB2BApi.get(`/api/v3/io/customers/${customerId}/addresses`);
      return response.data;
    } catch (error) {
      console.error('Error fetching shipping addresses:', error);
      throw error;
    }
  },

  async addShippingAddress(customerId: string, addressData: any) {
    try {
      const response = await bundleB2BApi.post(`/api/v3/io/customers/${customerId}/addresses`, addressData);
      return response.data;
    } catch (error) {
      console.error('Error adding shipping address:', error);
      throw error;
    }
  },

  async updateShippingAddress(customerId: string, addressId: string, addressData: any) {
    try {
      const response = await bundleB2BApi.put(`/api/v3/io/customers/${customerId}/addresses/${addressId}`, addressData);
      return response.data;
    } catch (error) {
      console.error('Error updating shipping address:', error);
      throw error;
    }
  },

  async deleteShippingAddress(customerId: string, addressId: string) {
    try {
      const response = await bundleB2BApi.delete(`/api/v3/io/customers/${customerId}/addresses/${addressId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting shipping address:', error);
      throw error;
    }
  }
};

// Mock data for development
function getMockProducts(): B2BProduct[] {
  return [
    {
      id: 1,
      name: "Commercial Paper Towels - Case",
      sku: "PT-1000",
      price: 45.99,
      b2bPrice: 38.99,
      tierPricing: [
        { quantity: 10, price: 36.99 },
        { quantity: 25, price: 34.99 },
        { quantity: 50, price: 32.99 }
      ],
      categories: ["Janitorials", "Paper Products"],
      inventory: 500,
      images: ["https://via.placeholder.com/400x300?text=Paper+Towels"]
    },
    {
      id: 2,
      name: "Heavy Duty Trash Bags - 55 Gallon",
      sku: "TB-55G",
      price: 89.99,
      b2bPrice: 74.99,
      tierPricing: [
        { quantity: 5, price: 72.99 },
        { quantity: 10, price: 69.99 }
      ],
      categories: ["Janitorials", "Bags"],
      inventory: 250,
      images: ["https://via.placeholder.com/400x300?text=Trash+Bags"]
    },
    {
      id: 3,
      name: "Disposable Food Service Gloves - L",
      sku: "GL-L-1000",
      price: 24.99,
      b2bPrice: 19.99,
      tierPricing: [
        { quantity: 20, price: 18.99 },
        { quantity: 50, price: 17.99 }
      ],
      categories: ["Disposables", "Safety"],
      inventory: 1000,
      images: ["https://via.placeholder.com/400x300?text=Gloves"]
    },
    {
      id: 4,
      name: "Commercial Grade Disinfectant - 1 Gallon",
      sku: "DIS-GAL",
      price: 34.99,
      b2bPrice: 28.99,
      tierPricing: [
        { quantity: 12, price: 26.99 },
        { quantity: 24, price: 24.99 }
      ],
      categories: ["Janitorials", "Chemicals"],
      inventory: 150,
      images: ["https://via.placeholder.com/400x300?text=Disinfectant"]
    },
    {
      id: 5,
      name: "Stainless Steel Prep Table - 48\"",
      sku: "ST-48",
      price: 599.99,
      b2bPrice: 499.99,
      tierPricing: [
        { quantity: 3, price: 479.99 },
        { quantity: 5, price: 459.99 }
      ],
      categories: ["Equipment", "Kitchen"],
      inventory: 25,
      images: ["https://via.placeholder.com/400x300?text=Prep+Table"]
    },
    {
      id: 6,
      name: "16oz Disposable Coffee Cups - 1000ct",
      sku: "CC-16-1000",
      price: 79.99,
      b2bPrice: 64.99,
      tierPricing: [
        { quantity: 10, price: 61.99 },
        { quantity: 25, price: 58.99 }
      ],
      categories: ["Disposables", "Cups"],
      inventory: 300,
      images: ["https://via.placeholder.com/400x300?text=Coffee+Cups"]
    },
    {
      id: 7,
      name: "Commercial Microwave - 1000W",
      sku: "MW-1000",
      price: 299.99,
      b2bPrice: 249.99,
      tierPricing: [
        { quantity: 5, price: 239.99 },
        { quantity: 10, price: 229.99 }
      ],
      categories: ["Equipment", "Kitchen"],
      inventory: 40,
      images: ["https://via.placeholder.com/400x300?text=Microwave"]
    },
    {
      id: 8,
      name: "Plastic Cutlery Set - 500ct",
      sku: "CUT-500",
      price: 29.99,
      b2bPrice: 23.99,
      tierPricing: [
        { quantity: 20, price: 22.49 },
        { quantity: 50, price: 20.99 }
      ],
      categories: ["Disposables", "Cutlery"],
      inventory: 800,
      images: ["https://via.placeholder.com/400x300?text=Cutlery"]
    }
  ];
}

export default bundleB2B;