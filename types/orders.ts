export type TransportMode = 'third_party' | 'in_house' | 'pickup';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'sampling'
  | 'in_production'
  | 'finishing'
  | 'quality_check'
  | 'shipping'
  | 'at_port'
  | 'dispatch_scheduled'
  | 'out_for_delivery'
  | 'delivered'
  | 'canceled';

export type EventSource = 'INTERNAL' | 'AFTERSHIP' | 'EASYPOST' | 'OPTIMO';
export type EventKind = 'production' | 'shipping' | 'local_delivery' | 'pod' | 'status';

export interface TimelineEvent {
  id: string;
  orderId: string;
  ts: string;             // ISO
  kind: EventKind;
  source: EventSource;
  label: string;          // e.g., "Sampling complete" / "Departed origin"
  note?: string;
  status?: OrderStatus;   // when this event changes status
  eta?: string;           // ISO ETA (if applicable)
  link?: string;          // tracking link / live ETA
  meta?: Record<string, any>;
}

export interface ShipmentEvent {
  ts: string; 
  code: string; 
  description?: string; 
  location?: string;
}

export interface Shipment {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  events?: ShipmentEvent[];
}

export interface LocalDelivery {
  driverName?: string;
  driverPhone?: string;
  vehicleId?: string;
  eta?: string;
  lastLocation?: { lat: number; lng: number; at: string };
  mapLink?: string;       // OptimoRoute live ETA link
  pod?: {
    name?: string;
    signatureUrl?: string;
    photoUrls?: string[];
    notes?: string;
    at?: string;
  };
}

export interface CustomOrder {
  id: string;
  orderId: string;
  customerId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  customDetails?: Record<string, any>;
  specialInstructions?: string;

  status: OrderStatus;
  currentStage?: string;
  estimatedCompletion?: number;
  orderDate: string;
  estimatedDelivery?: string;
  artworkStatus?: 'pending' | 'approved' | 'revisions';
  lastUpdate?: string;

  transportMode?: TransportMode;
  shipment?: Shipment;          // third-party
  localDelivery?: LocalDelivery; // in-house (Optimo)

  statusHistory?: Array<{ createdAt: string; newStatus: OrderStatus; notes?: string }>;
}