'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { 
  Plus, Search, Filter, Download, Edit2, Trash2, Eye, 
  DollarSign, Calendar, Target, TrendingUp, Building2,
  User, Phone, Mail, Clock, CheckCircle2, AlertCircle, Layout, LayoutGrid
} from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
  isDefault: boolean;
}

interface PipelineStage {
  id: string;
  name: string;
  order: number;
  probability: number;
  color: string;
}

interface Deal {
  id: string;
  name: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  value: number;
  stage: string;
  pipelineId?: string;
  probability: number;
  closeDate: string;
  owner: string;
  source: string;
  description: string;
  nextAction: string;
  nextActionDate: string;
  createdAt: any;
  updatedAt: any;
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    value: '',
    stage: '1',
    pipelineId: '',
    probability: 25,
    closeDate: '',
    owner: 'Sarah Chen',
    source: '',
    description: '',
    nextAction: '',
    nextActionDate: ''
  });


  const owners = ['Sarah Chen', 'Mike Johnson', 'Tom Davis', 'Lisa Wang', 'Alex Rodriguez'];

  useEffect(() => {
    loadPipelines();
    loadDeals();
  }, []);

  useEffect(() => {
    filterDeals();
  }, [deals, searchTerm, stageFilter, ownerFilter, pipelineFilter]);

  const loadPipelines = () => {
    try {
      // Load pipelines from localStorage
      const savedPipelines = localStorage.getItem('crm_pipelines');
      if (savedPipelines) {
        const parsed = JSON.parse(savedPipelines);
        setPipelines(parsed);
        const defaultPipeline = parsed.find((p: Pipeline) => p.isDefault) || parsed[0];
        setSelectedPipeline(defaultPipeline);
        setFormData(prev => ({ ...prev, pipelineId: defaultPipeline?.id || '' }));
      } else {
        // Create a default pipeline if none exists
        const defaultPipeline: Pipeline = {
          id: '1',
          name: 'Sales Pipeline',
          stages: [
            { id: '1', name: 'Lead', order: 0, probability: 10, color: '#6B7280' },
            { id: '2', name: 'Qualified', order: 1, probability: 25, color: '#3B82F6' },
            { id: '3', name: 'Proposal', order: 2, probability: 50, color: '#8B5CF6' },
            { id: '4', name: 'Negotiation', order: 3, probability: 75, color: '#F59E0B' },
            { id: '5', name: 'Closed Won', order: 4, probability: 100, color: '#10B981' },
            { id: '6', name: 'Closed Lost', order: 5, probability: 0, color: '#EF4444' }
          ],
          isDefault: true
        };
        
        localStorage.setItem('crm_pipelines', JSON.stringify([defaultPipeline]));
        setPipelines([defaultPipeline]);
        setSelectedPipeline(defaultPipeline);
        setFormData(prev => ({ ...prev, pipelineId: '1' }));
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
    }
  };

  const loadDeals = async () => {
    try {
      // Mock data - in production would fetch from API
      const mockDeals: Deal[] = [
        {
          id: '1',
          name: 'Marriott - Q1 Keycard Order',
          company: 'Marriott International',
          contactName: 'John Smith',
          contactEmail: 'john.smith@marriott.com',
          contactPhone: '(555) 123-4567',
          value: 125000,
          stage: '4',
          pipelineId: '1',
          probability: 75,
          closeDate: '2024-02-15',
          owner: 'Sarah Chen',
          source: 'Existing Customer',
          description: 'Quarterly keycard and door hanger order',
          nextAction: 'Send revised proposal',
          nextActionDate: '2024-01-20',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          name: 'Hilton - Menu Holders',
          company: 'Hilton Hotels',
          contactName: 'Jane Doe',
          contactEmail: 'jane.doe@hilton.com',
          contactPhone: '(555) 234-5678',
          value: 45000,
          stage: '3',
          pipelineId: '1',
          probability: 50,
          closeDate: '2024-02-28',
          owner: 'Mike Johnson',
          source: 'Trade Show',
          description: 'Custom menu holders for restaurant locations',
          nextAction: 'Follow up on proposal',
          nextActionDate: '2024-01-22',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-12')
        },
        {
          id: '3',
          name: 'Local Restaurant - Initial Order',
          company: 'Local Restaurant Group',
          contactName: 'Bob Wilson',
          contactEmail: 'bob@localrestaurants.com',
          contactPhone: '(555) 345-6789',
          value: 15000,
          stage: '5',
          pipelineId: '1',
          probability: 100,
          closeDate: '2024-01-10',
          owner: 'Sarah Chen',
          source: 'Website',
          description: 'Initial order for menu holders and signage',
          nextAction: 'Schedule delivery',
          nextActionDate: '2024-01-25',
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2024-01-10')
        },
        {
          id: '4',
          name: 'Tech Startup - Office Signage',
          company: 'Tech Startup Inc',
          contactName: 'Alice Johnson',
          contactEmail: 'alice@techstartup.io',
          contactPhone: '(555) 456-7890',
          value: 8000,
          stage: '1',
          pipelineId: '1',
          probability: 25,
          closeDate: '2024-03-15',
          owner: 'Tom Davis',
          source: 'Cold Outreach',
          description: 'Office signage and wayfinding system',
          nextAction: 'Schedule discovery call',
          nextActionDate: '2024-01-18',
          createdAt: new Date('2024-01-14'),
          updatedAt: new Date('2024-01-14')
        }
      ];

      setDeals(mockDeals);
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDeals = () => {
    let filtered = [...deals];

    if (searchTerm) {
      filtered = filtered.filter(deal =>
        deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contactName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (pipelineFilter !== 'all') {
      filtered = filtered.filter(deal => deal.pipelineId === pipelineFilter);
    }

    if (stageFilter !== 'all') {
      filtered = filtered.filter(deal => deal.stage === stageFilter);
    }

    if (ownerFilter !== 'all') {
      filtered = filtered.filter(deal => deal.owner === ownerFilter);
    }

    setFilteredDeals(filtered);
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newDeal: Deal = {
      id: Date.now().toString(),
      name: formData.name,
      company: formData.company,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      value: parseFloat(formData.value) || 0,
      stage: formData.stage,
      probability: formData.probability,
      closeDate: formData.closeDate,
      owner: formData.owner,
      source: formData.source,
      description: formData.description,
      nextAction: formData.nextAction,
      nextActionDate: formData.nextActionDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setDeals([...deals, newDeal]);
    setShowAddModal(false);
    resetForm();
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDeal) return;

    const updatedDeal: Deal = {
      ...selectedDeal,
      name: formData.name,
      company: formData.company,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      value: parseFloat(formData.value) || 0,
      stage: formData.stage,
      probability: formData.probability,
      closeDate: formData.closeDate,
      owner: formData.owner,
      source: formData.source,
      description: formData.description,
      nextAction: formData.nextAction,
      nextActionDate: formData.nextActionDate,
      updatedAt: new Date()
    };

    setDeals(deals.map(d => d.id === selectedDeal.id ? updatedDeal : d));
    setShowEditModal(false);
    setSelectedDeal(null);
    resetForm();
  };

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      setDeals(deals.filter(d => d.id !== dealId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      value: '',
      stage: 'qualification',
      probability: 25,
      closeDate: '',
      owner: 'Sarah Chen',
      source: '',
      description: '',
      nextAction: '',
      nextActionDate: ''
    });
  };

  const openEditModal = (deal: Deal) => {
    setSelectedDeal(deal);
    setFormData({
      name: deal.name,
      company: deal.company,
      contactName: deal.contactName,
      contactEmail: deal.contactEmail,
      contactPhone: deal.contactPhone,
      value: deal.value.toString(),
      stage: deal.stage,
      pipelineId: deal.pipelineId || '1',
      probability: deal.probability,
      closeDate: deal.closeDate,
      owner: deal.owner,
      source: deal.source,
      description: deal.description,
      nextAction: deal.nextAction,
      nextActionDate: deal.nextActionDate
    });
    setShowEditModal(true);
  };

  const getStageColor = (stageId: string) => {
    const stage = selectedPipeline?.stages.find(s => s.id === stageId);
    if (stage) {
      // Convert hex color to Tailwind classes
      return 'bg-gray-100 text-gray-800'; // Default fallback
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStageName = (stageId: string) => {
    const stage = selectedPipeline?.stages.find(s => s.id === stageId);
    return stage?.name || 'Unknown Stage';
  };

  const calculateTotalValue = () => {
    return filteredDeals.reduce((sum, deal) => sum + deal.value, 0);
  };

  const calculateWeightedValue = () => {
    return filteredDeals.reduce((sum, deal) => sum + (deal.value * deal.probability / 100), 0);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1';
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (stageId: string) => {
    if (draggedDeal && draggedDeal.stage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStage(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedDeal && draggedDeal.stage !== targetStageId) {
      // Update the deal's stage
      const updatedDeals = deals.map(deal => 
        deal.id === draggedDeal.id 
          ? { ...deal, stage: targetStageId, updatedAt: new Date() }
          : deal
      );
      setDeals(updatedDeals);
      
      // Update probability based on new stage
      const newStage = selectedPipeline?.stages.find(s => s.id === targetStageId);
      if (newStage) {
        const dealWithNewProbability = updatedDeals.map(deal =>
          deal.id === draggedDeal.id
            ? { ...deal, probability: newStage.probability }
            : deal
        );
        setDeals(dealWithNewProbability);
      }
    }
    
    setDraggedDeal(null);
  };

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading deals...</div>
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
            <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
            <p className="text-gray-600 mt-1">Manage your sales pipeline</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layout size={16} className="mr-1" />
                Table
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutGrid size={16} className="mr-1" />
                Kanban
              </button>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Add Deal
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Deals</p>
                <p className="text-2xl font-bold">{filteredDeals.length}</p>
              </div>
              <Target className="text-blue-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${calculateTotalValue().toLocaleString()}</p>
              </div>
              <DollarSign className="text-green-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weighted Value</p>
                <p className="text-2xl font-bold">${calculateWeightedValue().toLocaleString()}</p>
              </div>
              <TrendingUp className="text-purple-600" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Won This Month</p>
                <p className="text-2xl font-bold">
                  {filteredDeals.filter(d => d.stage === 'closed-won').length}
                </p>
              </div>
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <select
              value={pipelineFilter}
              onChange={(e) => {
                setPipelineFilter(e.target.value);
                const pipeline = pipelines.find(p => p.id === e.target.value);
                setSelectedPipeline(pipeline || null);
              }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Pipelines</option>
              {pipelines.map(pipeline => (
                <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
              ))}
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Stages</option>
              {selectedPipeline?.stages
                .sort((a, b) => a.order - b.order)
                .map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
            </select>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="border rounded-lg px-3 py-2"
            >
              <option value="all">All Owners</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Deals Views */}
        {viewMode === 'table' ? (
          /* Deals Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Close Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{deal.name}</div>
                      <div className="text-sm text-gray-500">{deal.contactName}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{deal.company}</td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">${deal.value.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">{deal.probability}% probability</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(deal.stage)}`}>
                      {getStageName(deal.stage)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{new Date(deal.closeDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">{deal.owner}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(deal)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
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
          {filteredDeals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No deals found. Add your first deal to get started.
            </div>
          )}
          </div>
        ) : (
          /* Kanban View */
          <div className="overflow-x-auto">
            {!selectedPipeline && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500 mb-4">No pipeline selected</p>
                <p className="text-sm text-gray-400">
                  Please select a pipeline from the filter above or create one in 
                  <a href="/crm/settings/pipelines" className="text-blue-600 hover:underline ml-1">
                    Pipeline Settings
                  </a>
                </p>
              </div>
            )}
            {selectedPipeline && (
              <div className="flex gap-6 min-w-full">
                {selectedPipeline.stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage) => {
                  const stageDeals = filteredDeals.filter(deal => deal.stage === stage.id);
                  const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
                  
                  return (
                    <div key={stage.id} className="flex-shrink-0 w-80">
                      <div 
                        className={`bg-white rounded-lg shadow h-full transition-colors ${
                          dragOverStage === stage.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                        }`}
                        onDragOver={handleDragOver}
                        onDragEnter={() => handleDragEnter(stage.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stage.id)}
                      >
                        {/* Stage Header */}
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {stageDeals.length}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Total: ${stageValue.toLocaleString()}
                          </div>
                        </div>
                        
                        {/* Stage Deals - Drop Zone */}
                        <div 
                          className={`p-4 max-h-96 overflow-y-auto space-y-3 min-h-[200px] transition-colors ${
                            dragOverStage === stage.id ? 'bg-blue-25' : ''
                          }`}
                          onDragOver={handleDragOver}
                          onDragEnter={() => handleDragEnter(stage.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, stage.id)}
                        >
                          {stageDeals.map((deal) => (
                            <div
                              key={deal.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, deal)}
                              onDragEnd={handleDragEnd}
                              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-move transition-colors select-none"
                              onClick={(e) => {
                                // Only open modal if not dragging
                                if (e.detail === 1) {
                                  setTimeout(() => openEditModal(deal), 200);
                                }
                              }}
                            >
                              <div className="font-medium text-gray-900 mb-2">{deal.name}</div>
                              <div className="text-sm text-gray-600 mb-2">{deal.company}</div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-medium text-green-600">
                                  ${deal.value.toLocaleString()}
                                </span>
                                <span className="text-gray-500">{deal.probability}%</span>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                {deal.owner} • {new Date(deal.closeDate).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                          
                          {stageDeals.length === 0 && (
                            <div className={`text-center py-8 text-sm transition-colors ${
                              dragOverStage === stage.id 
                                ? 'text-blue-600 border-2 border-dashed border-blue-300 rounded-lg' 
                                : 'text-gray-400'
                            }`}>
                              {dragOverStage === stage.id ? 'Drop deal here' : 'No deals in this stage'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
              <h2 className="text-xl font-semibold mb-4">
                {showEditModal ? 'Edit Deal' : 'Add New Deal'}
              </h2>
              <form onSubmit={showEditModal ? handleUpdateDeal : handleAddDeal}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Deal Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company *</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Deal Value *</label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pipeline</label>
                    <select
                      value={formData.pipelineId}
                      onChange={(e) => {
                        const pipeline = pipelines.find(p => p.id === e.target.value);
                        setFormData({ 
                          ...formData, 
                          pipelineId: e.target.value,
                          stage: pipeline?.stages[0]?.id || '1'
                        });
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      {pipelines.map(pipeline => (
                        <option key={pipeline.id} value={pipeline.id}>{pipeline.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stage</label>
                    <select
                      value={formData.stage}
                      onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      {pipelines.find(p => p.id === formData.pipelineId)?.stages
                        .sort((a, b) => a.order - b.order)
                        .map(stage => (
                          <option key={stage.id} value={stage.id}>{stage.name}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Probability (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Close Date</label>
                    <input
                      type="date"
                      value={formData.closeDate}
                      onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Owner</label>
                    <select
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      {owners.map(owner => (
                        <option key={owner} value={owner}>{owner}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    {showEditModal ? 'Update Deal' : 'Add Deal'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      setSelectedDeal(null);
                      resetForm();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}