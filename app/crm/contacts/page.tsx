'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Mail, Phone, 
  User, Users, Calendar, Tag, Filter, Download,
  Upload, Send, CheckCircle, AlertCircle, Loader2,
  Building2, Briefcase, MapPin, Globe, MoreVertical,
  ChevronDown, X, Clock, Activity, FileText, DollarSign,
  ChevronRight, Key, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  job_title?: string;
  phone?: string;
  mobile?: string;
  lifecycle_stage?: string;
  lead_status?: string;
  owner?: string;
  source?: string;
  created_at: string;
  last_contacted?: string;
  tags?: string[];
  city?: string;
  state?: string;
  country?: string;
}

export default function ContactsPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [saving, setSaving] = useState(false);
  const [showPortalInviteModal, setShowPortalInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    customMessage: '',
    accessLevel: 'standard',
    canViewPricing: true,
    canPlaceOrders: true,
    canViewInvoices: true,
    canViewStatements: true,
    canRequestQuotes: true,
    spendingLimit: ''
  });
  const [sendingInvite, setSendingInvite] = useState(false);
  const [visibilityScope, setVisibilityScope] = useState<string>('');
  const [availableOwners, setAvailableOwners] = useState<{ id: string; name: string; email: string }[]>([]);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    company: '',
    job_title: '',
    phone: '',
    mobile: '',
    lifecycle_stage: 'lead',
    lead_status: 'new',
    source: 'website',
    city: '',
    state: '',
    country: 'USA',
    owner_id: '',
  });

  // Lifecycle stages
  const lifecycleStages = [
    { value: 'subscriber', label: 'Subscriber', color: 'bg-gray-100 text-gray-800' },
    { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'marketing_qualified', label: 'Marketing Qualified', color: 'bg-purple-100 text-purple-800' },
    { value: 'sales_qualified', label: 'Sales Qualified', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'opportunity', label: 'Opportunity', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'customer', label: 'Customer', color: 'bg-green-100 text-green-800' },
    { value: 'evangelist', label: 'Evangelist', color: 'bg-pink-100 text-pink-800' },
  ];

  const leadStatuses = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'unqualified', label: 'Unqualified' },
    { value: 'nurturing', label: 'Nurturing' },
  ];

  const sources = [
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'email_campaign', label: 'Email Campaign' },
    { value: 'trade_show', label: 'Trade Show' },
    { value: 'cold_call', label: 'Cold Call' },
    { value: 'other', label: 'Other' },
  ];

  const dateRanges = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
  ];

  useEffect(() => {
    loadContacts();
    loadAvailableOwners();
    determineVisibilityScope();
  }, []);
  
  const determineVisibilityScope = () => {
    if (!user) return;
    
    const roles = user.roles || [];
    if (roles.includes('org_admin')) {
      setVisibilityScope('All data (Admin)');
    } else if (roles.includes('sales_manager')) {
      setVisibilityScope('All team data (Sales Manager)');
    } else if (roles.includes('account_manager')) {
      setVisibilityScope('My accounts only');
    } else {
      setVisibilityScope('Limited access');
    }
  };

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, stageFilter, statusFilter, sourceFilter, locationFilter, dateFilter]);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadAvailableOwners = async () => {
    try {
      // For now, create mock owners - in production, fetch from API
      const mockOwners = [
        { id: 'user_1', name: 'John Smith', email: 'john.smith@company.com' },
        { id: 'user_2', name: 'Sarah Johnson', email: 'sarah.johnson@company.com' },
        { id: 'user_3', name: 'Mike Wilson', email: 'mike.wilson@company.com' },
        { id: 'user_4', name: 'Emily Davis', email: 'emily.davis@company.com' },
      ];
      
      // If current user exists, add them to the list
      if (user) {
        const currentUserOwner = {
          id: user.id,
          name: user.full_name || user.email,
          email: user.email
        };
        
        // Check if not already in list
        if (!mockOwners.find(o => o.id === user.id)) {
          mockOwners.unshift(currentUserOwner);
        }
      }
      
      setAvailableOwners(mockOwners);
    } catch (error) {
      console.error('Error loading owners:', error);
    }
  };

  const filterContacts = () => {
    let filtered = [...contacts];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(contact => contact.lifecycle_stage === stageFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.lead_status === statusFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(contact => contact.source === sourceFilter);
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(contact => contact.state === locationFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(contact => 
        new Date(contact.created_at) >= startDate
      );
    }

    setFilteredContacts(filtered);
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newContact = await response.json();
        setContacts([newContact, ...contacts]);
        setShowAddModal(false);
        resetForm();
        alert('Contact added successfully');
      } else {
        alert('Error adding contact');
      }
    } catch (error) {
      alert('Error adding contact');
    } finally {
      setSaving(false);
    }
  };

  const handleEditContact = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContact) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/crm/contacts/${selectedContact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedContact = await response.json();
        setContacts(contacts.map(c => c.id === selectedContact.id ? updatedContact : c));
        setShowEditModal(false);
        setSelectedContact(null);
        resetForm();
        alert('Contact updated successfully');
      } else {
        alert('Error updating contact');
      }
    } catch (error) {
      alert('Error updating contact');
    } finally {
      setSaving(false);
    }
  };

  const handleSendPortalInvite = async () => {
    if (!selectedContact) return;
    
    setSendingInvite(true);
    try {
      const response = await fetch('/api/b2b/portal-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContact.id,
          email: selectedContact.email,
          firstName: selectedContact.first_name,
          lastName: selectedContact.last_name,
          company: selectedContact.company,
          customMessage: inviteFormData.customMessage,
          accessLevel: inviteFormData.accessLevel,
          permissions: {
            canViewPricing: inviteFormData.canViewPricing,
            canPlaceOrders: inviteFormData.canPlaceOrders,
            canViewInvoices: inviteFormData.canViewInvoices,
            canViewStatements: inviteFormData.canViewStatements,
            canRequestQuotes: inviteFormData.canRequestQuotes,
            spendingLimit: inviteFormData.spendingLimit ? parseFloat(inviteFormData.spendingLimit) : null
          }
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`Portal invitation sent to ${selectedContact.email}`);
        setShowPortalInviteModal(false);
        // Reset form
        setInviteFormData({
          customMessage: '',
          accessLevel: 'standard',
          canViewPricing: true,
          canPlaceOrders: true,
          canViewInvoices: true,
          canViewStatements: true,
          canRequestQuotes: true,
          spendingLimit: ''
        });
      } else {
        alert(data.error || 'Failed to send portal invitation');
      }
    } catch (error) {
      console.error('Error sending portal invitation:', error);
      alert('Failed to send portal invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {

    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== contactId));
        alert('Contact deleted successfully');
      } else {
        alert('Error deleting contact');
      }
    } catch (error) {
      alert('Error deleting contact');
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      company: '',
      job_title: '',
      phone: '',
      mobile: '',
      lifecycle_stage: 'lead',
      lead_status: 'new',
      source: 'website',
      city: '',
      state: '',
      country: 'USA',
      owner_id: '',
    });
  };

  const getStageColor = (stage?: string) => {
    const stageConfig = lifecycleStages.find(s => s.value === stage);
    return stageConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get unique states for location filter
  const uniqueStates = [...new Set(contacts.map(c => c.state).filter(Boolean))];

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      
    );
  }

  return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600">Manage your contact database</p>
          </div>
          {visibilityScope && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{visibilityScope}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Users className="h-10 w-10 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Contacts</p>
                <p className="text-xl font-semibold">{contacts.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <User className="h-10 w-10 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">New This Month</p>
                <p className="text-xl font-semibold">
                  {contacts.filter(c => {
                    const date = new Date(c.created_at);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CheckCircle className="h-10 w-10 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-xl font-semibold">
                  {contacts.filter(c => c.lifecycle_stage === 'customer').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <AlertCircle className="h-10 w-10 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Opportunities</p>
                <p className="text-xl font-semibold">
                  {contacts.filter(c => c.lifecycle_stage === 'opportunity').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="space-y-4">
            {/* Primary Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Stages</option>
                  {lifecycleStages.map(stage => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  {leadStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4" />
                  {showAdvancedFilters ? 'Hide' : 'More'} Filters
                  <ChevronDown className={`h-4 w-4 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add Contact
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="flex flex-wrap gap-3 pt-3 border-t">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Sources</option>
                  {sources.map(source => (
                    <option key={source.value} value={source.value}>{source.label}</option>
                  ))}
                </select>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Locations</option>
                  {uniqueStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setStageFilter('all');
                    setStatusFilter('all');
                    setSourceFilter('all');
                    setLocationFilter('all');
                    setDateFilter('all');
                    setSearchTerm('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Active Filters Display */}
          {(stageFilter !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all' || locationFilter !== 'all' || dateFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mt-3">
              {stageFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Stage: {lifecycleStages.find(s => s.value === stageFilter)?.label}
                  <button onClick={() => setStageFilter('all')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Status: {leadStatuses.find(s => s.value === statusFilter)?.label}
                  <button onClick={() => setStatusFilter('all')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {sourceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  Source: {sources.find(s => s.value === sourceFilter)?.label}
                  <button onClick={() => setSourceFilter('all')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  Location: {locationFilter}
                  <button onClick={() => setLocationFilter('all')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  Date: {dateRanges.find(d => d.value === dateFilter)?.label}
                  <button onClick={() => setDateFilter('all')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company & Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No contacts found matching your filters
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr 
                    key={contact.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowDetailPanel(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{contact.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm text-gray-900">{contact.company || '-'}</p>
                        <p className="text-sm text-gray-500">{contact.job_title || ''}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(contact.lifecycle_stage)}`}>
                        {lifecycleStages.find(s => s.value === contact.lifecycle_stage)?.label || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {leadStatuses.find(s => s.value === contact.lead_status)?.label || 'New'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sources.find(s => s.value === contact.source)?.label || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(contact.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContact(contact);
                                setFormData({
                                  email: contact.email,
                                  first_name: contact.first_name || '',
                                  last_name: contact.last_name || '',
                                  company: contact.company || '',
                                  job_title: contact.job_title || '',
                                  phone: contact.phone || '',
                                  mobile: contact.mobile || '',
                                  lifecycle_stage: contact.lifecycle_stage || 'lead',
                                  lead_status: contact.lead_status || 'new',
                                  source: contact.source || 'website',
                                  city: contact.city || '',
                                  state: contact.state || '',
                                  country: contact.country || 'USA',
                                });
                                setShowEditModal(true);
                              }}
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteContact(contact.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          className="text-blue-600 hover:text-blue-900"
                          title="Send email"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `mailto:${contact.email}`;
                          }}
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Table Footer */}
          <div className="bg-gray-50 px-6 py-3 border-t">
            <div className="text-sm text-gray-700">
              Showing {filteredContacts.length} of {contacts.length} contacts
            </div>
          </div>
        </div>

        {/* Add/Edit Contact Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {showEditModal ? 'Edit Contact' : 'Add New Contact'}
              </h2>
              <form onSubmit={showEditModal ? handleEditContact : handleAddContact}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
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
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
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
                      Mobile
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Source
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      {sources.map(source => (
                        <option key={source.value} value={source.value}>{source.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Owner
                    </label>
                    <select
                      value={formData.owner_id}
                      onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {availableOwners.map(owner => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name} ({owner.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lifecycle Stage
                    </label>
                    <select
                      value={formData.lifecycle_stage}
                      onChange={(e) => setFormData({ ...formData, lifecycle_stage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      {lifecycleStages.map(stage => (
                        <option key={stage.value} value={stage.value}>{stage.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lead Status
                    </label>
                    <select
                      value={formData.lead_status}
                      onChange={(e) => setFormData({ ...formData, lead_status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      {leadStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedContact(null);
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
                    {saving ? 'Saving...' : (showEditModal ? 'Update' : 'Add')} Contact
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Contact Detail Panel */}
        {showDetailPanel && selectedContact && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailPanel(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
              <div className="h-full flex flex-col">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedContact.first_name} {selectedContact.last_name}
                        </h2>
                        <p className="text-sm text-gray-500">{selectedContact.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailPanel(false)}
                      className="p-2 hover:bg-gray-200 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Panel Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Company</p>
                          <p className="font-medium">{selectedContact.company || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Job Title</p>
                          <p className="font-medium">{selectedContact.job_title || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium flex items-center gap-2">
                            {selectedContact.phone ? (
                              <>
                                <Phone className="h-4 w-4 text-gray-400" />
                                {selectedContact.phone}
                              </>
                            ) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Mobile</p>
                          <p className="font-medium">{selectedContact.mobile || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {[selectedContact.city, selectedContact.state, selectedContact.country].filter(Boolean).join(', ') || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Source</p>
                          <p className="font-medium">{selectedContact.source || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Status Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Lifecycle Stage</p>
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${getStageColor(selectedContact.lifecycle_stage)}`}>
                            {lifecycleStages.find(s => s.value === selectedContact.lifecycle_stage)?.label || 'Unknown'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Lead Status</p>
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            {leadStatuses.find(s => s.value === selectedContact.lead_status)?.label || 'New'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created Date</p>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {formatDate(selectedContact.created_at)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last Contacted</p>
                          <p className="font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            {selectedContact.last_contacted ? formatDate(selectedContact.last_contacted) : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Related Items */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Related Items</h3>
                      <div className="space-y-3">
                        {/* Activities */}
                        <div className="border rounded-lg overflow-hidden">
                          <button 
                            onClick={() => setExpandedSections({ ...expandedSections, activities: !expandedSections.activities })}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight className={`h-4 w-4 text-gray-400 transform transition-transform ${expandedSections.activities ? 'rotate-90' : ''}`} />
                              <Activity className="h-5 w-5 text-gray-400" />
                              <div className="text-left">
                                <p className="font-medium">Activities</p>
                                <p className="text-sm text-gray-500">View all activities</p>
                              </div>
                            </div>
                            <span className="bg-white px-2 py-1 rounded text-sm">0</span>
                          </button>
                          {expandedSections.activities && (
                            <div className="p-4 bg-white border-t">
                              <p className="text-sm text-gray-500">No activities found for this contact.</p>
                            </div>
                          )}
                        </div>

                        {/* Quotes */}
                        <div className="border rounded-lg overflow-hidden">
                          <button 
                            onClick={() => setExpandedSections({ ...expandedSections, quotes: !expandedSections.quotes })}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight className={`h-4 w-4 text-gray-400 transform transition-transform ${expandedSections.quotes ? 'rotate-90' : ''}`} />
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div className="text-left">
                                <p className="font-medium">Quotes</p>
                                <p className="text-sm text-gray-500">View all quotes</p>
                              </div>
                            </div>
                            <span className="bg-white px-2 py-1 rounded text-sm">0</span>
                          </button>
                          {expandedSections.quotes && (
                            <div className="p-4 bg-white border-t">
                              <p className="text-sm text-gray-500">No quotes found for this contact.</p>
                            </div>
                          )}
                        </div>

                        {/* Orders */}
                        <div className="border rounded-lg overflow-hidden">
                          <button 
                            onClick={() => setExpandedSections({ ...expandedSections, orders: !expandedSections.orders })}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight className={`h-4 w-4 text-gray-400 transform transition-transform ${expandedSections.orders ? 'rotate-90' : ''}`} />
                              <DollarSign className="h-5 w-5 text-gray-400" />
                              <div className="text-left">
                                <p className="font-medium">Orders</p>
                                <p className="text-sm text-gray-500">View all orders</p>
                              </div>
                            </div>
                            <span className="bg-white px-2 py-1 rounded text-sm">0</span>
                          </button>
                          {expandedSections.orders && (
                            <div className="p-4 bg-white border-t">
                              <p className="text-sm text-gray-500">No orders found for this contact.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedContact.tags && selectedContact.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedContact.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel Footer */}
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex gap-3 flex-wrap">
                    <Link
                      href={`/quotes/new?contact=${encodeURIComponent(selectedContact.email)}&company=${encodeURIComponent(selectedContact.company || '')}`}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-center min-w-[150px]"
                    >
                      <FileText className="h-4 w-4" />
                      New Quote Request
                    </Link>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            handleEditContact(selectedContact);
                            setShowDetailPanel(false);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 min-w-[120px]"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteContact(selectedContact.id);
                            setShowDetailPanel(false);
                          }}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    )}
                    <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 min-w-[120px]">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </button>
                    <button 
                      onClick={() => {
                        setShowPortalInviteModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 min-w-[140px]"
                    >
                      <Key className="h-4 w-4" />
                      Invite to Portal
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portal Invitation Modal */}
        {showPortalInviteModal && selectedContact && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPortalInviteModal(false)} />
              
              <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="h-6 w-6 text-green-600" />
                    Send B2B Portal Invitation
                  </h2>
                  <button
                    onClick={() => setShowPortalInviteModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Sending invitation to: <strong>{selectedContact.first_name} {selectedContact.last_name}</strong> ({selectedContact.email})
                  </p>
                  {selectedContact.company && (
                    <p className="text-sm text-blue-800 mt-1">
                      Company: <strong>{selectedContact.company}</strong>
                    </p>
                  )}
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPortalInvite();
                }}>
                  <div className="space-y-4">
                    {/* Access Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Level
                      </label>
                      <select
                        value={inviteFormData.accessLevel}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, accessLevel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      >
                        <option value="standard">Standard - Full B2B Access</option>
                        <option value="restricted">Restricted - Limited Access</option>
                        <option value="premium">Premium - Enhanced Features</option>
                      </select>
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Portal Permissions
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canViewPricing}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canViewPricing: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can view custom pricing</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canPlaceOrders}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canPlaceOrders: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can place orders</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canViewInvoices}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canViewInvoices: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can view invoices</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canViewStatements}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canViewStatements: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can view statements</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canRequestQuotes}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canRequestQuotes: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can request quotes</span>
                        </label>
                      </div>
                    </div>

                    {/* Spending Limit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spending Limit (Optional)
                      </label>
                      <input
                        type="number"
                        value={inviteFormData.spendingLimit}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, spendingLimit: e.target.value })}
                        placeholder="Leave empty for no limit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        min="0"
                        step="100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set a maximum order value this user can place</p>
                    </div>

                    {/* Custom Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Personal Message (Optional)
                      </label>
                      <textarea
                        value={inviteFormData.customMessage}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, customMessage: e.target.value })}
                        rows={3}
                        placeholder="Add a personal message to the invitation email..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowPortalInviteModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      disabled={sendingInvite}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      disabled={sendingInvite}
                    >
                      {sendingInvite ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}