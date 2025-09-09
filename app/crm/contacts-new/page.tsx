'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Mail, Phone, 
  User, Users, Calendar, Tag, Filter, Download,
  Upload, Send, CheckCircle, AlertCircle, Loader2,
  Building2, Briefcase, MapPin, Globe, MoreVertical
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

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

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
  ];

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchTerm, stageFilter, statusFilter]);

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

  const filterContacts = () => {
    let filtered = [...contacts];
    
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter(contact => contact.lifecycle_stage === stageFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contact => contact.lead_status === statusFilter);
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600">Manage your contact database</p>
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
                <p className="text-sm text-gray-500">New Leads</p>
                <p className="text-xl font-semibold">
                  {contacts.filter(c => c.lead_status === 'new').length}
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
                Add Contact
              </button>
            </div>
          </div>
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
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                      {leadStatuses.find(s => s.value === contact.lead_status)?.label || 'New'}
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
                        <div className="flex items-center gap-1 text-gray-500">
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
                        title="Send email"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
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
      </div>
    </AdminLayout>
  );
}