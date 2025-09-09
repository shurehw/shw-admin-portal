import { AuthService } from './auth';

export interface DataAccessContext {
  userId: string;
  role: string;
  isAdmin: boolean;
  isSalesManager: boolean;
  isAccountManager: boolean;
}

/**
 * Get data access context for the current user
 */
export function getDataAccessContext(): DataAccessContext | null {
  const claims = AuthService.getClaims();
  if (!claims) return null;

  const role = claims.roles?.[0] || 'guest';
  
  return {
    userId: claims.sub,
    role: role,
    isAdmin: role === 'org_admin',
    isSalesManager: role === 'sales_manager',
    isAccountManager: role === 'account_manager'
  };
}

/**
 * Check if user can see all data or only their own
 */
export function canSeeAllData(context: DataAccessContext): boolean {
  // Admins and Sales Managers can see all data
  return context.isAdmin || context.isSalesManager;
}

/**
 * Apply data visibility filter to a query
 */
export function applyDataVisibilityFilter(
  query: any,
  context: DataAccessContext,
  ownerField: string = 'assigned_to'
): any {
  // If user can see all data, return query unchanged
  if (canSeeAllData(context)) {
    return query;
  }

  // Account Managers only see their own data
  if (context.isAccountManager) {
    return {
      ...query,
      [ownerField]: context.userId
    };
  }

  // Default: no access
  return {
    ...query,
    _forbidden: true
  };
}

/**
 * Filter array of records based on data visibility
 */
export function filterDataByVisibility<T extends Record<string, any>>(
  data: T[],
  context: DataAccessContext,
  ownerField: string = 'assigned_to'
): T[] {
  // If user can see all data, return all records
  if (canSeeAllData(context)) {
    return data;
  }

  // Account Managers only see their own data
  if (context.isAccountManager) {
    return data.filter(record => 
      record[ownerField] === context.userId ||
      record.created_by === context.userId ||
      (record.team_members && record.team_members.includes(context.userId))
    );
  }

  // Default: no data
  return [];
}

/**
 * Check if user can edit a specific record
 */
export function canEditRecord(
  record: Record<string, any>,
  context: DataAccessContext,
  ownerField: string = 'assigned_to'
): boolean {
  // Admins and Sales Managers can edit all records
  if (canSeeAllData(context)) {
    return true;
  }

  // Account Managers can only edit their own records
  if (context.isAccountManager) {
    return record[ownerField] === context.userId ||
           record.created_by === context.userId;
  }

  return false;
}

/**
 * Get visibility scope description for UI
 */
export function getVisibilityScope(context: DataAccessContext): string {
  if (context.isAdmin) {
    return 'All data (Admin)';
  }
  if (context.isSalesManager) {
    return 'All team data (Sales Manager)';
  }
  if (context.isAccountManager) {
    return 'My accounts only';
  }
  return 'Limited access';
}

/**
 * Apply team-based filtering for hierarchical access
 */
export function applyTeamFilter(
  query: any,
  context: DataAccessContext,
  teamField: string = 'team_id'
): any {
  // Sales Managers see all data in their team and subordinate teams
  if (context.isSalesManager) {
    // In a real implementation, this would fetch the manager's team hierarchy
    return {
      ...query,
      // This would be replaced with actual team hierarchy logic
      _or: [
        { [teamField]: context.userId },
        { reports_to: context.userId }
      ]
    };
  }

  return applyDataVisibilityFilter(query, context);
}