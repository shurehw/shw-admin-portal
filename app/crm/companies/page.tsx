'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { 
  Search, Plus, Filter, Download, Upload, Mail, Phone, 
  Building2, MapPin, Calendar, Edit2, Trash2, Eye,
  Star, StarOff, MoreVertical, Tag, Users, DollarSign
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
  contactCount?: number;
  dealCount?: number;
  totalValue?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [formData, setFormData] = useState<Company>({
    name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    size: 'small',
    status: 'prospect',
    source: '',
    tags: []
  });

  useEffect(() => {
    loadCompanies();
  }, []);

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
      tags: []
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
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !filterIndustry || company.industry === filterIndustry;
    const matchesStatus = !filterStatus || company.status === filterStatus;
    return matchesSearch && matchesIndustry && matchesStatus;
  });

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">Manage your company relationships</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Company
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Industries</option>
              <option value="Hospitality">Hospitality</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Finance">Finance</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Retail">Retail</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
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
                <tr key={company.id} className="hover:bg-gray-50">
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
      </div>
    </CRMLayout>
  );
}