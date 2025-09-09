'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { 
  User, Package, FileText, DollarSign, Download, Calendar, 
  TrendingUp, CreditCard, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronRight, Printer, Mail, Truck, MapPin, Eye, Tag, ShoppingCart
} from 'lucide-react'
import CustomerPricing, { BulkCustomerPricing } from '@/components/CustomerPricing'

interface Customer {
  id: number
  email: string
  first_name: string
  last_name: string
  company: string
  phone: string
  customer_group_id: number
  date_created: string
  notes: string
}

interface Order {
  id: number
  order_number: string
  date_created: string
  status: string
  total: number
  items_count: number
  payment_status: string
  shipping_method: string
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  current_location?: string
  delivery_notes?: string
  milestones?: Milestone[]
  is_pre_order?: boolean
  production_status?: string
}

interface Milestone {
  id: string
  timestamp: string
  status: string
  location: string
  description: string
  is_customer_visible: boolean
}

interface Invoice {
  id: string
  invoice_number: string
  order_id: number
  date: string
  due_date: string
  amount: number
  paid_amount: number
  status: 'paid' | 'partial' | 'unpaid' | 'overdue'
  pdf_url?: string
}

interface Statement {
  period: string
  opening_balance: number
  charges: number
  payments: number
  closing_balance: number
  transactions: Transaction[]
}

interface Transaction {
  date: string
  type: 'invoice' | 'payment' | 'credit' | 'debit'
  reference: string
  description: string
  amount: number
  balance: number
}

interface CreditInfo {
  credit_limit: number
  available_credit: number
  used_credit: number
  payment_terms: string
  days_overdue: number
  oldest_invoice_date?: string
}

interface Product {
  id: number
  name: string
  sku: string
  description: string
  category: string
  retail_price: number
  image_url?: string
  in_stock: boolean
}

