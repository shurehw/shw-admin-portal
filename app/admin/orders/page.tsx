'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Package, Clock, CheckCircle, XCircle, Truck, AlertCircle, Search, Filter, Download } from 'lucide-react'

interface Order {
  id: number
  order_number: string
  customer_name: string
  customer_email: string
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30days')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [trackingForm, setTrackingForm] = useState({
    status: '',
    tracking_number: '',
    carrier: '',
    location: '',
    description: '',
    estimated_delivery: '',
    is_customer_visible: true
  })
  
  const [milestoneForm, setMilestoneForm] = useState({
    status: '',
    location: '',
    description: '',
    is_customer_visible: true
  })

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, dateRange])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/orders?status=${statusFilter}&range=${dateRange}`)
      const data = await response.json()
      
      if (data.orders) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      // Mock data for demonstration
      setOrders([
        {
          id: 1001,
          order_number: 'ORD-2024-1001',
          customer_name: 'Marriott Hotels',
          customer_email: 'purchasing@marriott.com',
          date_created: '2024-01-15T10:30:00Z',
          status: 'Pending',
          total: 15750.00,
          items_count: 5,
          payment_status: 'Paid',
          shipping_method: 'Express',
          is_pre_order: true,
          production_status: 'Sampling',
          milestones: [
            {
              id: 'm1',
              timestamp: '2024-01-15T10:30:00Z',
              status: 'Order Received',
              location: 'Processing Center',
              description: 'Order received and confirmed',
              is_customer_visible: true
            },
            {
              id: 'm2',
              timestamp: '2024-01-16T14:20:00Z',
              status: 'Design Review',
              location: 'Design Department',
              description: 'Design specifications under review',
              is_customer_visible: true
            }
          ]
        },
        {
          id: 1002,
          order_number: 'ORD-2024-1002',
          customer_name: 'Hilton Hotels',
          customer_email: 'orders@hilton.com',
          date_created: '2024-01-14T14:20:00Z',
          status: 'Shipped',
          total: 32450.00,
          items_count: 12,
          payment_status: 'Paid',
          shipping_method: 'Standard',
          tracking_number: 'TRACK123456',
          carrier: 'FedEx',
          estimated_delivery: '2024-01-18T17:00:00Z',
          current_location: 'Phoenix, AZ Distribution Center',
          milestones: [
            {
              id: 'm3',
              timestamp: '2024-01-14T14:20:00Z',
              status: 'Order Shipped',
              location: 'Warehouse',
              description: 'Package shipped via FedEx',
              is_customer_visible: true
            },
            {
              id: 'm4',
              timestamp: '2024-01-15T08:30:00Z',
              status: 'In Transit',
              location: 'Phoenix, AZ Distribution Center',
              description: 'Package in transit to destination',
              is_customer_visible: true
            }
          ]
        },
        {
          id: 1003,
          order_number: 'ORD-2024-1003',
          customer_name: 'Local Restaurant Group',
          customer_email: 'info@localrestaurants.com',
          date_created: '2024-01-13T09:15:00Z',
          status: 'Completed',
          total: 8920.00,
          items_count: 3,
          payment_status: 'Paid',
          shipping_method: 'Pickup'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'in production': return 'bg-orange-100 text-orange-800'
      case 'quality check': return 'bg-indigo-100 text-indigo-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'out for delivery': return 'bg-cyan-100 text-cyan-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />
      case 'processing': return <Package className="h-4 w-4" />
      case 'shipped': return <Truck className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'cancelled': return <XCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'pre-order' && order.is_pre_order) ||
      (statusFilter !== 'pre-order' && order.status.toLowerCase() === statusFilter)
    
    return matchesSearch && matchesStatus
  })

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const addMilestone = () => {
    if (!selectedOrder || !milestoneForm.status) return
    
    const newMilestone: Milestone = {
      id: `m${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: milestoneForm.status,
      location: milestoneForm.location,
      description: milestoneForm.description,
      is_customer_visible: milestoneForm.is_customer_visible
    }
    
    const updatedOrder = {
      ...selectedOrder,
      milestones: [...(selectedOrder.milestones || []), newMilestone]
    }
    
    setOrders(orders.map(order => 
      order.id === selectedOrder.id ? updatedOrder : order
    ))
    setSelectedOrder(updatedOrder)
    
    setMilestoneForm({
      status: '',
      location: '',
      description: '',
      is_customer_visible: true
    })
  }

  const updateTracking = () => {
    if (!selectedOrder) return
    
    const updatedOrder = {
      ...selectedOrder,
      tracking_number: trackingForm.tracking_number || selectedOrder.tracking_number,
      carrier: trackingForm.carrier || selectedOrder.carrier,
      current_location: trackingForm.location || selectedOrder.current_location,
      estimated_delivery: trackingForm.estimated_delivery || selectedOrder.estimated_delivery,
      status: trackingForm.status || selectedOrder.status
    }
    
    setOrders(orders.map(order => 
      order.id === selectedOrder.id ? updatedOrder : order
    ))
    setSelectedOrder(updatedOrder)
    
    setTrackingForm({
      status: '',
      tracking_number: '',
      carrier: '',
      location: '',
      description: '',
      estimated_delivery: '',
      is_customer_visible: true
    })
    
    setShowTrackingModal(false)
  }

  const exportOrders = () => {
    const csv = [
      ['Order #', 'Customer', 'Date', 'Status', 'Total', 'Payment', 'Shipping', 'Tracking'],
      ...filteredOrders.map(order => [
        order.order_number,
        order.customer_name,
        new Date(order.date_created).toLocaleDateString(),
        order.status,
        `$${order.total.toFixed(2)}`,
        order.payment_status,
        order.shipping_method,
        order.tracking_number || ''
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-gray-600">Manage and track customer orders</p>
          </div>
          <button
            onClick={exportOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <Package className="text-blue-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pre-Orders</p>
                <p className="text-2xl font-bold text-orange-600">
                  {orders.filter(o => o.is_pre_order).length}
                </p>
              </div>
              <AlertCircle className="text-orange-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Production</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => o.status === 'Pending' || o.status === 'Processing' || o.production_status).length}
                </p>
              </div>
              <Clock className="text-blue-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Shipped</p>
                <p className="text-2xl font-bold text-purple-600">
                  {orders.filter(o => o.status === 'Shipped' || o.status === 'Out for Delivery').length}
                </p>
              </div>
              <Truck className="text-purple-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}
                </p>
              </div>
              <span className="text-green-600 text-2xl">$</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="in production">In Production</option>
              <option value="quality check">Quality Check</option>
              <option value="shipped">Shipped</option>
              <option value="out for delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pre-order">Pre-Orders Only</option>
            </select>
            
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">Loading orders...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">No orders found</td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.order_number}</p>
                        {order.is_pre_order && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700">
                            PRE-ORDER
                          </span>
                        )}
                      </div>
                      {order.tracking_number && (
                        <p className="text-xs text-gray-500">Track: {order.tracking_number}</p>
                      )}
                      {order.is_pre_order && order.production_status && (
                        <p className="text-xs text-orange-600">Production: {order.production_status}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-gray-500">{order.customer_email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(order.date_created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
                        {order.current_location && (
                          <p className="text-xs text-gray-500">📍 {order.current_location}</p>
                        )}
                        {order.carrier && order.tracking_number && (
                          <p className="text-xs text-blue-600">🚚 {order.carrier}</p>
                        )}
                        {order.estimated_delivery && (
                          <p className="text-xs text-purple-600">
                            ETA: {new Date(order.estimated_delivery).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{order.items_count}</td>
                    <td className="px-6 py-4 font-medium">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openOrderDetails(order)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowTrackingModal(true)
                          }}
                          className="text-green-600 hover:text-green-900 text-xs px-2 py-1 border border-green-300 rounded hover:bg-green-50"
                          title="Quick update tracking"
                        >
                          Update
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Order Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Order Info */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Order Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Order Number</label>
                        <p className="text-sm text-gray-900">{selectedOrder.order_number}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusIcon(selectedOrder.status)}
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Order Date</label>
                        <p className="text-sm text-gray-900">{new Date(selectedOrder.date_created).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                        <p className="text-sm font-semibold text-gray-900">${selectedOrder.total.toFixed(2)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Items Count</label>
                        <p className="text-sm text-gray-900">{selectedOrder.items_count} items</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Customer Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                        <p className="text-sm text-gray-900">{selectedOrder.customer_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900">{selectedOrder.customer_email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Status</label>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          selectedOrder.payment_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedOrder.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Pre-Order Status */}
                {selectedOrder.is_pre_order && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Pre-Order Status</h3>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <span className="font-medium text-orange-800">Pre-Order Item</span>
                      </div>
                      <p className="text-sm text-orange-700 mb-2">
                        This item is in production and not yet available for customer ordering.
                      </p>
                      {selectedOrder.production_status && (
                        <div>
                          <span className="text-sm font-medium text-orange-700">Production Status: </span>
                          <span className="text-sm text-orange-900">{selectedOrder.production_status}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping & Tracking */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Shipping & Tracking</h3>
                    <button
                      onClick={() => setShowTrackingModal(true)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Update Tracking
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Method</label>
                      <p className="text-sm text-gray-900">{selectedOrder.shipping_method}</p>
                    </div>
                    {selectedOrder.tracking_number && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                        <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{selectedOrder.tracking_number}</p>
                      </div>
                    )}
                    {selectedOrder.carrier && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                        <p className="text-sm text-gray-900">{selectedOrder.carrier}</p>
                      </div>
                    )}
                    {selectedOrder.current_location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                        <p className="text-sm text-gray-900">{selectedOrder.current_location}</p>
                      </div>
                    )}
                    {selectedOrder.estimated_delivery && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedOrder.estimated_delivery).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Milestones */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Tracking Milestones</h3>
                  </div>
                  
                  {selectedOrder.milestones && selectedOrder.milestones.length > 0 ? (
                    <div className="space-y-4">
                      {selectedOrder.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5"></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900">{milestone.status}</h4>
                                <p className="text-sm text-gray-600">{milestone.location}</p>
                                {milestone.description && (
                                  <p className="text-sm text-gray-700 mt-1">{milestone.description}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {new Date(milestone.timestamp).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(milestone.timestamp).toLocaleTimeString()}
                                </p>
                                {milestone.is_customer_visible && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                    Visible to Customer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No tracking milestones yet.</p>
                  )}
                  
                  {/* Add Milestone Form */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Add New Milestone</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Status (e.g., 'In Production', 'Quality Check')"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        value={milestoneForm.status}
                        onChange={(e) => setMilestoneForm({...milestoneForm, status: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        value={milestoneForm.location}
                        onChange={(e) => setMilestoneForm({...milestoneForm, location: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="Description"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm md:col-span-2"
                        value={milestoneForm.description}
                        onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})}
                      />
                      <div className="flex items-center gap-2 md:col-span-2">
                        <input
                          type="checkbox"
                          id="customer-visible"
                          checked={milestoneForm.is_customer_visible}
                          onChange={(e) => setMilestoneForm({...milestoneForm, is_customer_visible: e.target.checked})}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="customer-visible" className="text-sm text-gray-700">
                          Visible to customer in portal
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={addMilestone}
                      disabled={!milestoneForm.status}
                      className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Add Milestone
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Update Modal */}
        {showTrackingModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl mx-4">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Update Tracking Information</h2>
                  <button
                    onClick={() => setShowTrackingModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      value={trackingForm.status}
                      onChange={(e) => setTrackingForm({...trackingForm, status: e.target.value})}
                    >
                      <option value="">Keep current status</option>
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="In Production">In Production</option>
                      <option value="Quality Check">Quality Check</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Out for Delivery">Out for Delivery</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      value={trackingForm.carrier}
                      onChange={(e) => setTrackingForm({...trackingForm, carrier: e.target.value})}
                    >
                      <option value="">Select carrier</option>
                      <option value="FedEx">FedEx</option>
                      <option value="UPS">UPS</option>
                      <option value="USPS">USPS</option>
                      <option value="DHL">DHL</option>
                      <option value="Local Delivery">Local Delivery</option>
                      <option value="Pickup">Customer Pickup</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      value={trackingForm.tracking_number}
                      onChange={(e) => setTrackingForm({...trackingForm, tracking_number: e.target.value})}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      value={trackingForm.location}
                      onChange={(e) => setTrackingForm({...trackingForm, location: e.target.value})}
                      placeholder="Current package location"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                    <input
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded"
                      value={trackingForm.estimated_delivery}
                      onChange={(e) => setTrackingForm({...trackingForm, estimated_delivery: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setShowTrackingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={updateTracking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Tracking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}