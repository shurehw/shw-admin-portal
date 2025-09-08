import StatusBadge from '@/components/StatusBadge';
import ProgressBar from '@/components/ProgressBar';
import UnifiedTimeline from '@/components/UnifiedTimeline';
import type { CustomOrder } from '@/types/orders';
import { useState } from 'react';

const fDate = (iso?: string) => {
  if (!iso) return 'TBD';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function OrderCard({ order }: { order: CustomOrder }) {
  const [showTimeline, setShowTimeline] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{order.productName}</h3>
            <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500">
              <span>Order #{order.orderId}</span>
              {order.sku && <span>SKU: {order.sku}</span>}
              <span>Qty: {order.quantity}</span>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <ProgressBar status={order.status} />

        {order.currentStage && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-blue-900">Current Status</p>
            <p className="text-sm text-blue-700">{order.currentStage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <KV label="Order Date" value={fDate(order.orderDate)} />
          <KV 
            label="Estimated Delivery" 
            value={order.estimatedDelivery 
              ? fDate(order.estimatedDelivery) 
              : order.estimatedCompletion 
                ? `${order.estimatedCompletion} days` 
                : 'TBD'
            } 
          />
          <KV 
            label="Artwork Status" 
            value={order.artworkStatus 
              ? order.artworkStatus === 'approved' 
                ? '✓ Approved' 
                : order.artworkStatus === 'revisions'
                  ? '⚠️ Revisions'
                  : '⏳ Pending'
              : 'N/A'
            } 
          />
        </div>

        {order.customDetails && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Custom Specifications</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(order.customDetails).map(([k, v]) => (
                <div key={k}>
                  <span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}:</span>
                  <span className="ml-2 text-gray-900 font-medium">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800 uppercase tracking-wide mb-1">Special Instructions</p>
            <p className="text-sm text-yellow-900">{order.specialInstructions}</p>
          </div>
        )}

        {/* Shipping (3rd-party) */}
        {order.transportMode === 'third_party' && order.shipment?.trackingNumber && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-green-800 uppercase tracking-wide mb-1">Tracking</p>
            <p className="text-sm text-green-900 font-medium">
              {order.shipment.carrier || 'Carrier'}: {order.shipment.trackingNumber}
            </p>
            {order.shipment.trackingUrl && (
              <a 
                href={order.shipment.trackingUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-block mt-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Track Package →
              </a>
            )}
          </div>
        )}

        {/* Local delivery (OptimoRoute) */}
        {order.transportMode === 'in_house' && order.localDelivery && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-emerald-800 uppercase tracking-wide mb-2">Local Delivery</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <KV label="Driver" value={order.localDelivery.driverName || 'Assigned'} />
              <KV label="Vehicle" value={order.localDelivery.vehicleId || 'Assigned'} />
              <KV label="ETA" value={fDate(order.localDelivery.eta)} />
            </div>
            {order.localDelivery.driverPhone && (
              <p className="text-sm text-emerald-700 mt-2">
                Driver contact: <a href={`tel:${order.localDelivery.driverPhone}`} className="underline">
                  {order.localDelivery.driverPhone}
                </a>
              </p>
            )}
            {order.localDelivery.mapLink && (
              <a 
                href={order.localDelivery.mapLink} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-block mt-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                Track Live ETA →
              </a>
            )}
            {order.localDelivery.pod && (
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <p className="text-xs text-emerald-800 uppercase tracking-wide mb-1">Proof of Delivery</p>
                <p className="text-sm text-emerald-900">
                  Signed by: {order.localDelivery.pod.name} at {fDate(order.localDelivery.pod.at)}
                </p>
                {order.localDelivery.pod.notes && (
                  <p className="text-sm text-emerald-700 mt-1">Notes: {order.localDelivery.pod.notes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Pickup Instructions */}
        {order.transportMode === 'pickup' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-orange-800 uppercase tracking-wide mb-1">Pickup Information</p>
            <p className="text-sm text-orange-900">
              Ready for pickup at warehouse
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Address: 123 Industrial Blvd, Los Angeles, CA 90001
            </p>
            <p className="text-sm text-orange-700">
              Hours: Mon-Fri 8AM-5PM, Sat 9AM-2PM
            </p>
          </div>
        )}

        {/* Last Update */}
        {order.lastUpdate && (
          <div className="text-sm text-gray-600 italic mb-4">
            <span className="font-medium">Latest Update:</span> {order.lastUpdate}
          </div>
        )}

        {/* Unified Timeline Toggle */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center justify-between w-full text-left"
          >
            <h4 className="text-sm font-semibold text-gray-900">Complete Timeline</h4>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform ${showTimeline ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showTimeline && (
            <div className="mt-4">
              <UnifiedTimeline orderId={order.orderId} />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
          {order.status === 'delivered' && (
            <button className="text-gray-700 hover:text-gray-900 text-sm font-medium">
              Reorder →
            </button>
          )}
          {order.transportMode === 'in_house' && order.localDelivery?.driverPhone && (
            <a 
              href={`tel:${order.localDelivery.driverPhone}`}
              className="text-gray-700 hover:text-gray-900 text-sm font-medium"
            >
              Call Driver →
            </a>
          )}
          <button className="text-gray-700 hover:text-gray-900 text-sm font-medium">
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value ?? '—'}</p>
    </div>
  );
}