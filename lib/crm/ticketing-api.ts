/**
 * CRM Ticketing API Client
 * Consumes the main portal Ticketing API with caching for performance
 */

interface TicketSummary {
  open: number;
  breaching: number;
  waiting_customer: number;
  total: number;
}

interface TicketPreview {
  id: string;
  subject: string;
  status: string;
  priority: string;
  type: string;
  ownerId?: string;
  ownerName?: string;
  slaDue?: string;
  createdAt: string;
  updatedAt: string;
  company?: {
    id: string;
    companyName: string;
  };
}

interface TicketSearchResult {
  tickets: TicketPreview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// In-memory cache with TTL
class TicketCache {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly TTL = 60 * 1000; // 60 seconds

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + this.TTL
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new TicketCache();

export class CRMTicketingAPI {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(token?: string) {
    this.baseUrl = process.env.NEXT_PUBLIC_PORTAL_API_URL || '';
    this.headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  /**
   * Get JWT token from current session (implement based on your auth system)
   */
  private getAuthToken(): string | null {
    // This should integrate with your existing auth system
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || null;
    }
    return null;
  }

  /**
   * Make authenticated API request with error handling
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    
    if (response.status === 401) {
      throw new Error('Authentication expired');
    }
    
    if (response.status === 403) {
      throw new Error('Insufficient permissions');
    }
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if user has ticketing permissions
   */
  async hasTicketingAccess(): Promise<boolean> {
    try {
      await this.request('/api/tickets?limit=1');
      return true;
    } catch (error: any) {
      if (error.message.includes('permissions')) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get ticket summary for a company
   */
  async getCompanyTicketSummary(companyId: string): Promise<TicketSummary> {
    const cacheKey = `summary:company:${companyId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.request<{
        tickets: TicketPreview[];
        total: number;
      }>(`/api/tickets?companyId=${companyId}&limit=100`);

      const summary: TicketSummary = {
        open: result.tickets.filter(t => 
          ['new', 'ack', 'in_progress'].includes(t.status)
        ).length,
        breaching: result.tickets.filter(t => 
          t.slaDue && new Date(t.slaDue) < new Date()
        ).length,
        waiting_customer: result.tickets.filter(t => 
          t.status === 'waiting_customer'
        ).length,
        total: result.total
      };

      cache.set(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('Failed to get company ticket summary:', error);
      return { open: 0, breaching: 0, waiting_customer: 0, total: 0 };
    }
  }

  /**
   * Get ticket summary for a contact
   */
  async getContactTicketSummary(contactId: string): Promise<TicketSummary> {
    const cacheKey = `summary:contact:${contactId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.request<{
        tickets: TicketPreview[];
        total: number;
      }>(`/api/tickets?contactId=${contactId}&limit=100`);

      const summary: TicketSummary = {
        open: result.tickets.filter(t => 
          ['new', 'ack', 'in_progress'].includes(t.status)
        ).length,
        breaching: result.tickets.filter(t => 
          t.slaDue && new Date(t.slaDue) < new Date()
        ).length,
        waiting_customer: result.tickets.filter(t => 
          t.status === 'waiting_customer'
        ).length,
        total: result.total
      };

      cache.set(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('Failed to get contact ticket summary:', error);
      return { open: 0, breaching: 0, waiting_customer: 0, total: 0 };
    }
  }

  /**
   * Get recent tickets for a company
   */
  async getCompanyTickets(companyId: string, limit: number = 5): Promise<TicketPreview[]> {
    const cacheKey = `tickets:company:${companyId}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.request<{
        tickets: TicketPreview[];
      }>(`/api/tickets?companyId=${companyId}&limit=${limit}&sort=-updated_at`);

      cache.set(cacheKey, result.tickets);
      return result.tickets;
    } catch (error) {
      console.error('Failed to get company tickets:', error);
      return [];
    }
  }

  /**
   * Get recent tickets for a contact
   */
  async getContactTickets(contactId: string, limit: number = 5): Promise<TicketPreview[]> {
    const cacheKey = `tickets:contact:${contactId}:${limit}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.request<{
        tickets: TicketPreview[];
      }>(`/api/tickets?contactId=${contactId}&limit=${limit}&sort=-updated_at`);

      cache.set(cacheKey, result.tickets);
      return result.tickets;
    } catch (error) {
      console.error('Failed to get contact tickets:', error);
      return [];
    }
  }

  /**
   * Search tickets with filters (for TicketsTab)
   */
  async searchTickets(params: {
    companyId?: string;
    contactId?: string;
    status?: string[];
    priority?: string[];
    type?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<TicketSearchResult> {
    const searchParams = new URLSearchParams();
    
    if (params.companyId) searchParams.append('companyId', params.companyId);
    if (params.contactId) searchParams.append('contactId', params.contactId);
    if (params.status) params.status.forEach(s => searchParams.append('status', s));
    if (params.priority) params.priority.forEach(p => searchParams.append('priority', p));
    if (params.type) params.type.forEach(t => searchParams.append('type', t));
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sortBy) searchParams.append('orderBy', params.sortBy);
    if (params.sortOrder) searchParams.append('orderDir', params.sortOrder);

    const cacheKey = `search:${searchParams.toString()}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.request<TicketSearchResult>(`/api/tickets?${searchParams.toString()}`);
      
      // Only cache first page to avoid stale data on pagination
      if (!params.page || params.page === 1) {
        cache.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to search tickets:', error);
      return {
        tickets: [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 25,
          total: 0,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Generate deep links to the portal ticketing system
   */
  generateTicketLink(ticketId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    return `${baseUrl}/admin/tickets?id=${ticketId}`;
  }

  generateNewTicketLink(params: {
    companyId?: string;
    contactId?: string;
    orderId?: string;
    source?: string;
  }): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const searchParams = new URLSearchParams();
    
    if (params.companyId) searchParams.append('companyId', params.companyId);
    if (params.contactId) searchParams.append('contactId', params.contactId);
    if (params.orderId) searchParams.append('orderId', params.orderId);
    if (params.source) searchParams.append('source', params.source);
    
    return `${baseUrl}/admin/tickets/new?${searchParams.toString()}`;
  }

  generateTicketingDashboardLink(params?: {
    companyId?: string;
    contactId?: string;
  }): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const searchParams = new URLSearchParams();
    
    if (params?.companyId) searchParams.append('companyId', params.companyId);
    if (params?.contactId) searchParams.append('contactId', params.contactId);
    
    return `${baseUrl}/admin/tickets${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  }

  /**
   * Invalidate cache for specific entities
   */
  invalidateCompanyCache(companyId: string): void {
    cache.invalidate(`company:${companyId}`);
  }

  invalidateContactCache(contactId: string): void {
    cache.invalidate(`contact:${contactId}`);
  }

  /**
   * Clear all cache (useful for logout)
   */
  clearCache(): void {
    cache.clear();
  }
}

// Utility functions for UI formatting
export const formatTicketStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'new': 'New',
    'ack': 'Acknowledged',
    'in_progress': 'In Progress',
    'waiting_customer': 'Waiting on Customer',
    'resolved': 'Resolved',
    'closed': 'Closed'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'new': 'bg-purple-100 text-purple-800',
    'ack': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'waiting_customer': 'bg-orange-100 text-orange-800',
    'resolved': 'bg-green-100 text-green-800',
    'closed': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    'low': 'bg-gray-100 text-gray-800',
    'normal': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'urgent': 'bg-red-100 text-red-800'
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export const formatSLATime = (slaDue?: string): { text: string; isBreached: boolean; color: string } => {
  if (!slaDue) {
    return { text: 'No SLA', isBreached: false, color: 'text-gray-500' };
  }

  const due = new Date(slaDue);
  const now = new Date();
  const diffMinutes = Math.floor((due.getTime() - now.getTime()) / (1000 * 60));

  if (diffMinutes < 0) {
    const hoursOverdue = Math.ceil(Math.abs(diffMinutes) / 60);
    return {
      text: `BREACHED (${hoursOverdue}h ago)`,
      isBreached: true,
      color: 'text-red-600'
    };
  } else if (diffMinutes < 60) {
    return {
      text: `${diffMinutes}m left`,
      isBreached: false,
      color: diffMinutes < 30 ? 'text-orange-600' : 'text-green-600'
    };
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return {
      text: `${hours}h ${minutes}m left`,
      isBreached: false,
      color: hours < 2 ? 'text-orange-600' : 'text-green-600'
    };
  }
};

// Singleton instance for use across CRM
export const crmTicketingAPI = new CRMTicketingAPI();