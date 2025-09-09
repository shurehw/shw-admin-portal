'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Mail, Phone, Building2,
  User, Users, Calendar, MapPin, Globe, Filter,
  MoreVertical, Download, Upload, Send, CheckCircle,
  XCircle, AlertCircle, Loader2, Hash, DollarSign
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';

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
  created_at: string;
  last_contacted?: string;
  tags?: string[];
}

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
  country?: string;
  website?: string;
  lifecycle_stage?: string;
  owner?: string;
  created_at: string;
  employees?: number;
  contacts_count?: number;
}

export default function ContactsCompaniesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Contact | Company | null>(null);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [contacts, companies, searchTerm, stageFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load contacts
      const contactsResponse = await fetch('/api/crm/contacts');
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);
      }

      // Load companies
      const companiesResponse = await fetch('/api/crm/companies');
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (activeTab === 'contacts') {
      let filtered = [...contacts];
      
      if (searchTerm) {
        filtered = filtered.filter(contact =>
          contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (stageFilter !== 'all') {
        filtered = filtered.filter(contact => contact.lifecycle_stage === stageFilter);
      }

      setFilteredContacts(filtered);
    } else {
      let filtered = [...companies];
      
      if (searchTerm) {
        filtered = filtered.filter(company =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.industry?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (stageFilter !== 'all') {
        filtered = filtered.filter(company => company.lifecycle_stage === stageFilter);
      }

      setFilteredCompanies(filtered);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">CRM Database</h1>
          <p className="text-gray-600">Manage your contacts and companies</p>
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
              <Building2 className="h-10 w-10 text-green-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Total Companies</p>
                <p className="text-xl font-semibold">{companies.length}</p>
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
              <DollarSign className="h-10 w-10 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm text-gray-500">Pipeline Value</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(companies.reduce((sum, c) => sum + (c.revenue || 0), 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'contacts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contacts ({contacts.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('companies')}
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'companies'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Companies ({companies.length})
                </div>
              </button>
            </nav>
          </div>

          {/* Filters Bar */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
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
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Filter className="h-4 w-4" />
                  More Filters
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Upload className="h-4 w-4" />
                  Import
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add {activeTab === 'contacts' ? 'Contact' : 'Company'}
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {activeTab === 'contacts' ? (
              // Contacts Table
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
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
                        <div className="text-sm text-gray-900">
                          {contact.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.mobile && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.mobile}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.last_contacted ? formatDate(contact.last_contacted) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(contact);
                              setShowEditModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="Send email"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <button
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
            ) : (
              // Companies Table
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
                      Contacts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
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
                        <p className="text-sm text-gray-900">{company.industry || '-'}</p>
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
                          <span className="text-sm text-gray-900">{company.contacts_count || 0}</span>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedItem(company);
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
                          >
                            <Globe className="h-4 w-4" />
                          </button>
                          <button
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
            )}
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing {activeTab === 'contacts' ? filteredContacts.length : filteredCompanies.length} of{' '}
                {activeTab === 'contacts' ? contacts.length : companies.length} results
              </p>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 border rounded hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border rounded hover:bg-gray-50">Next</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}