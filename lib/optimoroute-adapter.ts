// OptimoRoute integration adapter
export type CreateStopInput = {
  orderId: string;
  customer: { 
    name: string; 
    email?: string; 
    phone?: string 
  };
  address: { 
    line1: string; 
    city: string; 
    state?: string; 
    zip?: string; 
    country?: string 
  };
  window?: { 
    earliest?: string; 
    latest?: string 
  };
  notes?: string;
};

const BASE = process.env.OPTIMO_BASE_URL || 'https://api.optimoroute.com/v1';
const KEY = process.env.OPTIMO_KEY || '';
const ACCOUNT = process.env.OPTIMO_ACCOUNT_ID || '';

async function orFetch(path: string, body: any) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'X-Api-Key': KEY, 
      'X-Account-Id': ACCOUNT 
    },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    throw new Error(`OptimoRoute ${res.status}: ${await res.text()}`);
  }
  
  return res.json();
}

export async function pushStopToOptimoRoute(input: CreateStopInput) {
  // Map to OptimoRoute API format
  // Docs: https://optimoroute.com/api-documentation
  return orFetch('/orders/create', {
    externalId: input.orderId,
    customer: {
      name: input.customer.name,
      email: input.customer.email,
      phone: input.customer.phone
    },
    address: {
      address: input.address.line1,
      city: input.address.city,
      state: input.address.state,
      postalCode: input.address.zip,
      country: input.address.country || 'US'
    },
    timeWindow: input.window ? {
      start: input.window.earliest,
      end: input.window.latest
    } : undefined,
    notes: input.notes,
    notificationPreference: 'email'
  });
}

export async function fetchStopStatus(orderId: string) {
  try {
    const response = await orFetch('/orders/status', { 
      externalId: orderId 
    });
    
    // Map OptimoRoute response to our format
    return {
      status: response.status, // 'scheduled', 'dispatched', 'out_for_delivery', 'completed'
      eta: response.estimatedArrival,
      trackingUrl: response.trackingUrl,
      lastLocation: response.lastKnownLocation ? {
        lat: response.lastKnownLocation.latitude,
        lng: response.lastKnownLocation.longitude,
        at: response.lastKnownLocation.timestamp
      } : undefined,
      driver: response.driver,
      vehicle: response.vehicle
    };
  } catch (error) {
    console.error('Error fetching OptimoRoute status:', error);
    return null;
  }
}