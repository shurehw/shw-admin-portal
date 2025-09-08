'use client';

import { useState, useEffect } from 'react';
import type { CustomOrder } from '@/types/orders';
import { statusColors, statusIcons, prettyStatus } from '@/utils/status';
import { Package, RefreshCw } from 'lucide-react';

export default function OrderStatus() {
  const [orders, setOrders] = useState<CustomOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: '',
    trackingNumber: '',
    carrier: '',
    milestone: '',
    notes: '',
    eta: '',
    driverName: '',
    driverPhone: '',
    vehicleId: ''
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      // Update tracking if provided
      if (updateForm.trackingNumber && updateForm.carrier) {
        await fetch('/api/admin/milestone', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin123'}`
          },
          body: JSON.stringify({
            orderId: selectedOrder.orderId,
            stage: 'Shipped',
            note: `${updateForm.carrier}: ${updateForm.trackingNumber}`,
            eta: updateForm.eta
          })
        });
      }

      // Update milestone if provided
      if (updateForm.milestone) {
        await fetch('/api/admin/milestone', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin123'}`
          },
          body: JSON.stringify({
            orderId: selectedOrder.orderId,
            stage: updateForm.milestone,
            note: updateForm.notes,
            eta: updateForm.eta
          })
        });
      }

      alert('Order updated successfully!');
      loadOrders();
      setSelectedOrder(null);
      setUpdateForm({
        status: '',
        trackingNumber: '',
        carrier: '',
        milestone: '',
        notes: '',
        eta: '',
        driverName: '',
        driverPhone: '',
        vehicleId: ''
      });
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error updating order');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Package className="h-6 w-6 mr-2" />
            Order Status Management
          </h2>
          <p className="text-gray-600 mt-1">Track and update customer orders</p>
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Orders</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No orders found</div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer ${
                      selectedOrder?.id === order.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{order.productName}</h4>
                        <p className="text-sm text-gray-500">Order #{order.orderId}</p>
                        <p className="text-sm text-gray-500">
                          {order.quantity} units • {order.sku}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                        {statusIcons[order.status]} {prettyStatus(order.status)}
                      </span>
                    </div>
                    {order.shipment?.trackingNumber && (
                      <div className="mt-2 text-sm text-gray-600">
                        📦 {order.shipment.carrier}: {order.shipment.trackingNumber}
                      </div>
                    )}
                    {order.localDelivery?.driverName && (
                      <div className="mt-2 text-sm text-gray-600">
                        🚚 Driver: {order.localDelivery.driverName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Update Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Update Order</h3>
            </div>
            {selectedOrder ? (
              <form onSubmit={handleUpdateOrder} className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected: {selectedOrder.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Order #{selectedOrder.orderId}
                  </p>
                </div>

                {/* Status Update */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Status
                  </label>
                  <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-gray-500 focus:border-gray-500 p-2 border"
                    value={updateForm.status}
                    onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
                  >
                    <option value="">-- Select Status --</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="sampling">Sampling</option>
                    <option value="in_production">In Production</option>
                    <option value="finishing">Finishing</option>
                    <option value="quality_check">Quality Check</option>
                    <option value="shipping">Shipping</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                {/* Tracking Information */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Shipping Info</h4>
                  <input
                    type="text"
                    placeholder="Tracking Number"
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    value={updateForm.trackingNumber}
                    onChange={(e) => setUpdateForm({...updateForm, trackingNumber: e.target.value})}
                  />
                  <select
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    value={updateForm.carrier}
                    onChange={(e) => setUpdateForm({...updateForm, carrier: e.target.value})}
                  >
                    <option value="">-- Select Carrier --</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="USPS">USPS</option>
                    <option value="DHL">DHL</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Milestone Update */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Add Milestone</h4>
                  <input
                    type="text"
                    placeholder="Milestone (e.g., 'Sampling Complete')"
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    value={updateForm.milestone}
                    onChange={(e) => setUpdateForm({...updateForm, milestone: e.target.value})}
                  />
                  <textarea
                    placeholder="Notes"
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    rows={3}
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                  />
                  <input
                    type="datetime-local"
                    placeholder="ETA"
                    className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                    value={updateForm.eta}
                    onChange={(e) => setUpdateForm({...updateForm, eta: e.target.value})}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800"
                >
                  Update Order
                </button>
              </form>
            ) : (
              <div className="p-6 text-center text-gray-500">
                Select an order to update
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">In Production</p>
          <p className="text-2xl font-bold text-orange-600">
            {orders.filter(o => o.status === 'in_production').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Shipping</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.status === 'shipping').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600">Delivered</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'delivered').length}
          </p>
        </div>
      </div>
    </div>
  );
}