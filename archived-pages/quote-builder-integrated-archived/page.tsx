'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  FileText, Plus, Trash2, Search, Send, Save,
  User, Building, Mail, Phone, Calendar, DollarSign,
  Package, AlertCircle, CheckCircle, Loader
} from 'lucide-react';

interface QuoteItem {
  id: string;
  productName: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  customization?: string;
}

interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  creditLimit: number;
  paymentTerms: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  sale_price?: number;
  description: string;
  categories?: number[];
  primary_image?: {
    url_thumbnail: string;
  };
  inventory_level?: number;
  custom_fields?: Array<{
    name: string;
    value: string;
  }>;
}

export default function IntegratedQuoteBuilder() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [taxRate, setTaxRate] = useState(8.25);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  // Check if user has production access
  useEffect(() => {
    if (session?.user) {
      const allowedRoles = ['admin', 'production', 'art_team'];
      if (!allowedRoles.includes(session.user.role)) {
        router.push('/admin/dashboard');
      }
    }
  }, [session, router]);

  // Load data
  useEffect(() => {
    // Load customers
    const mockCustomers: Customer[] = [
      {
        id: '1',
        companyName: 'Marriott International',
        contactName: 'John Smith',
        email: 'purchasing@marriott.com',
        phone: '(555) 123-4567',
        creditLimit: 100000,
        paymentTerms: 'NET 30'
      },
      {
        id: '2',
        companyName: 'Hilton Hotels',
        contactName: 'Sarah Johnson',
        email: 'orders@hilton.com',
        phone: '(555) 234-5678',
        creditLimit: 75000,
        paymentTerms: 'NET 45'
      },
      {
        id: '3',
        companyName: 'Hyatt Hotels',
        contactName: 'Michael Brown',
        email: 'procurement@hyatt.com',
        phone: '(555) 345-6789',
        creditLimit: 85000,
        paymentTerms: 'NET 30'
      }
    ];
    setCustomers(mockCustomers);

    // Load products from BigCommerce
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100');
      const data = await response.json();
      
      if (data.products) {
        // Transform BigCommerce products to our format
        const transformedProducts = data.products.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.sale_price || p.price,
          description: p.description || '',
          categories: p.categories,
          primary_image: p.primary_image,
          inventory_level: p.inventory_level,
          custom_fields: p.custom_fields
        }));
        setProducts(transformedProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      // Fallback to some sample products if API fails
      const fallbackProducts: Product[] = [
        { id: 1, name: 'Custom Napkins', sku: 'NAP-001', price: 12.99, description: 'Premium napkins' },
        { id: 2, name: 'Water Glass', sku: 'GLS-001', price: 8.50, description: 'Crystal clear glass' }
      ];
      setProducts(fallbackProducts);
    }
  };

  // Filter customers
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(c => 
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    } else {
      setFilteredCustomers(customers);
    }
  }, [searchTerm, customers]);

  // Filter products
  useEffect(() => {
    if (productSearch) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products.slice(0, 10)); // Show first 10 products when not searching
    }
  }, [productSearch, products]);

  const addProductToQuote = (product: Product) => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      productName: product.name,
      sku: product.sku,
      description: product.description,
      quantity: 1,
      unitPrice: product.price,
      discount: 0,
      total: product.price
    };
    setQuoteItems([...quoteItems, newItem]);
    setProductSearch('');
    setShowProductSearch(false);
  };

  const updateQuoteItem = (id: string, field: keyof QuoteItem, value: any) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate total
        const subtotal = updated.quantity * updated.unitPrice;
        const discountAmount = subtotal * (updated.discount / 100);
        updated.total = subtotal - discountAmount;
        return updated;
      }
      return item;
    }));
  };

  const removeQuoteItem = (id: string) => {
    setQuoteItems(items => items.filter(item => item.id !== id));
  };

  const calculateSubtotal = () => {
    return quoteItems.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + shippingCost;
  };

  const saveQuote = async (status: 'draft' | 'sent') => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }

    if (quoteItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const quoteData = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.companyName,
        customerEmail: selectedCustomer.email,
        items: quoteItems,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        shipping: shippingCost,
        total: calculateTotal(),
        notes: quoteNotes,
        validUntil,
        status
      };

      const response = await fetch('/api/admin/quotes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quoteData)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(result.message);
        // Reset form
        setTimeout(() => {
          setSelectedCustomer(null);
          setQuoteItems([]);
          setQuoteNotes('');
          setValidUntil('');
          setShippingCost(0);
          setSuccessMessage('');
        }, 3000);
      } else {
        alert('Failed to save quote: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Failed to save quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quote Builder</h1>
          <p className="text-gray-600 mt-1">Create custom quotes for B2B customers</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Customer Information
          </h2>
          
          {!selectedCustomer ? (
            <div className="relative">
              <div className="flex items-center">
                <Search className="absolute left-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for customer..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowCustomerSearch(true)}
                />
              </div>
              
              {showCustomerSearch && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setSearchTerm('');
                        setShowCustomerSearch(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{customer.companyName}</div>
                      <div className="text-sm text-gray-600">
                        {customer.contactName} • {customer.email}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{selectedCustomer.companyName}</h3>
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {selectedCustomer.contactName}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {selectedCustomer.email}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {selectedCustomer.phone}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Credit: ${selectedCustomer.creditLimit.toLocaleString()} • {selectedCustomer.paymentTerms}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Product Search & Add */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Add Products
          </h2>
          
          <div className="relative">
            <div className="flex items-center">
              <Search className="absolute left-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                onFocus={() => setShowProductSearch(true)}
              />
            </div>
            
            {showProductSearch && filteredProducts.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => addProductToQuote(product)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center"
                  >
                    {product.primary_image && (
                      <img 
                        src={product.primary_image.url_thumbnail} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded mr-3"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">
                        SKU: {product.sku} {product.inventory_level !== undefined && `• Stock: ${product.inventory_level}`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">${product.price.toFixed(2)}</div>
                      {product.custom_fields && product.custom_fields.length > 0 && (
                        <div className="text-xs text-gray-500">Customizable</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quote Items */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Quote Items</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quoteItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{item.sku}</td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                        value={item.quantity}
                        onChange={(e) => updateQuoteItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                        value={item.unitPrice}
                        onChange={(e) => updateQuoteItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                        value={item.discount}
                        onChange={(e) => updateQuoteItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">${item.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => removeQuoteItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {quoteItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No items added. Search for products above to add them to the quote.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quote Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Additional Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes / Special Instructions
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                  rows={4}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Add any special notes or instructions..."
                />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Pricing Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shipping</span>
                <input
                  type="number"
                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tax ({taxRate}%)</span>
                <span className="font-medium">${calculateTax().toFixed(2)}</span>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-semibold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              <button
                onClick={() => saveQuote('sent')}
                disabled={loading || !selectedCustomer || quoteItems.length === 0}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Quote to Customer
                  </>
                )}
              </button>
              <button
                onClick={() => saveQuote('draft')}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}