export default function CustomerPortalPage() {
  const params = useParams()
  const customerId = params.id as string
  
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null)
  const [statement, setStatement] = useState<Statement | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const [cart, setCart] = useState<{product_id: number, quantity: number}[]>([])

  useEffect(() => {
    fetchCustomerData()
  }, [customerId])

  useEffect(() => {
    if (activeTab === 'statements') {
      generateStatement()
    }
  }, [activeTab, selectedPeriod])

  const fetchCustomerData = async () => {
    try {
      setLoading(true)
      
      // Fetch customer details
      const customerRes = await fetch(`/api/customers/${customerId}`)
      const customerData = await customerRes.json()
      setCustomer(customerData)
      
      // Fetch orders
      const ordersRes = await fetch(`/api/orders?customer_id=${customerId}`)
      const ordersData = await ordersRes.json()
      setOrders(ordersData.data || [])
      
      // Fetch invoices
      const invoicesRes = await fetch(`/api/b2b/invoices?customer_id=${customerId}`)
      const invoicesData = await invoicesRes.json()
      setInvoices(invoicesData.data || [])
      
      // Fetch credit info
      const creditRes = await fetch(`/api/b2b/credit?customer_id=${customerId}`)
      const creditData = await creditRes.json()
      setCreditInfo(creditData)
      
      // Load products for pricing tab
      const mockProducts: Product[] = [
        {
          id: 1,
          name: 'Commercial Paper Towels - 12 Pack',
          sku: 'CPT-12',
          description: 'High-quality commercial paper towels, perfect for restaurants and hotels',
          category: 'Paper Products',
          retail_price: 45.99,
          image_url: '/api/placeholder/300/200',
          in_stock: true
        },
        {
          id: 2,
          name: 'Heavy Duty Trash Bags - 100ct',
          sku: 'HDTB-100',
          description: 'Extra strong trash bags for commercial use',
          category: 'Cleaning Supplies',
          retail_price: 72.99,
          image_url: '/api/placeholder/300/200',
          in_stock: true
        },
        {
          id: 3,
          name: 'Industrial Hand Soap - 5L',
          sku: 'IHS-5L',
          description: 'Professional grade hand soap for high-volume use',
          category: 'Cleaning Supplies',
          retail_price: 28.50,
          image_url: '/api/placeholder/300/200',
          in_stock: true
        },
        {
          id: 4,
          name: 'Disposable Gloves - 500ct',
          sku: 'DG-500',
          description: 'Food-safe disposable gloves',
          category: 'Safety Equipment',
          retail_price: 35.75,
          image_url: '/api/placeholder/300/200',
          in_stock: false
        }
      ]
      setProducts(mockProducts)
      
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateStatement = async () => {
    try {
      const response = await fetch(`/api/b2b/statements?customer_id=${customerId}&period=${selectedPeriod}`)
      const data = await response.json()
      setStatement(data)
    } catch (error) {
      console.error('Error generating statement:', error)
    }
  }

  const downloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/b2b/invoices/${invoiceId}/pdf`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      a.click()
    } catch (error) {
      console.error('Error downloading invoice:', error)
      alert('Failed to download invoice')
    }
  }

  const downloadStatement = async () => {
    try {
      const response = await fetch(`/api/b2b/statements/download?customer_id=${customerId}&period=${selectedPeriod}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statement-${selectedPeriod}.pdf`
      a.click()
    } catch (error) {
      console.error('Error downloading statement:', error)
    }
  }

  const emailStatement = async () => {
    try {
      await fetch(`/api/b2b/statements/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          period: selectedPeriod,
          email: customer?.email
        })
      })
      alert('Statement sent successfully!')
    } catch (error) {
      console.error('Error emailing statement:', error)
    }
  }

  const toggleOrderExpand = (orderId: number) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'shipped':
        return 'text-green-600 bg-green-100'
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-100'
      case 'overdue':
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getCreditUtilization = () => {
    if (!creditInfo) return 0
    return (creditInfo.used_credit / creditInfo.credit_limit) * 100
  }

  if (loading) {
    return <div className="p-6">Loading customer portal...</div>
  }

  if (!customer) {
    return <div className="p-6">Customer not found</div>
  }

  return (
    <div className="p-6">
      {/* Customer Header */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {customer.first_name} {customer.last_name}
              </h1>
              <p className="text-gray-600">{customer.company}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-500">
                <span>{customer.email}</span>
                <span>{customer.phone}</span>
                <span>Customer since {new Date(customer.date_created).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Customer ID</p>
            <p className="font-semibold">#{customer.id}</p>
          </div>
        </div>
      </div>

      {/* Credit Overview */}
      {creditInfo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Credit Limit</span>
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold">${creditInfo.credit_limit.toLocaleString()}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Available Credit</span>
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              ${creditInfo.available_credit.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Outstanding</span>
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              ${creditInfo.used_credit.toLocaleString()}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Payment Terms</span>
              <Clock size={20} className="text-gray-600" />
            </div>
            <p className="text-lg font-semibold">{creditInfo.payment_terms}</p>
            {creditInfo.days_overdue > 0 && (
              <p className="text-sm text-red-600">{creditInfo.days_overdue} days overdue</p>
            )}
          </div>
        </div>
      )}

      {/* Credit Utilization Bar */}
      {creditInfo && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Credit Utilization</span>
            <span className="text-sm text-gray-600">{getCreditUtilization().toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full ${
                getCreditUtilization() > 90 ? 'bg-red-600' :
                getCreditUtilization() > 70 ? 'bg-yellow-600' :
                'bg-green-600'
              }`}
              style={{ width: `${Math.min(getCreditUtilization(), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b">
          <nav className="flex">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'pricing', label: 'Your Pricing' },
              { key: 'orders', label: 'Orders' },
              { key: 'invoices', label: 'Invoices' },
              { key: 'statements', label: 'Statements' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-3 font-medium text-sm border-b-2 flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.key === 'pricing' && <Tag className="h-4 w-4" />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <Package className="mr-2" size={20} />
                  Recent Orders
                </h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="border rounded p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Order #{order.order_number}</p>
                            {order.is_pre_order && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                                PRE-ORDER
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.date_created).toLocaleDateString()}
                          </p>
                          {order.current_location && (
                            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {order.current_location}
                            </p>
                          )}
                          {order.carrier && order.tracking_number && (
                            <p className="text-xs text-green-600 mt-1">
                              {order.carrier}: {order.tracking_number}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          {order.estimated_delivery && (
                            <p className="text-xs text-purple-600 mt-1">
                              ETA: {new Date(order.estimated_delivery).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 flex items-center">
                  <FileText className="mr-2" size={20} />
                  Recent Invoices
                </h3>
                <div className="space-y-3">
                  {invoices.slice(0, 5).map(invoice => (
                    <div key={invoice.id} className="border rounded p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${invoice.amount.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Your Custom Pricing
                  </h3>
                  <p className="text-gray-600 mt-1">Special pricing available for your company</p>
                </div>
                {cart.length > 0 && (
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-sm">Cart ({cart.length})</span>
                  </div>
                )}
              </div>

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="mb-6">
                  <BulkCustomerPricing
                    customerId={parseInt(customerId)}
                    products={cart}
                    className="mb-4"
                  />
                </div>
              )}

              {/* Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Product Image */}
                    <div className="h-48 bg-gray-200 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400" />
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                        {!product.in_stock && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-2">{product.sku}</p>
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>

                      {/* Custom Pricing Component */}
                      <CustomerPricing
                        customerId={parseInt(customerId)}
                        productId={product.id}
                        size="sm"
                        className="mb-3"
                      />

                      {/* Add to Cart */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          defaultValue="1"
                          className="w-16 px-2 py-1 border rounded text-sm"
                          id={`qty-${product.id}`}
                          disabled={!product.in_stock}
                        />
                        <button
                          onClick={() => {
                            const qtyInput = document.getElementById(`qty-${product.id}`) as HTMLInputElement
                            const quantity = parseInt(qtyInput.value) || 1
                            
                            setCart(prevCart => {
                              const existingItem = prevCart.find(item => item.product_id === product.id)
                              if (existingItem) {
                                return prevCart.map(item => 
                                  item.product_id === product.id 
                                    ? { ...item, quantity: item.quantity + quantity }
                                    : item
                                )
                              }
                              return [...prevCart, { product_id: product.id, quantity }]
                            })
                          }}
                          disabled={!product.in_stock}
                          className={`flex-1 px-3 py-1 text-sm rounded transition-colors ${
                            product.in_stock
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {products.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products available</h3>
                  <p className="text-gray-600">Check back later for new products and pricing.</p>
                </div>
              )}

              {/* Pricing Benefits */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Your B2B Benefits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">15%</div>
                    <div className="text-sm text-blue-700">Average Savings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">Net 30</div>
                    <div className="text-sm text-blue-700">Payment Terms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">24/7</div>
                    <div className="text-sm text-blue-700">Online Ordering</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Order History</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Export Orders
                </button>
              </div>
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="border rounded">
                    <div 
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleOrderExpand(order.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          {expandedOrders.has(order.id) ? 
                            <ChevronDown size={20} className="mr-2" /> : 
                            <ChevronRight size={20} className="mr-2" />
                          }
                          <div>
                            <p className="font-medium">Order #{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.date_created).toLocaleDateString()} • {order.items_count} items
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {expandedOrders.has(order.id) && (
                      <div className="border-t p-4 bg-gray-50">
                        {/* Pre-Order Status */}
                        {order.is_pre_order && (
                          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-800">Pre-Order Item</span>
                            </div>
                            <p className="text-sm text-orange-700 mb-1">
                              This item is in production and not yet available for regular ordering.
                            </p>
                            {order.production_status && (
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-medium text-orange-700">Production Status:</span>
                                <span className="text-sm text-orange-900">{order.production_status}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600">Payment Status</p>
                            <p className="font-medium">{order.payment_status}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Shipping Method</p>
                            <p className="font-medium">{order.shipping_method}</p>
                          </div>
                          {order.tracking_number && (
                            <div>
                              <p className="text-gray-600">Tracking Number</p>
                              <p className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{order.tracking_number}</p>
                            </div>
                          )}
                          {order.carrier && (
                            <div>
                              <p className="text-gray-600">Carrier</p>
                              <p className="font-medium">{order.carrier}</p>
                            </div>
                          )}
                          {order.current_location && (
                            <div className="col-span-2">
                              <p className="text-gray-600 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                Current Location
                              </p>
                              <p className="font-medium">{order.current_location}</p>
                            </div>
                          )}
                          {order.estimated_delivery && (
                            <div className="col-span-2">
                              <p className="text-gray-600">Estimated Delivery</p>
                              <p className="font-medium">{new Date(order.estimated_delivery).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>

                        {/* Tracking Timeline */}
                        {order.milestones && order.milestones.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Order Progress
                            </h5>
                            <div className="space-y-3">
                              {order.milestones
                                .filter(milestone => milestone.is_customer_visible)
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .map((milestone, index) => (
                                  <div key={milestone.id} className="flex gap-3 p-2 bg-white rounded border-l-2 border-blue-200">
                                    <div className="flex-shrink-0 mt-1">
                                      <div className={`w-2 h-2 rounded-full ${
                                        index === 0 ? 'bg-blue-600' : 'bg-gray-400'
                                      }`}></div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-sm text-gray-900">{milestone.status}</p>
                                          <p className="text-xs text-gray-600">{milestone.location}</p>
                                          {milestone.description && (
                                            <p className="text-xs text-gray-700 mt-1">{milestone.description}</p>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs text-gray-500">
                                            {new Date(milestone.timestamp).toLocaleDateString()}
                                          </p>
                                          <p className="text-xs text-gray-400">
                                            {new Date(milestone.timestamp).toLocaleTimeString([], {
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          <button className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            View Details
                          </button>
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Reorder
                          </button>
                          {order.tracking_number && (
                            <button className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1">
                              <Truck className="h-4 w-4" />
                              Track Package
                            </button>
                          )}
                          {order.is_pre_order && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              Pre-Order
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Invoices</h3>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border rounded">
                    <option>All Invoices</option>
                    <option>Unpaid</option>
                    <option>Paid</option>
                    <option>Overdue</option>
                  </select>
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{invoice.invoice_number}</td>
                      <td className="px-4 py-3">{new Date(invoice.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{new Date(invoice.due_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">${invoice.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">${invoice.paid_amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => downloadInvoice(invoice.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Download PDF"
                          >
                            <Download size={18} />
                          </button>
                          <button 
                            className="text-gray-600 hover:text-gray-800"
                            title="Print"
                          >
                            <Printer size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Statements Tab */}
          {activeTab === 'statements' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Account Statements</h3>
                <div className="flex gap-2">
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-3 py-2 border rounded"
                  >
                    <option value="current_month">Current Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="last_quarter">Last Quarter</option>
                    <option value="last_year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  <button 
                    onClick={downloadStatement}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Download size={18} />
                    Download PDF
                  </button>
                  <button 
                    onClick={emailStatement}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
                  >
                    <Mail size={18} />
                    Email Statement
                  </button>
                </div>
              </div>
              
              {statement && (
                <div>
                  <div className="bg-gray-50 rounded p-4 mb-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Opening Balance</p>
                        <p className="font-semibold">${statement.opening_balance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Charges</p>
                        <p className="font-semibold">${statement.charges.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Payments</p>
                        <p className="font-semibold">${statement.payments.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Closing Balance</p>
                        <p className="font-semibold text-lg">
                          ${statement.closing_balance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {statement.transactions.map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              transaction.type === 'payment' ? 'bg-green-100 text-green-800' :
                              transaction.type === 'credit' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{transaction.reference}</td>
                          <td className="px-4 py-3 text-sm">{transaction.description}</td>
                          <td className={`px-4 py-3 text-sm text-right ${
                            transaction.type === 'payment' || transaction.type === 'credit' 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'payment' || transaction.type === 'credit' ? '-' : ''}
                            ${Math.abs(transaction.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            ${transaction.balance.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}