'use client';

import { useState, useEffect } from 'react';
import { Shield, Save, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';

interface Permission {
  id: string;
  permission: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: string;
  permission: string;
}

export default function RolePermissionsPage() {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [availablePermissions] = useState<Permission[]>([
    // User management
    { id: 'users:create', permission: 'users:create', description: 'Create new users', category: 'User Management' },
    { id: 'users:read', permission: 'users:read', description: 'View user information', category: 'User Management' },
    { id: 'users:update', permission: 'users:update', description: 'Edit user details', category: 'User Management' },
    { id: 'users:delete', permission: 'users:delete', description: 'Delete users', category: 'User Management' },
    
    // Ticket management
    { id: 'tickets:create', permission: 'tickets:create', description: 'Create support tickets', category: 'Support' },
    { id: 'tickets:read', permission: 'tickets:read', description: 'View support tickets', category: 'Support' },
    { id: 'tickets:update', permission: 'tickets:update', description: 'Update ticket status/details', category: 'Support' },
    { id: 'tickets:delete', permission: 'tickets:delete', description: 'Delete tickets', category: 'Support' },
    
    // Order management
    { id: 'orders:create', permission: 'orders:create', description: 'Create new orders', category: 'Orders' },
    { id: 'orders:read', permission: 'orders:read', description: 'View orders', category: 'Orders' },
    { id: 'orders:update', permission: 'orders:update', description: 'Update order details', category: 'Orders' },
    { id: 'orders:delete', permission: 'orders:delete', description: 'Delete orders', category: 'Orders' },
    
    // Customer management
    { id: 'customers:create', permission: 'customers:create', description: 'Add new customers', category: 'Customers' },
    { id: 'customers:read', permission: 'customers:read', description: 'View customer information', category: 'Customers' },
    { id: 'customers:update', permission: 'customers:update', description: 'Edit customer details', category: 'Customers' },
    { id: 'customers:delete', permission: 'customers:delete', description: 'Delete customers', category: 'Customers' },
    
    // Quote management
    { id: 'quotes:create', permission: 'quotes:create', description: 'Create quotes', category: 'Sales' },
    { id: 'quotes:read', permission: 'quotes:read', description: 'View quotes', category: 'Sales' },
    { id: 'quotes:update', permission: 'quotes:update', description: 'Edit quotes', category: 'Sales' },
    { id: 'quotes:delete', permission: 'quotes:delete', description: 'Delete quotes', category: 'Sales' },
    
    // Invoice management
    { id: 'invoices:create', permission: 'invoices:create', description: 'Create invoices', category: 'Finance' },
    { id: 'invoices:read', permission: 'invoices:read', description: 'View invoices', category: 'Finance' },
    { id: 'invoices:update', permission: 'invoices:update', description: 'Edit invoices', category: 'Finance' },
    { id: 'invoices:delete', permission: 'invoices:delete', description: 'Delete invoices', category: 'Finance' },
    
    // Art proofs
    { id: 'art_proofs:create', permission: 'art_proofs:create', description: 'Create art proofs', category: 'Production' },
    { id: 'art_proofs:read', permission: 'art_proofs:read', description: 'View art proofs', category: 'Production' },
    { id: 'art_proofs:update', permission: 'art_proofs:update', description: 'Edit art proofs', category: 'Production' },
    
    // System
    { id: 'reports:read', permission: 'reports:read', description: 'View system reports', category: 'System' },
    { id: 'settings:manage', permission: 'settings:manage', description: 'Manage system settings', category: 'System' },
    { id: 'crm:full_access', permission: 'crm:full_access', description: 'Full CRM access', category: 'CRM' },
    { id: 'crm:limited_access', permission: 'crm:limited_access', description: 'Limited CRM access', category: 'CRM' },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
    { value: 'sales_rep', label: 'Sales Representative', color: 'bg-blue-100 text-blue-800' },
    { value: 'customer_service', label: 'Customer Service', color: 'bg-green-100 text-green-800' },
    { value: 'production', label: 'Production', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    fetchRolePermissions();
  }, []);

  const fetchRolePermissions = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: RolePermission[] = [
        // Admin permissions
        { role: 'admin', permission: 'users:create' },
        { role: 'admin', permission: 'users:read' },
        { role: 'admin', permission: 'users:update' },
        { role: 'admin', permission: 'users:delete' },
        { role: 'admin', permission: 'tickets:create' },
        { role: 'admin', permission: 'tickets:read' },
        { role: 'admin', permission: 'tickets:update' },
        { role: 'admin', permission: 'tickets:delete' },
        { role: 'admin', permission: 'orders:create' },
        { role: 'admin', permission: 'orders:read' },
        { role: 'admin', permission: 'orders:update' },
        { role: 'admin', permission: 'orders:delete' },
        { role: 'admin', permission: 'customers:create' },
        { role: 'admin', permission: 'customers:read' },
        { role: 'admin', permission: 'customers:update' },
        { role: 'admin', permission: 'customers:delete' },
        { role: 'admin', permission: 'quotes:create' },
        { role: 'admin', permission: 'quotes:read' },
        { role: 'admin', permission: 'quotes:update' },
        { role: 'admin', permission: 'quotes:delete' },
        { role: 'admin', permission: 'invoices:create' },
        { role: 'admin', permission: 'invoices:read' },
        { role: 'admin', permission: 'invoices:update' },
        { role: 'admin', permission: 'invoices:delete' },
        { role: 'admin', permission: 'reports:read' },
        { role: 'admin', permission: 'settings:manage' },
        { role: 'admin', permission: 'crm:full_access' },
        
        // Sales Rep permissions
        { role: 'sales_rep', permission: 'tickets:create' },
        { role: 'sales_rep', permission: 'tickets:read' },
        { role: 'sales_rep', permission: 'tickets:update' },
        { role: 'sales_rep', permission: 'orders:create' },
        { role: 'sales_rep', permission: 'orders:read' },
        { role: 'sales_rep', permission: 'orders:update' },
        { role: 'sales_rep', permission: 'customers:create' },
        { role: 'sales_rep', permission: 'customers:read' },
        { role: 'sales_rep', permission: 'customers:update' },
        { role: 'sales_rep', permission: 'quotes:create' },
        { role: 'sales_rep', permission: 'quotes:read' },
        { role: 'sales_rep', permission: 'quotes:update' },
        { role: 'sales_rep', permission: 'invoices:read' },
        { role: 'sales_rep', permission: 'crm:full_access' },
        
        // Customer Service permissions
        { role: 'customer_service', permission: 'tickets:create' },
        { role: 'customer_service', permission: 'tickets:read' },
        { role: 'customer_service', permission: 'tickets:update' },
        { role: 'customer_service', permission: 'orders:read' },
        { role: 'customer_service', permission: 'orders:update' },
        { role: 'customer_service', permission: 'customers:read' },
        { role: 'customer_service', permission: 'customers:update' },
        { role: 'customer_service', permission: 'invoices:read' },
        { role: 'customer_service', permission: 'crm:limited_access' },
        
        // Production permissions
        { role: 'production', permission: 'orders:read' },
        { role: 'production', permission: 'orders:update' },
        { role: 'production', permission: 'quotes:read' },
        { role: 'production', permission: 'quotes:update' },
        { role: 'production', permission: 'art_proofs:create' },
        { role: 'production', permission: 'art_proofs:read' },
        { role: 'production', permission: 'art_proofs:update' },
        
        // Viewer permissions
        { role: 'viewer', permission: 'tickets:read' },
        { role: 'viewer', permission: 'orders:read' },
        { role: 'viewer', permission: 'customers:read' },
        { role: 'viewer', permission: 'quotes:read' },
        { role: 'viewer', permission: 'invoices:read' },
      ];
      
      setRolePermissions(mockData);
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: string, permission: string): boolean => {
    return rolePermissions.some(rp => rp.role === role && rp.permission === permission);
  };

  const togglePermission = (role: string, permission: string) => {
    const hasIt = hasPermission(role, permission);
    
    if (hasIt) {
      setRolePermissions(prev => 
        prev.filter(rp => !(rp.role === role && rp.permission === permission))
      );
    } else {
      setRolePermissions(prev => [...prev, { role, permission }]);
    }
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // Here you would make an API call to save the permissions
      console.log('Saving role permissions:', rolePermissions);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage('Role permissions saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage('Error saving permissions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsByCategory = () => {
    const categories = availablePermissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, Permission[]>);

    return categories;
  };

  const permissionsByCategory = getPermissionsByCategory();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Permissions</h1>
            <p className="text-gray-600">Manage what each role can access and do</p>
          </div>
        </div>
        
        <button
          onClick={savePermissions}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {message.includes('Error') ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <CheckCircle className="h-5 w-5" />
          )}
          {message}
        </div>
      )}

      {/* Permissions Matrix */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
            <div key={category} className="border-b last:border-b-0">
              {/* Category Header */}
              <div className="bg-gray-50 px-6 py-3 border-b">
                <h3 className="font-semibold text-gray-900">{category}</h3>
              </div>
              
              {/* Permission Rows */}
              {permissions.map(permission => (
                <div key={permission.id} className="border-b last:border-b-0">
                  <div className="px-6 py-4 flex items-center">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{permission.permission}</div>
                      <div className="text-sm text-gray-500">{permission.description}</div>
                    </div>
                    
                    {/* Role Checkboxes */}
                    <div className="flex items-center gap-6">
                      {roles.map(role => (
                        <div key={role.value} className="flex items-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={hasPermission(role.value, permission.permission)}
                              onChange={() => togglePermission(role.value, permission.permission)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700 min-w-[100px]">
                              {role.label}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {roles.map(role => {
          const rolePermissions = availablePermissions.filter(perm => 
            hasPermission(role.value, perm.permission)
          );
          
          return (
            <div key={role.value} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
                  {role.label}
                </div>
                <span className="text-sm text-gray-500">
                  {rolePermissions.length} permissions
                </span>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {rolePermissions.map(perm => (
                  <div key={perm.id} className="text-sm text-gray-600">
                    • {perm.description}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}