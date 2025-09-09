import { jwtDecode } from 'jwt-decode';

// JWT Claims structure from portal
export interface PortalJWTClaims {
  sub: string;           // user ID
  email: string;
  org_id: string;
  roles: string[];       // portal roles
  teams?: string[];      // optional teams
  permissions?: string[]; // optional pre-computed capabilities
  exp: number;
  iat: number;
}

// CRM Capabilities
export type CRMCapability = 
  | 'contacts:read' | 'contacts:write'
  | 'companies:read' | 'companies:write'
  | 'deals:read' | 'deals:write'
  | 'tickets:read' | 'tickets:write'
  | 'tasks:read' | 'tasks:write'
  | 'activities:read' | 'activities:write'
  | 'leads:read' | 'leads:write'
  | 'quotes:read' | 'quotes:write'
  | 'analytics:read'
  | 'settings:write'
  | 'admin:read'
  | 'org:admin';

// Role to capabilities mapping (cached from portal)
interface RoleMapping {
  [role: string]: CRMCapability[];
}

// Default role mappings (fallback if portal sync fails)
const DEFAULT_ROLE_MAPPINGS: RoleMapping = {
  'account_manager': [
    'contacts:read', 'contacts:write',
    'companies:read', 'companies:write', 
    'deals:read', 'deals:write',
    'tasks:read', 'tasks:write',
    'activities:read', 'activities:write'
    // Note: No analytics:read - they only see their own data
  ],
  'sales_manager': [
    'contacts:read', 'contacts:write',
    'companies:read', 'companies:write',
    'deals:read', 'deals:write',
    'tickets:read', 'tickets:write',
    'tasks:read', 'tasks:write',
    'activities:read', 'activities:write',
    'analytics:read',
    'admin:read',
    'leads:read', 'leads:write',
    'quotes:read', 'quotes:write',
    'settings:write'
    // Full CRM admin - sees all data
  ],
  'cs_agent': [
    'contacts:read', 'contacts:write',
    'companies:read',
    'tickets:read', 'tickets:write',
    'tasks:read', 'tasks:write',
    'activities:read', 'activities:write'
  ],
  'manager': [
    'contacts:read', 'contacts:write',
    'companies:read', 'companies:write',
    'deals:read', 'deals:write', 
    'tickets:read', 'tickets:write',
    'tasks:read', 'tasks:write',
    'activities:read', 'activities:write',
    'analytics:read',
    'admin:read'
  ],
  'org_admin': [
    'contacts:read', 'contacts:write',
    'companies:read', 'companies:write',
    'deals:read', 'deals:write',
    'tickets:read', 'tickets:write', 
    'tasks:read', 'tasks:write',
    'activities:read', 'activities:write',
    'analytics:read',
    'settings:write',
    'admin:read',
    'org:admin',
    'leads:read', 'leads:write',
    'quotes:read', 'quotes:write'
  ]
};

// Auth configuration
const AUTH_CONFIG = {
  OIDC_ISSUER: process.env.NEXT_PUBLIC_OIDC_ISSUER || 'https://portal.shurehw.com',
  OIDC_AUDIENCE: process.env.NEXT_PUBLIC_OIDC_AUDIENCE || 'crm',
  OIDC_JWKS_URL: process.env.NEXT_PUBLIC_OIDC_JWKS_URL || 'https://portal.shurehw.com/.well-known/jwks.json',
  ROLE_MAPPING_SYNC_URL: process.env.NEXT_PUBLIC_ROLE_MAPPING_SYNC_URL || 'https://portal.shurehw.com/api/crm/role-capabilities',
  SESSION_TTL: 8 * 60 * 60 * 1000, // 8 hours
  REFRESH_TTL: 24 * 60 * 60 * 1000, // 24 hours
};

