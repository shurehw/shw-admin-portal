'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CRMLayout from '@/components/CRMLayout';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, Plus, Filter, Download, Upload, Mail, Phone, 
  Building2, MapPin, Calendar, Edit2, Trash2, Eye,
  Star, StarOff, MoreVertical, Tag, Users, DollarSign,
  X, Globe, TrendingUp, Building, Briefcase, Clock,
  Activity, FileText, Package, UserCheck, ChevronRight,
  Key, Shield, Send, Loader2
} from 'lucide-react';

interface Company {
  id?: string;
  name: string;
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  revenue?: number;
  status: 'prospect' | 'customer' | 'partner' | 'inactive';
  source: string;
  tags: string[];
  notes?: string;
  owner_id?: string;
  contactCount?: number;
  dealCount?: number;
  totalValue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function CompaniesPage() {
  const { user, isAdmin } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSize, setFilterSize] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterRevenueMin, setFilterRevenueMin] = useState('');
  const [filterRevenueMax, setFilterRevenueMax] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
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

  const [formData, setFormData] = useState<Company>({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    size: 'small',
    status: 'prospect',
    source: '',
    tags: [],
    owner_id: ''
  });

  useEffect(() => {
    loadCompanies();
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

  const loadCompanies = async () => {
    try {
      // Try to load from API
      const response = await fetch('/api/crm/companies');
      const data = await response.json();
      
      if (data.companies) {
        setCompanies(data.companies);
      } else {
        // Use mock data as fallback
        setCompanies(getMockCompanies());
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      // Use mock data as fallback
      setCompanies(getMockCompanies());
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

  const getMockCompanies = (): Company[] => [
    {
      id: '1',
      name: 'Marriott International',
      industry: 'Hospitality',
      website: 'https://marriott.com',
      phone: '(301) 380-3000',
      email: 'corporate@marriott.com',
      size: 'enterprise',
      revenue: 20000000000,
      status: 'customer',
      source: 'Direct Sales',
      tags: ['hospitality', 'hotels', 'key-client'],
      contactCount: 15,
      dealCount: 8,
      totalValue: 2500000
    },
    {
      id: '2',
      name: 'Hilton Hotels',
      industry: 'Hospitality',
      website: 'https://hilton.com',
      phone: '(703) 883-1000',
      email: 'info@hilton.com',
      size: 'enterprise',
      revenue: 8000000000,
      status: 'customer',
      source: 'Trade Show',
      tags: ['hospitality', 'hotels'],
      contactCount: 12,
      dealCount: 5,
      totalValue: 1800000
    },
    {
      id: '3',
      name: 'Local Restaurant Group',
      industry: 'Food & Beverage',
      phone: '(555) 123-4567',
      email: 'orders@localrestaurants.com',
      size: 'medium',
      revenue: 50000000,
      status: 'customer',
      source: 'Referral',
      tags: ['restaurants', 'local'],
      contactCount: 5,
      dealCount: 3,
      totalValue: 125000
    },
    {
      id: '4',
      name: 'Boutique Hotel Chain',
      industry: 'Hospitality',
      website: 'https://boutiquehotels.com',
      email: 'info@boutiquehotels.com',
      size: 'medium',
      revenue: 75000000,
      status: 'prospect',
      source: 'Website',
      tags: ['hospitality', 'boutique'],
      contactCount: 3,
      dealCount: 1,
      totalValue: 50000
    }
  ];

  const handleSendPortalInvite = async () => {
    if (!selectedCompany) return;
    
    // For companies, we'll use the company email as the primary contact
    // In a real implementation, you'd select a specific contact from the company
    setSendingInvite(true);
    try {
      const response = await fetch('/api/b2b/portal-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompany.id,
          email: selectedCompany.email || 'info@' + (selectedCompany.website?.replace(/^https?:\/\//, '') || 'company.com'),
          firstName: 'Team',
          lastName: selectedCompany.name,
          company: selectedCompany.name,
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
        alert(`Portal invitation sent to ${selectedCompany.name}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const companyData = {
      ...formData,
      updatedAt: new Date()
    };

    if (editingCompany?.id) {
      // Update existing company
      setCompanies(companies.map(c => 
        c.id === editingCompany.id ? { ...companyData, id: editingCompany.id } : c
      ));
    } else {
      // Add new company
      const newCompany = {
        ...companyData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      setCompanies([...companies, newCompany]);
    }
    
    resetForm();
  };

  const handleDelete = (companyId: string) => {
    if (!isAdmin) {
      alert('Only administrators can delete companies');
      return;
    }
    if (confirm('Are you sure you want to delete this company?')) {
      setCompanies(companies.filter(c => c.id !== companyId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry: '',
      website: '',
      phone: '',
      email: '',
      size: 'small',
      status: 'prospect',
      source: '',
      tags: [],
      owner_id: ''
    });
    setEditingCompany(null);
    setShowForm(false);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData(company);
    setShowForm(true);
  };

  // Filter companies
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = searchTerm ? 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.phone?.includes(searchTerm)
      : true;
    const matchesIndustry = !filterIndustry || company.industry === filterIndustry;
    const matchesStatus = !filterStatus || company.status === filterStatus;
    const matchesSize = !filterSize || company.size === filterSize;
    const matchesSource = !filterSource || company.source === filterSource;
    
    // Revenue filtering
    const revenue = company.revenue || 0;
    const matchesRevenueMin = !filterRevenueMin || revenue >= parseFloat(filterRevenueMin);
    const matchesRevenueMax = !filterRevenueMax || revenue <= parseFloat(filterRevenueMax);
    
    // Date filtering
    const companyDate = company.createdAt ? new Date(company.createdAt) : new Date();
    const matchesDateFrom = !filterDateFrom || companyDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || companyDate <= new Date(filterDateTo);
    
    return matchesSearch && matchesIndustry && matchesStatus && matchesSize && 
           matchesSource && matchesRevenueMin && matchesRevenueMax && 
           matchesDateFrom && matchesDateTo;
  });

  // Clear specific filter
  const clearFilter = (filterType: string) => {
    switch(filterType) {
      case 'industry': setFilterIndustry(''); break;
      case 'status': setFilterStatus(''); break;
      case 'size': setFilterSize(''); break;
      case 'source': setFilterSource(''); break;
      case 'revenue': 
        setFilterRevenueMin('');
        setFilterRevenueMax('');
        break;
      case 'date':
        setFilterDateFrom('');
        setFilterDateTo('');
        break;
      case 'all':
        setFilterIndustry('');
        setFilterStatus('');
        setFilterSize('');
        setFilterSource('');
        setFilterRevenueMin('');
        setFilterRevenueMax('');
        setFilterDateFrom('');
        setFilterDateTo('');
        setSearchTerm('');
        break;
    }
  };

  // Check if any filters are active
  const hasActiveFilters = filterIndustry || filterStatus || filterSize || filterSource || 
                          filterRevenueMin || filterRevenueMax || filterDateFrom || filterDateTo;

  // Handle bulk actions
  const handleBulkDelete = () => {
    if (!isAdmin) {
      alert('Only administrators can delete companies');
      return;
    }
    if (selectedCompanies.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedCompanies.length} companies?`)) {
      setCompanies(companies.filter(c => !selectedCompanies.includes(c.id || '')));
      setSelectedCompanies([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map(c => c.id || '').filter(id => id));
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'prospect': 'bg-yellow-100 text-yellow-800',
      'customer': 'bg-green-100 text-green-800',
      'partner': 'bg-blue-100 text-blue-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      'startup': 'bg-purple-100 text-purple-800',
      'small': 'bg-blue-100 text-blue-800',
      'medium': 'bg-orange-100 text-orange-800',
      'large': 'bg-red-100 text-red-800',
      'enterprise': 'bg-indigo-100 text-indigo-800'
    };
    return colors[size] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading companies...</div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">
              {filteredCompanies.length} of {companies.length} companies
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          {visibilityScope && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg mr-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{visibilityScope}</span>
            </div>
          )}
          <div className="flex gap-2">
            {selectedCompanies.length > 0 && isAdmin && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete ({selectedCompanies.length})
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Add Company
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Filter size={18} />
                Filters
              </h3>
              {hasActiveFilters && (
                <button
                  onClick={() => clearFilter('all')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all filters
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="col-span-full lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search companies, emails, websites, phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              
              {/* Industry Filter */}
              <select
                value={filterIndustry}
                onChange={(e) => setFilterIndustry(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Industries</option>
                <option value="Hospitality">Hospitality</option>
                <option value="Food & Beverage">Food & Beverage</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Other">Other</option>
              </select>
              
              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Status</option>
                <option value="prospect">Prospect</option>
                <option value="customer">Customer</option>
                <option value="partner">Partner</option>
                <option value="inactive">Inactive</option>
              </select>
              
              {/* Size Filter */}
              <select
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Sizes</option>
                <option value="startup">Startup (1-10)</option>
                <option value="small">Small (11-50)</option>
                <option value="medium">Medium (51-200)</option>
                <option value="large">Large (201-1000)</option>
                <option value="enterprise">Enterprise (1000+)</option>
              </select>
              
              {/* Source Filter */}
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All Sources</option>
                <option value="Website">Website</option>
                <option value="Referral">Referral</option>
                <option value="Direct Sales">Direct Sales</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Cold Outreach">Cold Outreach</option>
                <option value="Partner">Partner</option>
                <option value="Social Media">Social Media</option>
              </select>
              
              {/* Revenue Range */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min Revenue"
                  value={filterRevenueMin}
                  onChange={(e) => setFilterRevenueMin(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                />
                <input
                  type="number"
                  placeholder="Max Revenue"
                  value={filterRevenueMax}
                  onChange={(e) => setFilterRevenueMax(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                />
              </div>
              
              {/* Date Range */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm w-full"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="px-4 py-3 bg-gray-50 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {filterIndustry && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  <Briefcase size={12} />
                  {filterIndustry}
                  <button onClick={() => clearFilter('industry')} className="hover:text-blue-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filterStatus && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {filterStatus}
                  <button onClick={() => clearFilter('status')} className="hover:text-green-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filterSize && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  <Building size={12} />
                  {filterSize}
                  <button onClick={() => clearFilter('size')} className="hover:text-purple-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {filterSource && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  {filterSource}
                  <button onClick={() => clearFilter('source')} className="hover:text-orange-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {(filterRevenueMin || filterRevenueMax) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  <DollarSign size={12} />
                  ${filterRevenueMin || '0'} - ${filterRevenueMax || '∞'}
                  <button onClick={() => clearFilter('revenue')} className="hover:text-yellow-900">
                    <X size={12} />
                  </button>
                </span>
              )}
              {(filterDateFrom || filterDateTo) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs">
                  <Calendar size={12} />
                  {filterDateFrom || 'Start'} to {filterDateTo || 'End'}
                  <button onClick={() => clearFilter('date')} className="hover:text-indigo-900">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Company Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
              <h2 className="text-xl font-semibold mb-4">
                {editingCompany ? 'Edit Company' : 'Add New Company'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Industry</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select Industry</option>
                      <option value="Hospitality">Hospitality</option>
                      <option value="Food & Beverage">Food & Beverage</option>
                      <option value="Technology">Technology</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Finance">Finance</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Size</label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value as any })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="startup">Startup (1-10)</option>
                      <option value="small">Small (11-50)</option>
                      <option value="medium">Medium (51-200)</option>
                      <option value="large">Large (201-1000)</option>
                      <option value="enterprise">Enterprise (1000+)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                      <option value="partner">Partner</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Source</label>
                    <input
                      type="text"
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      placeholder="e.g., Website, Referral, Trade Show"
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Owner</label>
                    <select
                      value={formData.owner_id || ''}
                      onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                      className="w-full border rounded px-3 py-2"
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
                    <label className="block text-sm font-medium mb-1">Annual Revenue</label>
                    <input
                      type="number"
                      value={formData.revenue || ''}
                      onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || undefined })}
                      className="w-full border rounded px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {editingCompany ? 'Update Company' : 'Add Company'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr 
                  key={company.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedCompany(company);
                    setShowDetailPanel(true);
                  }}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedCompanies.includes(company.id || '')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCompanies([...selectedCompanies, company.id || '']);
                        } else {
                          setSelectedCompanies(selectedCompanies.filter(id => id !== company.id));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        {company.website && (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                            {company.website}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{company.industry}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSizeColor(company.size)}`}>
                      {company.size}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      {company.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline">
                            {company.email}
                          </a>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status)}`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {company.revenue ? `$${(company.revenue / 1000000).toFixed(1)}M` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        className="text-gray-600 hover:text-gray-900"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleEdit(company)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => company.id && handleDelete(company.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCompanies.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No companies found. Add your first company to get started.
            </div>
          )}
        </div>
        {/* Company Detail Panel */}
        {showDetailPanel && selectedCompany && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowDetailPanel(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
              <div className="h-full flex flex-col">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">
                          {selectedCompany.name}
                        </h2>
                        <p className="text-sm text-gray-500">{selectedCompany.industry}</p>
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
                    {/* Company Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Industry</p>
                          <p className="font-medium">{selectedCompany.industry || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Size</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSizeColor(selectedCompany.size)}`}>
                            {selectedCompany.size}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Website</p>
                          <p className="font-medium flex items-center gap-2">
                            {selectedCompany.website ? (
                              <>
                                <Globe className="h-4 w-4 text-gray-400" />
                                <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {selectedCompany.website}
                                </a>
                              </>
                            ) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium flex items-center gap-2">
                            {selectedCompany.phone ? (
                              <>
                                <Phone className="h-4 w-4 text-gray-400" />
                                {selectedCompany.phone}
                              </>
                            ) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium flex items-center gap-2">
                            {selectedCompany.email ? (
                              <>
                                <Mail className="h-4 w-4 text-gray-400" />
                                <a href={`mailto:${selectedCompany.email}`} className="text-blue-600 hover:underline">
                                  {selectedCompany.email}
                                </a>
                              </>
                            ) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {[selectedCompany.address?.city, selectedCompany.address?.state, selectedCompany.address?.country].filter(Boolean).join(', ') || '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Business Metrics */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Business Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedCompany.status)}`}>
                            {selectedCompany.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Annual Revenue</p>
                          <p className="font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            {selectedCompany.revenue ? `$${(selectedCompany.revenue / 1000000).toFixed(1)}M` : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Source</p>
                          <p className="font-medium">{selectedCompany.source || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created Date</p>
                          <p className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {selectedCompany.createdAt ? new Date(selectedCompany.createdAt).toLocaleDateString() : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Related Items */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Related Items</h3>
                      <div className="space-y-3">
                        {/* Contacts */}
                        <div className="border rounded-lg overflow-hidden">
                          <button 
                            onClick={() => setExpandedSections({ ...expandedSections, contacts: !expandedSections.contacts })}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight className={`h-4 w-4 text-gray-400 transform transition-transform ${expandedSections.contacts ? 'rotate-90' : ''}`} />
                              <Users className="h-5 w-5 text-gray-400" />
                              <div className="text-left">
                                <p className="font-medium">Contacts</p>
                                <p className="text-sm text-gray-500">View all contacts</p>
                              </div>
                            </div>
                            <span className="bg-white px-2 py-1 rounded text-sm">{selectedCompany.contactCount || 0}</span>
                          </button>
                          {expandedSections.contacts && (
                            <div className="p-4 bg-white border-t">
                              <p className="text-sm text-gray-500">No contacts found for this company.</p>
                            </div>
                          )}
                        </div>

                        {/* Deals */}
                        <div className="border rounded-lg overflow-hidden">
                          <button 
                            onClick={() => setExpandedSections({ ...expandedSections, deals: !expandedSections.deals })}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <ChevronRight className={`h-4 w-4 text-gray-400 transform transition-transform ${expandedSections.deals ? 'rotate-90' : ''}`} />
                              <UserCheck className="h-5 w-5 text-gray-400" />
                              <div className="text-left">
                                <p className="font-medium">Deals</p>
                                <p className="text-sm text-gray-500">View all deals</p>
                              </div>
                            </div>
                            <span className="bg-white px-2 py-1 rounded text-sm">{selectedCompany.dealCount || 0}</span>
                          </button>
                          {expandedSections.deals && (
                            <div className="p-4 bg-white border-t">
                              <p className="text-sm text-gray-500">No deals found for this company.</p>
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
                              <p className="text-sm text-gray-500">No quotes found for this company.</p>
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
                              <Package className="h-5 w-5 text-gray-400" />
                              <div className="text-left">
                                <p className="font-medium">Orders</p>
                                <p className="text-sm text-gray-500">View all orders</p>
                              </div>
                            </div>
                            <span className="bg-white px-2 py-1 rounded text-sm">0</span>
                          </button>
                          {expandedSections.orders && (
                            <div className="p-4 bg-white border-t">
                              <p className="text-sm text-gray-500">No orders found for this company.</p>
                            </div>
                          )}
                        </div>

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
                              <p className="text-sm text-gray-500">No activities found for this company.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedCompany.tags && selectedCompany.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompany.tags.map((tag, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedCompany.notes && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
                        <p className="text-gray-600">{selectedCompany.notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Panel Footer */}
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="flex gap-3 flex-wrap">
                    <Link
                      href={`/quotes/new?company=${encodeURIComponent(selectedCompany.name)}`}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 text-center min-w-[150px]"
                    >
                      <FileText className="h-4 w-4" />
                      New Quote Request
                    </Link>
                    <button 
                      onClick={() => {
                        setShowPortalInviteModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 min-w-[140px]"
                    >
                      <Key className="h-4 w-4" />
                      Invite to Portal
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            handleEdit(selectedCompany);
                            setShowDetailPanel(false);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 min-w-[120px]"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (selectedCompany.id) {
                              handleDelete(selectedCompany.id);
                              setShowDetailPanel(false);
                            }
                          }}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </>
                    )}
                    <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 min-w-[140px]">
                      <Plus className="h-4 w-4" />
                      Add Contact
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portal Invitation Modal */}
        {showPortalInviteModal && selectedCompany && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPortalInviteModal(false)} />
              
              <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="h-6 w-6 text-purple-600" />
                    Send B2B Portal Invitation
                  </h2>
                  <button
                    onClick={() => setShowPortalInviteModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">
                    Sending portal invitation for: <strong>{selectedCompany.name}</strong>
                  </p>
                  <p className="text-sm text-purple-800 mt-1">
                    Primary email: <strong>{selectedCompany.email || 'No email set - please add one'}</strong>
                  </p>
                  {!selectedCompany.email && (
                    <p className="text-sm text-orange-600 mt-2">
                      ⚠️ Please add a primary email address for this company before sending the invitation.
                    </p>
                  )}
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!selectedCompany.email) {
                    alert('Please add an email address for this company first');
                    return;
                  }
                  handleSendPortalInvite();
                }}>
                  <div className="space-y-4">
                    {/* Access Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Access Level
                      </label>
                      <select
                        value={inviteFormData.accessLevel}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, accessLevel: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      >
                        <option value="standard">Standard - Full B2B Access</option>
                        <option value="restricted">Restricted - Limited Access</option>
                        <option value="premium">Premium - Enhanced Features & Support</option>
                      </select>
                    </div>

                    {/* Permissions */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Portal Permissions
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canViewPricing}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canViewPricing: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can view custom B2B pricing</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canPlaceOrders}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canPlaceOrders: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can place orders online</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canViewInvoices}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canViewInvoices: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can view and download invoices</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canViewStatements}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canViewStatements: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can view account statements</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={inviteFormData.canRequestQuotes}
                            onChange={(e) => setInviteFormData({ ...inviteFormData, canRequestQuotes: e.target.checked })}
                            className="mr-2"
                          />
                          <span className="text-sm">Can request custom quotes</span>
                        </label>
                      </div>
                    </div>

                    {/* Company-wide Spending Limit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company-wide Spending Limit (Optional)
                      </label>
                      <input
                        type="number"
                        value={inviteFormData.spendingLimit}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, spendingLimit: e.target.value })}
                        placeholder="Leave empty for no limit"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                        min="0"
                        step="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Set a maximum monthly order value for this company</p>
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700">
                        <strong>Note:</strong> This invitation will be sent to the company's primary email address. 
                        The recipient can then invite additional users from their company to access the portal.
                      </p>
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
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      disabled={sendingInvite || !selectedCompany.email}
                    >
                      {sendingInvite ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Company Invitation
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
    </CRMLayout>
  );
}