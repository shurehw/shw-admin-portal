// User Permission Presets
// Add team members here with their email and assigned role
// Roles: 'admin' | 'sales_rep' | 'customer_service' | 'production' | 'art_team' | 'viewer'

export const userPermissions: Record<string, string> = {
  // Admins
  'jacob@shurehw.com': 'admin',
  'jacob@shureprint.com': 'admin',
  
  // Sales Team
  // 'john@shurehw.com': 'sales_rep',
  // 'sarah@shureprint.com': 'sales_rep',
  
  // Production Team
  // 'mike@shureprint.com': 'production',
  // 'lisa@shurehw.com': 'production',
  
  // Art Team
  // 'david@shureprint.com': 'art_team',
  // 'emma@shurehw.com': 'art_team',
  
  // Customer Service
  // 'support@shurehw.com': 'customer_service',
  // 'help@shureprint.com': 'customer_service',
  
  // Add more team members as needed
  // 'email@domain.com': 'role',
};

// Default role for users not in the list
export const defaultRole = 'viewer';

// Allowed email domains
export const allowedDomains = ['shurehw.com', 'shureprint.com', 'thebinyangroup.com'];