// Cache for role mappings
let roleMappingCache: RoleMapping | null = null;
let roleMappingCacheTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class AuthService {
  // Get JWT token from storage
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('crm_jwt_token');
  }

  // Set JWT token in storage
  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('crm_jwt_token', token);
  }

  // Remove JWT token from storage
  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('crm_jwt_token');
  }

  // Decode and validate JWT token
  static decodeToken(token?: string): PortalJWTClaims | null {
    const jwt = token || this.getToken();
    if (!jwt) return null;

    try {
      // Handle development mock tokens
      if (process.env.NODE_ENV === 'development' && jwt.endsWith('.dev-signature')) {
        const parts = jwt.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          
          // Check if token is expired
          if (payload.exp * 1000 < Date.now()) {
            this.removeToken();
            return null;
          }
          
          return payload;
        }
      }
      
      // Handle real JWT tokens
      const decoded = jwtDecode<PortalJWTClaims>(jwt);
      
      // Check if token is expired
      if (decoded.exp * 1000 < Date.now()) {
        this.removeToken();
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Invalid JWT token:', error);
      this.removeToken();
      return null;
    }
  }

  // Get current user from JWT
  static getCurrentUser(): PortalJWTClaims | null {
    return this.decodeToken();
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Redirect to portal login
  static redirectToLogin(): void {
    if (typeof window === 'undefined') return;
    
    const returnUrl = encodeURIComponent(window.location.href);
    const loginUrl = `${AUTH_CONFIG.OIDC_ISSUER}/auth/login?redirect_uri=${returnUrl}&client_id=${AUTH_CONFIG.OIDC_AUDIENCE}`;
    window.location.href = loginUrl;
  }

  // Logout and redirect to portal
  static logout(): void {
    this.removeToken();
    if (typeof window === 'undefined') return;
    
    const logoutUrl = `${AUTH_CONFIG.OIDC_ISSUER}/auth/logout?redirect_uri=${encodeURIComponent(window.location.origin)}`;
    window.location.href = logoutUrl;
  }

  // Sync role mappings from portal
  static async syncRoleMappings(): Promise<RoleMapping> {
    const now = Date.now();
    
    // Return cached mappings if still valid
    if (roleMappingCache && (now - roleMappingCacheTime) < CACHE_TTL) {
      return roleMappingCache;
    }

    try {
      const token = this.getToken();
      if (!token) throw new Error('No auth token available');

      const response = await fetch(AUTH_CONFIG.ROLE_MAPPING_SYNC_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const mappings = await response.json();
        roleMappingCache = mappings;
        roleMappingCacheTime = now;
        return mappings;
      } else {
        console.warn('Failed to sync role mappings, using cached or default');
      }
    } catch (error) {
      console.warn('Error syncing role mappings:', error);
    }

    // Fallback to cached or default mappings
    return roleMappingCache || DEFAULT_ROLE_MAPPINGS;
  }

  // Get user capabilities
  static async getUserCapabilities(user?: PortalJWTClaims): Promise<CRMCapability[]> {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return [];

    // If permissions are included in JWT, use them directly
    if (currentUser.permissions) {
      return currentUser.permissions as CRMCapability[];
    }

    // Otherwise derive from roles
    const roleMappings = await this.syncRoleMappings();
    const capabilities = new Set<CRMCapability>();

    currentUser.roles.forEach(role => {
      const roleCapabilities = roleMappings[role] || [];
      roleCapabilities.forEach(cap => capabilities.add(cap));
    });

    return Array.from(capabilities);
  }

  // Check if user has specific capability
  static async hasCapability(capability: CRMCapability, user?: PortalJWTClaims): Promise<boolean> {
    const capabilities = await this.getUserCapabilities(user);
    return capabilities.includes(capability) || capabilities.includes('org:admin');
  }

  // Check multiple capabilities (OR logic)
  static async hasAnyCapability(capabilities: CRMCapability[], user?: PortalJWTClaims): Promise<boolean> {
    const userCapabilities = await this.getUserCapabilities(user);
    const hasOrgAdmin = userCapabilities.includes('org:admin');
    
    if (hasOrgAdmin) return true;
    
    return capabilities.some(cap => userCapabilities.includes(cap));
  }

  // Check multiple capabilities (AND logic)
  static async hasAllCapabilities(capabilities: CRMCapability[], user?: PortalJWTClaims): Promise<boolean> {
    const userCapabilities = await this.getUserCapabilities(user);
    const hasOrgAdmin = userCapabilities.includes('org:admin');
    
    if (hasOrgAdmin) return true;
    
    return capabilities.every(cap => userCapabilities.includes(cap));
  }

  // Get user's teams
  static getUserTeams(user?: PortalJWTClaims): string[] {
    const currentUser = user || this.getCurrentUser();
    return currentUser?.teams || [];
  }

  // Check if user is in specific team
  static isInTeam(team: string, user?: PortalJWTClaims): boolean {
    const teams = this.getUserTeams(user);
    return teams.includes(team);
  }

  // Check if user can access record (for RLS-like checks in UI)
  static canAccessRecord(record: { owner_id?: string; team?: string; org_id?: string }, user?: PortalJWTClaims): boolean {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return false;

    // Check org boundary
    if (record.org_id && record.org_id !== currentUser.org_id) {
      return false;
    }

    // Org admin can access everything
    if (currentUser.roles.includes('org_admin')) {
      return true;
    }

    // Check ownership
    if (record.owner_id === currentUser.sub) {
      return true;
    }

    // Check team membership
    if (record.team && currentUser.teams?.includes(record.team)) {
      return true;
    }

    return false;
  }

  // Initialize auth state and handle token from URL
  static initializeAuth(): boolean {
    if (typeof window === 'undefined') return false;

    // Check for token in URL (from portal redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      this.setToken(tokenFromUrl);
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      window.history.replaceState({}, document.title, url.toString());
      return true;
    }

    // Check existing token
    return this.isAuthenticated();
  }

  // Handle auth errors (expired tokens, etc.)
  static handleAuthError(error: any): void {
    console.error('Auth error:', error);
    
    if (error.status === 401 || error.status === 403) {
      this.removeToken();
      this.redirectToLogin();
    }
  }

  // Get authorization headers for API requests
  static getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    if (!token) return {};
    
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  // Bust role mapping cache (called from webhook)
  static bustRoleMappingCache(): void {
    roleMappingCache = null;
    roleMappingCacheTime = 0;
  }
}

// Auth context for React components
export interface AuthContextType {
  user: PortalJWTClaims | null;
  isAuthenticated: boolean;
  capabilities: CRMCapability[];
  hasCapability: (capability: CRMCapability) => boolean;
  hasAnyCapability: (capabilities: CRMCapability[]) => boolean;
  hasAllCapabilities: (capabilities: CRMCapability[]) => boolean;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

// Mock auth for development
export const mockAuthForDevelopment = () => {
  if (process.env.NODE_ENV === 'development') {
    const mockToken = {
      sub: 'dev_user_123',
      email: 'admin@shurehw.com', 
      org_id: 'org_shw',
      roles: ['org_admin'],
      teams: ['sales', 'cs'],
      exp: Math.floor(Date.now() / 1000) + (8 * 60 * 60), // 8 hours from now
      iat: Math.floor(Date.now() / 1000)
    };

    // Create a simple JWT-like token (not cryptographically signed, just for dev)
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(mockToken));
    const mockJWT = `${header}.${payload}.dev-signature`;

    AuthService.setToken(mockJWT);
    return true;
  }
  return false;
};