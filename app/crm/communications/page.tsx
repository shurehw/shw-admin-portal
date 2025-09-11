'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Mail, Phone, MessageSquare, 
  Video, FileText, Send, Clock, CheckCircle2, 
  Edit2, Trash2, Eye, Download, User, Building2,
  Paperclip, Reply, Forward
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

interface Communication {
  id: string;
  type: 'email' | 'call' | 'sms' | 'meeting' | 'note' | 'video_call';
  direction: 'inbound' | 'outbound';
  subject: string;
  content: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company: string;
  dealName?: string;
  status: 'draft' | 'sent' | 'received' | 'scheduled';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  attachments?: string[];
  scheduledDate?: string;
  sentDate?: string;
  readDate?: string;
  responseRequired: boolean;
  responseReceived: boolean;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
}

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [filteredCommunications, setFilteredCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [formData, setFormData] = useState({
    type: 'email' as Communication['type'],
    direction: 'outbound' as Communication['direction'],
    subject: '',
    content: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    company: '',
    dealName: '',
    status: 'draft' as Communication['status'],
    priority: 'medium' as Communication['priority'],
    tags: '',
    scheduledDate: '',
    responseRequired: false,
    createdBy: 'Sarah Chen'
  });

  const communicationTypes = [
    { value: 'email', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-800' },
    { value: 'call', label: 'Phone Call', icon: Phone, color: 'bg-green-100 text-green-800' },
    { value: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
    { value: 'meeting', label: 'Meeting', icon: User, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'note', label: 'Note', icon: FileText, color: 'bg-gray-100 text-gray-800' },
    { value: 'video_call', label: 'Video Call', icon: Video, color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
    { value: 'received', label: 'Received', color: 'bg-green-100 text-green-800' },
    { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
  ];

  const directions = [
    { value: 'inbound', label: 'Inbound' },
    { value: 'outbound', label: 'Outbound' }
  ];

  const users = ['Sarah Chen', 'Mike Johnson', 'Tom Davis', 'Lisa Wang', 'Alex Rodriguez'];

  useEffect(() => {
    loadCommunications();
  }, []);

  useEffect(() => {
    filterCommunications();
  }, [communications, searchTerm, typeFilter, statusFilter, directionFilter]);

  const loadCommunications = async () => {
    try {
      const communicationsQuery = query(
        collection(db, 'communications'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(communicationsQuery);
      const communicationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Communication[];
      setCommunications(communicationsData);
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCommunications = () => {
    let filtered = communications;

    if (searchTerm) {
      filtered = filtered.filter(comm => 
        comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comm.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(comm => comm.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(comm => comm.status === statusFilter);
    }

    if (directionFilter !== 'all') {
      filtered = filtered.filter(comm => comm.direction === directionFilter);
    }

    setFilteredCommunications(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const communicationData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        sentDate: formData.status === 'sent' ? new Date().toISOString() : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (selectedCommunication) {
        await updateDoc(doc(db, 'communications', selectedCommunication.id), {
          ...communicationData,
          createdAt: selectedCommunication.createdAt,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'communications'), communicationData);
      }

      resetForm();
      loadCommunications();
    } catch (error) {
      console.error('Error saving communication:', error);
    }
  };

  const handleEdit = (communication: Communication) => {
    setSelectedCommunication(communication);
    setFormData({
      type: communication.type,
      direction: communication.direction,
      subject: communication.subject,
      content: communication.content,
      contactName: communication.contactName,
      contactEmail: communication.contactEmail,
      contactPhone: communication.contactPhone || '',
      company: communication.company,
      dealName: communication.dealName || '',
      status: communication.status,
      priority: communication.priority,
      tags: communication.tags.join(', '),
      scheduledDate: communication.scheduledDate || '',
      responseRequired: communication.responseRequired,
      createdBy: communication.createdBy
    });
    setShowEditModal(true);
  };

  const handleView = (communication: Communication) => {
    setSelectedCommunication(communication);
    setShowViewModal(true);
  };

  const handleDelete = async (communicationId: string) => {
    if (confirm('Are you sure you want to delete this communication?')) {
      try {
        await deleteDoc(doc(db, 'communications', communicationId));
        loadCommunications();
      } catch (error) {
        console.error('Error deleting communication:', error);
      }
    }
  };

  const markAsRead = async (communicationId: string) => {
    try {
      await updateDoc(doc(db, 'communications', communicationId), {
        readDate: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
      loadCommunications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'email',
      direction: 'outbound',
      subject: '',
      content: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      company: '',
      dealName: '',
      status: 'draft',
      priority: 'medium',
      tags: '',
      scheduledDate: '',
      responseRequired: false,
      createdBy: 'Sarah Chen'
    });
    setSelectedCommunication(null);
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
  };

  const getCommunicationIcon = (type: string) => {
    return communicationTypes.find(t => t.value === type)?.icon || Mail;
  };

  const getTypeColor = (type: string) => {
    return communicationTypes.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    return statuses.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  };

  const getTodaysCommunications = () => {
    const today = new Date().toDateString();
    return filteredCommunications.filter(comm => 
      comm.createdAt && new Date(comm.createdAt.toDate()).toDateString() === today
    ).length;
  };

  const getPendingResponses = () => {
    return filteredCommunications.filter(comm => 
      comm.responseRequired && !comm.responseReceived
    ).length;
  };

  const getDraftsCount = () => {
    return filteredCommunications.filter(comm => comm.status === 'draft').length;
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading communications...</div>
        </div>
      
    );
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-gray-600 mt-1">
              Manage all customer communications and track interactions
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Communication
          </button>
        </div>

        {/* Communication Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today</p>
                <p className="text-2xl font-bold text-gray-900">{getTodaysCommunications()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Response</p>
                <p className="text-2xl font-bold text-gray-900">{getPendingResponses()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gray-100">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Drafts</p>
                <p className="text-2xl font-bold text-gray-900">{getDraftsCount()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{filteredCommunications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search communications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {communicationTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Directions</option>
                {directions.map(direction => (
                  <option key={direction.value} value={direction.value}>
                    {direction.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Communications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Communication
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact/Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommunications.map((communication) => {
                  const Icon = getCommunicationIcon(communication.type);
                  return (
                    <tr key={communication.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-lg mr-3 ${getTypeColor(communication.type)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {communication.subject || `${communicationTypes.find(t => t.value === communication.type)?.label} - ${communication.contactName}`}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 max-w-xs truncate">
                              {communication.content}
                            </div>
                            {communication.dealName && (
                              <div className="text-xs text-blue-600 mt-1">
                                Deal: {communication.dealName}
                              </div>
                            )}
                            {communication.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {communication.tags.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {communication.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{communication.tags.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {communication.contactName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Building2 className="h-3 w-3 mr-1" />
                            {communication.company}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {communication.contactEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(communication.type)}`}>
                          {communicationTypes.find(t => t.value === communication.type)?.label}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(communication.priority)}`}>
                            {priorities.find(p => p.value === communication.priority)?.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(communication.status)}`}>
                          {statuses.find(s => s.value === communication.status)?.label}
                        </span>
                        {communication.responseRequired && !communication.responseReceived && (
                          <div className="text-xs text-orange-600 mt-1">Response Required</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          communication.direction === 'inbound' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {communication.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {communication.createdAt && (
                          <div>
                            {communication.createdAt.toDate().toLocaleDateString()}
                            <div className="text-xs text-gray-500">
                              {communication.createdAt.toDate().toLocaleTimeString()}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {communication.createdBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleView(communication)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(communication)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(communication.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCommunications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No communications found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Communication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">New Communication</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Communication['type']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {communicationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direction *
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({...formData, direction: e.target.value as Communication['direction']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {directions.map(direction => (
                      <option key={direction.value} value={direction.value}>
                        {direction.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Communication['status']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Name
                  </label>
                  <input
                    type="text"
                    value={formData.dealName}
                    onChange={(e) => setFormData({...formData, dealName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as Communication['priority']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="urgent, follow-up, proposal"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date (if applicable)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.responseRequired}
                  onChange={(e) => setFormData({...formData, responseRequired: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Response required
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Communication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Communication Modal - Similar to Add Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Communication</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as Communication['type']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {communicationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Direction *
                  </label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({...formData, direction: e.target.value as Communication['direction']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {directions.map(direction => (
                      <option key={direction.value} value={direction.value}>
                        {direction.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as Communication['status']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deal Name
                  </label>
                  <input
                    type="text"
                    value={formData.dealName}
                    onChange={(e) => setFormData({...formData, dealName: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as Communication['priority']})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="urgent, follow-up, proposal"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date (if applicable)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.responseRequired}
                  onChange={(e) => setFormData({...formData, responseRequired: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Response required
                </label>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Communication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Communication Modal */}
      {showViewModal && selectedCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold">Communication Details</h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <div className="flex items-center mt-1">
                    {(() => {
                      const Icon = getCommunicationIcon(selectedCommunication.type);
                      return <Icon className="h-4 w-4 mr-2" />;
                    })()}
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedCommunication.type)}`}>
                      {communicationTypes.find(t => t.value === selectedCommunication.type)?.label}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(selectedCommunication.status)}`}>
                    {statuses.find(s => s.value === selectedCommunication.status)?.label}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Subject</h3>
                <p className="text-lg font-medium text-gray-900 mt-1">{selectedCommunication.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                  <p className="text-gray-900 mt-1">{selectedCommunication.contactName}</p>
                  <p className="text-sm text-gray-600">{selectedCommunication.contactEmail}</p>
                  {selectedCommunication.contactPhone && (
                    <p className="text-sm text-gray-600">{selectedCommunication.contactPhone}</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Company</h3>
                  <p className="text-gray-900 mt-1">{selectedCommunication.company}</p>
                  {selectedCommunication.dealName && (
                    <>
                      <h3 className="text-sm font-medium text-gray-500 mt-2">Deal</h3>
                      <p className="text-blue-600 mt-1">{selectedCommunication.dealName}</p>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Content</h3>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedCommunication.content}</p>
                </div>
              </div>

              {selectedCommunication.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedCommunication.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-500">Direction</h3>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedCommunication.direction === 'inbound' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedCommunication.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Priority</h3>
                  <p className="mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedCommunication.priority)}`}>
                      {priorities.find(p => p.value === selectedCommunication.priority)?.label}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Created By</h3>
                  <p className="mt-1 text-gray-900">{selectedCommunication.createdBy}</p>
                </div>
              </div>

              {selectedCommunication.responseRequired && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <span className="font-medium text-orange-800">Response Required</span>
                  </div>
                  {!selectedCommunication.responseReceived && (
                    <p className="text-orange-700 text-sm mt-1">This communication requires a response.</p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleEdit(selectedCommunication);
                  setShowViewModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
  );
}