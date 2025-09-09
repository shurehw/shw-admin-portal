'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Globe, Phone, 
  Building2, Users, DollarSign, MapPin, Filter, Download,
  Upload, Mail, CheckCircle, AlertCircle, Loader2,
  TrendingUp, Calendar, Hash, Briefcase, MoreVertical
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  revenue?: number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  website?: string;
  lifecycle_stage?: string;
  owner?: string;
  created_at: string;
  employees?: number;
  contacts_count?: number;
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '',
    revenue: 0,
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    lifecycle_stage: 'lead',
    employees: 0,
  });

  // Lifecycle stages
  const lifecycleStages = [
    { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
    { value: 'opportunity', label: 'Opportunity', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'customer', label: 'Customer', color: 'bg-green-100 text-green-800' },
    { value: 'churned', label: 'Churned', color: 'bg-red-100 text-red-800' },
  ];

  const industries = [
    { value: 'technology', label: 'Technology' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'finance', label: 'Finance' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'education', label: 'Education' },
    { value: 'other', label: 'Other' },
  ];

  const companySizes = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '501-1000', label: '501-1000 employees' },
    { value: '1000+', label: '1000+ employees' },
  ];

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [companies, searchTerm, stageFilter, industryFilter]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];
    
    if (searchTerm) {
      filtered = filtered.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter(company => company.lifecycle_stage === stageFilter);
    }

    if (industryFilter !== 'all') {
      filtered = filtered.filter(company => company.industry === industryFilter);
    }

    setFilteredCompanies(filtered);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/crm/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newCompany = await response.json();
        setCompanies([newCompany, ...companies]);
        setShowAddModal(false);
        resetForm();
        alert('Company added successfully');
      } else {
        alert('Error adding company');
      }
    } catch (error) {
      alert('Error adding company');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/crm/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompanies(companies.map(c => c.id === selectedCompany.id ? updatedCompany : c));
        setShowEditModal(false);
        setSelectedCompany(null);
        resetForm();
        alert('Company updated successfully');
      } else {
        alert('Error updating company');
      }
    } catch (error) {
      alert('Error updating company');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
      const response = await fetch(`/api/crm/companies/${companyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCompanies(companies.filter(c => c.id !== companyId));
        alert('Company deleted successfully');
      } else {
        alert('Error deleting company');
      }
    } catch (error) {
      alert('Error deleting company');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      industry: '',
      size: '',
      revenue: 0,
      phone: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA',
      lifecycle_stage: 'lead',
      employees: 0,
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

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600">Manage your company database</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <Building2 className="h-10 w-10 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Companies</p>
                <p className="text-xl font-semibold">{companies.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Customers</p>
                <p className="text-xl font-semibold">
                  {companies.filter(c => c.lifecycle_stage === 'customer').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <DollarSign className="h-10 w-10 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(companies.reduce((sum, c) => sum + (c.revenue || 0), 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <TrendingUp className="h-10 w-10 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Opportunities</p>
                <p className="text-xl font-semibold">
                  {companies.filter(c => c.lifecycle_stage === 'opportunity').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search companies..."
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
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Industries</option>
                {industries.map(industry => (
                  <option key={industry.value} value={industry.value}>{industry.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Upload className="h-5 w-5" />
                Import
              </button>
              <button
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                Export
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                Add Company
              </button>
            </div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{company.name}</p>
                        <p className="text-sm text-gray-500">{company.domain || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {industries.find(i => i.value === company.industry)?.label || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(company.lifecycle_stage)}`}>
                      {lifecycleStages.find(s => s.value === company.lifecycle_stage)?.label || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(company.revenue)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{company.employees || 0}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {company.city && company.state ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {company.city}, {company.state}
                        </div>
                      ) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{company.contacts_count || 0}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setFormData({
                            name: company.name,
                            domain: company.domain || '',
                            industry: company.industry || '',
                            size: company.size || '',
                            revenue: company.revenue || 0,
                            phone: company.phone || '',
                            address: company.address || '',
                            city: company.city || '',
                            state: company.state || '',
                            zip: company.zip || '',
                            country: company.country || 'USA',
                            lifecycle_stage: company.lifecycle_stage || 'lead',
                            employees: company.employees || 0,
                          });
                          setShowEditModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        className="text-blue-600 hover:text-blue-900"
                        title="View website"
                        onClick={() => {
                          if (company.website || company.domain) {
                            window.open(
                              company.website || `https://${company.domain}`,
                              '_blank'
                            );
                          }
                        }}
                      >
                        <Globe className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Company Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {showEditModal ? 'Edit Company' : 'Add New Company'}
              </h2>
              <form onSubmit={showEditModal ? handleEditCompany : handleAddCompany}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Website/Domain
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Industry
                    </label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Industry</option>
                      {industries.map(industry => (
                        <option key={industry.value} value={industry.value}>{industry.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Size
                    </label>
                    <select
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Size</option>
                      {companySizes.map(size => (
                        <option key={size.value} value={size.value}>{size.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Annual Revenue
                    </label>
                    <input
                      type="number"
                      value={formData.revenue}
                      onChange={(e) => setFormData({ ...formData, revenue: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      placeholder="0"
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
                      Number of Employees
                    </label>
                    <input
                      type="number"
                      value={formData.employees}
                      onChange={(e) => setFormData({ ...formData, employees: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                    />
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
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
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
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedCompany(null);
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
                    {saving ? 'Saving...' : (showEditModal ? 'Update' : 'Add')} Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}