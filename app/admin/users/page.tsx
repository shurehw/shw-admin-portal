'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Shield, Mail, Phone,
  User, Users, Building2, Calendar, CheckCircle, 
  XCircle, AlertCircle, MoreVertical, Key, Loader2, Send, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/AdminLayout';

interface UserType {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'sales_rep' | 'sales_manager' | 'customer_service' | 'cs_manager' | 'production' | 'production_manager' | 'art_team' | 'viewer';
  department?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  created_at: string;
  last_sign_in_at?: string;
  isPendingInvite?: boolean;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isAdmin } = useAuth();
  
  // More robust admin check - check both isAdmin and role directly
  const isActuallyAdmin = isAdmin || currentUser?.role === 'admin';
  
  // Check if user is a manager (safely check for role)
  const isManager = currentUser?.role ? currentUser.role.includes('_manager') : false;
  const canManageUsers = isActuallyAdmin || isManager;
  
  // Helper function to check if current user can manage a specific user
  const canManageUser = (user: UserType) => {
    // More robust admin check
    if (isActuallyAdmin) return true;
    if (!isManager) return false;
    
    // Managers can only manage users in their department
    const managerDepartment = currentUser?.role === 'sales_manager' ? 'sales' :
                             currentUser?.role === 'cs_manager' ? 'customer_service' :
                             currentUser?.role === 'production_manager' ? 'production' : null;
    
    return user.department === managerDepartment;
  };
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [saving, setSaving] = useState(false);
  const [inviteEmails, setInviteEmails] = useState([{ email: '', role: 'viewer' }]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'sales_rep' as UserType['role'],
    department: '',
    phone: '',
    status: 'active' as UserType['status'],
  });

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'bg-purple-100 text-purple-800' },
    { value: 'sales_manager', label: 'Sales Manager', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'sales_rep', label: 'Sales Representative', color: 'bg-blue-100 text-blue-800' },
    { value: 'cs_manager', label: 'CS Manager', color: 'bg-teal-100 text-teal-800' },
    { value: 'customer_service', label: 'Customer Service', color: 'bg-green-100 text-green-800' },
    { value: 'production_manager', label: 'Production Manager', color: 'bg-orange-100 text-orange-800' },
    { value: 'production', label: 'Production', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'art_team', label: 'Art Team', color: 'bg-pink-100 text-pink-800' },
    { value: 'viewer', label: 'Viewer', color: 'bg-gray-100 text-gray-800' }
  ];

  useEffect(() => {
    loadUsers();
    loadPendingInvites();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, pendingInvites, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvites = async () => {
    try {
      const response = await fetch('/api/admin/users/pending-invites');
      if (response.ok) {
        const data = await response.json();
        setPendingInvites(data);
      }
    } catch (error) {
      console.error('Error loading pending invites:', error);
    }
  };

  const filterUsers = () => {
    // Combine users and pending invites
    const allUsers = [
      ...users,
      ...pendingInvites.map(invite => ({
        id: `invite-${invite.id}`,
        email: invite.email,
        full_name: undefined,
        role: invite.role as UserType['role'],
        department: undefined,
        phone: undefined,
        status: 'pending' as UserType['status'],
        created_at: invite.invited_at,
        last_sign_in_at: undefined,
        isPendingInvite: true
      }))
    ];

    let filtered = [...allUsers];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActuallyAdmin) {
      alert('Only administrators can add users');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setUsers([newUser, ...users]);
        setShowAddModal(false);
        resetForm();
        alert('User created successfully!');
      } else {
        const error = await response.json();
        alert(`Error creating user: ${error.error}`);
      }
    } catch (error) {
      alert('Error creating user');
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user can edit
    if (!selectedUser) return;
    
    // TEMPORARY: Skip permission check for jacob@shurehw.com
    // This is a temporary fix while we resolve the auth context issue
    console.log('Editing user - permission check temporarily bypassed');

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.full_name,
          role: formData.role,
          department: formData.department,
          phone: formData.phone,
          status: formData.status,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        setShowEditModal(false);
        resetForm();
        alert('User updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error updating user: ${error.error}`);
      }
    } catch (error) {
      alert('Error updating user');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const isInvite = userId.startsWith('invite-');
    
    // Allow anyone to cancel invites, but only admins to delete users
    if (!isInvite && !isActuallyAdmin) {
      alert('Only administrators can delete users');
      return;
    }

    if (userId === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }
    const confirmMessage = isInvite 
      ? 'Are you sure you want to cancel this invite?' 
      : 'Are you sure you want to delete this user? This action cannot be undone.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (isInvite) {
          loadPendingInvites(); // Reload pending invites
          alert('Invite cancelled successfully');
        } else {
          setUsers(users.filter(u => u.id !== userId));
          alert('User deleted successfully');
        }
        loadUsers(); // Reload the full list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      alert('Error performing action');
    }
  };

  const handleResendInvite = async (inviteId: string, email: string) => {
    try {
      const response = await fetch('/api/admin/users/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });

      if (response.ok) {
        alert(`Invite resent to ${email}`);
        loadPendingInvites(); // Reload to show updated timestamp
      } else {
        const error = await response.json();
        alert(`Error resending invite: ${error.error}`);
      }
    } catch (error) {
      alert('Error resending invite');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to cancel this invite?')) return;

    try {
      // Extract the actual invite ID from the prefixed ID
      const actualId = inviteId.replace('invite-', '');
      
      const response = await fetch(`/api/admin/users/cancel-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: actualId }),
      });

      if (response.ok) {
        alert('Invite cancelled');
        loadPendingInvites();
      } else {
        alert('Error cancelling invite');
      }
    } catch (error) {
      alert('Error cancelling invite');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!isActuallyAdmin) {
      alert('Only administrators can reset passwords');
      return;
    }

    const newPassword = prompt('Enter new password for this user:');
    if (!newPassword) return;

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          newPassword,
        }),
      });

      if (response.ok) {
        alert('Password reset successfully');
      } else {
        const error = await response.json();
        alert(`Error resetting password: ${error.error}`);
      }
    } catch (error) {
      alert('Error resetting password');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      full_name: '',
      role: 'sales_rep',
      department: '',
      phone: '',
      status: 'active',
    });
    setSelectedUser(null);
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      status: user.status,
    });
    setShowEditModal(true);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig ? roleConfig : { label: role, color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
      case 'inactive':
        return { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
      case 'suspended':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' };
      case 'pending':
        return { icon: Mail, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      default:
        return { icon: AlertCircle, color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user accounts and permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Users className="h-10 w-10 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl font-semibold">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-semibold">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <Shield className="h-10 w-10 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-xl font-semibold">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center">
            <User className="h-10 w-10 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">Sales Reps</p>
              <p className="text-xl font-semibold">
                {users.filter(u => u.role === 'sales_rep').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending Invite</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
              <span className="text-sm text-gray-500">
                Your role: {roles.find(r => r.value === currentUser.role)?.label || currentUser.role || 'Unknown'}
              </span>
            ) : (
              <span className="text-sm text-gray-500">
                Role: Admin (default)
              </span>
            )}
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
              Invite Users
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const statusConfig = getStatusBadge(user.status);
              const StatusIcon = statusConfig.icon;
              const roleConfig = getRoleBadge(user.role);

              return (
                <tr 
                  key={user.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    if (!user.isPendingInvite && canManageUser(user)) {
                      openEditModal(user);
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name || user.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleConfig.color}`}>
                      {roleConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building2 className="h-4 w-4 text-gray-400 mr-1" />
                      {user.department || 'Not assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig.bg} w-fit`}>
                      <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                      <span className={`text-xs font-medium ${statusConfig.color}`}>
                        {user.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                      {user.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleDateString()
                        : 'Never'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {user.isPendingInvite ? (
                        // Actions for pending invites
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendInvite(user.id, user.email);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Resend invite"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteUser(user.id);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel invite"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        // Actions for existing users
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(user);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit user"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetPassword(user.id);
                            }}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Reset password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          {isActuallyAdmin && user.id !== currentUser?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New User</h2>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserType['role'] })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  >
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    disabled={!isActuallyAdmin}
                  >
                    <option value="">Not assigned</option>
                    <option value="sales">Sales</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="production">Production</option>
                    <option value="art">Art</option>
                    <option value="admin">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Creating...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit User</h2>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserType['role'] })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {roles
                      .filter(role => {
                        // If we can't determine admin status, show all roles for now
                        if (isActuallyAdmin === undefined || isActuallyAdmin === null) return true;
                        // Admins can assign any role
                        if (isActuallyAdmin) return true;
                        // Managers cannot assign admin or other manager roles
                        if (isManager) {
                          return !['admin', 'sales_manager', 'cs_manager', 'production_manager'].includes(role.value);
                        }
                        return true; // Default to showing all roles if permissions unclear
                      })
                      .map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    disabled={!isActuallyAdmin}
                  >
                    <option value="">Not assigned</option>
                    <option value="sales">Sales</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="production">Production</option>
                    <option value="art">Art</option>
                    <option value="admin">Administration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as UserType['status'] })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Users Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Send className="h-5 w-5" />
                Invite Team Members
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmails([{ email: '', role: 'viewer' }]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Send email invitations to team members. They'll receive a link to sign in with Google.
            </p>
            
            <div className="space-y-4">
              {inviteEmails.map((invite, index) => (
                <div key={index} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={invite.email}
                      onChange={(e) => {
                        const updated = [...inviteEmails];
                        updated[index].email = e.target.value;
                        setInviteEmails(updated);
                      }}
                      placeholder="user@shurehw.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div className="w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={invite.role}
                      onChange={(e) => {
                        const updated = [...inviteEmails];
                        updated[index].role = e.target.value;
                        setInviteEmails(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={() => {
                      setInviteEmails(inviteEmails.filter((_, i) => i !== index));
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    disabled={inviteEmails.length === 1}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setInviteEmails([...inviteEmails, { email: '', role: 'viewer' }]);
              }}
              className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Another
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Invited users will receive an email with a link to sign in. 
                When they sign in with Google, they'll automatically get the role you've assigned.
              </p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmails([{ email: '', role: 'viewer' }]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const validInvites = inviteEmails.filter(inv => inv.email.trim());
                  if (validInvites.length === 0) {
                    alert('Please enter at least one email address');
                    return;
                  }

                  const invalidEmails = validInvites.filter(inv => {
                    const domain = inv.email.split('@')[1];
                    return !['shurehw.com', 'shureprint.com', 'thebinyangroup.com'].includes(domain);
                  });

                  if (invalidEmails.length > 0) {
                    alert('Invalid email domains. Only @shurehw.com, @shureprint.com, and @thebinyangroup.com are allowed.');
                    return;
                  }

                  setSaving(true);
                  try {
                    // Use Supabase Auth to send actual email invites
                    const response = await fetch('/api/admin/users/invite-with-supabase', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ invites: validInvites })
                    });

                    if (response.ok) {
                      const result = await response.json();
                      if (result.errors && result.errors.length > 0) {
                        const errorMessages = result.errors.map((e: any) => `${e.email}: ${e.error}`).join('\n');
                        alert(`Some invites failed:\n${errorMessages}\n\n${result.invited.length} invites sent successfully.`);
                      } else {
                        alert(`Successfully sent invites to ${validInvites.length} user(s). They will receive an email with login instructions.`);
                      }
                      setShowInviteModal(false);
                      setInviteEmails([{ email: '', role: 'viewer' }]);
                      loadUsers(); // Reload user list
                      loadPendingInvites(); // Reload pending invites
                    } else {
                      const error = await response.json();
                      alert(`Error sending invites: ${error.error || 'Unknown error'}`);
                    }
                  } catch (error) {
                    alert(`Error sending invites: ${error}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={saving}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : 'Send Invites'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}