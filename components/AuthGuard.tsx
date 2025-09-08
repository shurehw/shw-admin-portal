'use client';

import { ReactNode, useState } from 'react';
import { Lock, Info } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { CRMCapability } from '@/lib/auth';

interface AuthGuardProps {
  capability?: CRMCapability;
  capabilities?: CRMCapability[];
  requireAll?: boolean; // For capabilities array - default is "any"
  fallback?: ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
  children: ReactNode;
}

export default function AuthGuard({
  capability,
  capabilities,
  requireAll = false,
  fallback,
  showTooltip = true,
  tooltipMessage,
  children
}: AuthGuardProps) {
  const { hasCapability, hasAnyCapability, hasAllCapabilities, isAuthenticated } = useAuth();
  const [showTooltipState, setShowTooltipState] = useState(false);

  if (!isAuthenticated) {
    return fallback || null;
  }

  let hasAccess = false;

  if (capability) {
    hasAccess = hasCapability(capability);
  } else if (capabilities && capabilities.length > 0) {
    hasAccess = requireAll 
      ? hasAllCapabilities(capabilities)
      : hasAnyCapability(capabilities);
  } else {
    // No specific capability required
    hasAccess = true;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Access denied
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showTooltip) {
    return null;
  }

  // Show inline permission tooltip
  const message = tooltipMessage || 
    (capability ? `Requires ${capability} permission` : 
     capabilities ? `Requires ${capabilities.join(' or ')} permission` : 
     'Insufficient permissions');

  return (
    <div className="relative inline-block">
      <div 
        className="opacity-50 cursor-not-allowed"
        onMouseEnter={() => setShowTooltipState(true)}
        onMouseLeave={() => setShowTooltipState(false)}
      >
        {children}
      </div>
      {showTooltipState && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap flex items-center">
            <Lock className="h-3 w-3 mr-1" />
            {message}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Convenience components for common patterns
export function AdminGuard({ children, ...props }: Omit<AuthGuardProps, 'capability'>) {
  return (
    <AuthGuard capability="org:admin" {...props}>
      {children}
    </AuthGuard>
  );
}

export function WriteGuard({ 
  children, 
  resource, 
  ...props 
}: Omit<AuthGuardProps, 'capability'> & { resource: 'contacts' | 'companies' | 'deals' | 'tickets' | 'tasks' | 'activities' }) {
  const capability = `${resource}:write` as CRMCapability;
  return (
    <AuthGuard capability={capability} {...props}>
      {children}
    </AuthGuard>
  );
}

export function ReadGuard({ 
  children, 
  resource, 
  ...props 
}: Omit<AuthGuardProps, 'capability'> & { resource: 'contacts' | 'companies' | 'deals' | 'tickets' | 'tasks' | 'activities' | 'analytics' | 'admin' }) {
  const capability = `${resource}:read` as CRMCapability;
  return (
    <AuthGuard capability={capability} {...props}>
      {children}
    </AuthGuard>
  );
}