'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-mock';
import { useRouter, useParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Plus, Minus, Trash2, ShoppingCart, 
  User, Building, CreditCard, Truck, AlertCircle, Check
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  minQuantity: number;
  imageUrl: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: string;
  shippingAddresses: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    isDefault: boolean;
  }>;
}

export default function PlaceOrderForCustomer() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [rushOrder, setRushOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (customerId) {
      fetchCustomerAndProducts();
    }
  }, [customerId]);

  const fetchCustomerAndProducts = async () => {
    setLoading(true);
    try {
      // Mock customer data
      const mockCustomer: Customer = {
        id: customerId as string,
        companyName: 'Marriott International',
        contactName: 'John Smith',
        email: 'purchasing@marriott.com',
        creditLimit: 100000,
        currentBalance: 45678,
        paymentTerms: 'NET 30',
        shippingAddresses: [
          {
            id: 'addr1',
            name: 'Main Warehouse',
            address: '123 Hotel Way',
            city: 'Miami',
            state: 'FL',
            zip: '33166',
            isDefault: true
          },
          {
            id: 'addr2',
            name: 'Downtown Location',
            address: '456 Business Blvd',
            city: 'Miami',
            state: 'FL',
            zip: '33131',
            isDefault: false
          }
        ]
      };
      setCustomer(mockCustomer);
      setSelectedShipping(mockCustomer.shippingAddresses[0].id);

      // Mock products
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Premium Dinnerware Set',
          sku: 'DW-001',
          price: 45.99,
          stock: 500,
          minQuantity: 10,
          imageUrl: '/placeholder.jpg'
        },
        {
          id: '2',
          name: 'Commercial Glass Set',
          sku: 'GL-002',
          price: 28.50,
          stock: 300,
          minQuantity: 12,
          imageUrl: '/placeholder.jpg'
        },
        {
          id: '3',
          name: 'Hotel Towel Set',
          sku: 'HT-003',
          price: 89.99,
          stock: 200,
          minQuantity: 5,
          imageUrl: '/placeholder.jpg'
        },
        {
          id: '4',
          name: 'Restaurant Napkins (1000ct)',
          sku: 'RN-004',
          price: 34.99,
          stock: 1000,
          minQuantity: 1,
          imageUrl: '/placeholder.jpg'
        }
      ];
      setProducts(mockProducts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    if (existingItem) {
      updateQuantity(product.id, existingItem.quantity + product.minQuantity);
    } else {
      setCart([...cart, {
        product,
        quantity: product.minQuantity,
        total: product.price * product.minQuantity
      }]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        return {
          ...item,
          quantity: newQuantity,
          total: item.product.price * newQuantity
        };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.08; // 8% tax
    const shipping = rushOrder ? 150 : 50;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const placeOrder = async () => {
    if (!customer || cart.length === 0) return;
    
    setPlacing(true);
    try {
      const { subtotal, tax, shipping, total } = calculateTotals();
      
      const orderData = {
        customerId: customer.id,
        customerName: customer.companyName,
        customerEmail: customer.email,
        placedBy: 'admin@shurehw.com',
        placedByName: 'Admin User',
        items: cart.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          price: item.product.price,
          total: item.total
        })),
        shippingAddressId: selectedShipping,
        poNumber,
        rushOrder,
        orderNotes,
        subtotal,
        tax,
        shipping,
        total,
        paymentTerms: customer.paymentTerms,
        createdAt: new Date().toISOString()
      };

      // Send to API
      const response = await fetch('/api/admin/orders/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const { orderId } = await response.json();
        router.push(`/admin/orders/${orderId}?success=true`);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { subtotal, tax, shipping, total } = calculateTotals();
  const availableCredit = customer ? customer.creditLimit - customer.currentBalance : 0;
  const canPlaceOrder = total <= availableCredit;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900 mb-4 inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Place Order for Customer</h1>
          {customer && (
            <div className="mt-2 flex items-center">
              <Building className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-lg text-gray-700">{customer.companyName}</span>
              <span className="mx-2 text-gray-400">•</span>
              <User className="h-5 w-5 text-gray-500 mr-2" />
              <span className="text-gray-600">{customer.contactName}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 gap-4">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="h-16 w-16 bg-gray-200 rounded mr-4"></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                          <p className="text-sm text-gray-600">
                            ${product.price.toFixed(2)} • Min: {product.minQuantity} • Stock: {product.stock}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Items */}
            {cart.length > 0 && (
              <div className="bg-white rounded-lg shadow mt-6">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Cart Items ({cart.length})
                  </h2>
                </div>
                <div className="p-4">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name}</h4>
                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 0)}
                            className="w-16 text-center border-x"
                          />
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="w-24 text-right font-medium">
                          ${item.total.toFixed(2)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow sticky top-6">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Order Summary</h2>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Shipping Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Address
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={selectedShipping}
                    onChange={(e) => setSelectedShipping(e.target.value)}
                  >
                    {customer?.shippingAddresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name} - {addr.address}, {addr.city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PO Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PO Number (Optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="Enter PO number"
                  />
                </div>

                {/* Rush Order */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rushOrder}
                    onChange={(e) => setRushOrder(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Rush Order (+$100 shipping)</span>
                </label>

                {/* Order Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Special instructions..."
                  />
                </div>

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Credit Check */}
                <div className={`p-3 rounded-lg ${canPlaceOrder ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {canPlaceOrder ? (
                      <>
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Credit Available</p>
                          <p className="text-xs text-green-600">
                            ${availableCredit.toFixed(2)} remaining
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-red-800">Insufficient Credit</p>
                          <p className="text-xs text-red-600">
                            ${(total - availableCredit).toFixed(2)} over limit
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="text-sm text-gray-600">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  Payment Terms: {customer?.paymentTerms}
                </div>

                {/* Place Order Button */}
                <button
                  onClick={placeOrder}
                  disabled={!canPlaceOrder || cart.length === 0 || placing}
                  className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {placing ? (
                    'Placing Order...'
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Place Order for Customer
                    </>
                  )}
                </button>

                {/* Admin Note */}
                <div className="text-xs text-gray-500 text-center">
                  Order will be placed on behalf of {customer?.companyName} by Admin User
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}