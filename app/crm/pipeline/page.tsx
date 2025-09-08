'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import CRMLayout from '@/components/CRMLayout';
import { 
  Plus, Search, Filter, MoreVertical, DollarSign, Calendar, 
  Building2, User, Phone, Mail, Clock, MapPin, Edit2, Trash2,
  ChevronDown, X, Check, AlertCircle, TrendingUp
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';

interface Deal {
  id: string;
  name: string;
  company: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  value: number;
  stage: string;
  stageId: string;
  probability: number;
  closeDate: string;
  owner: string;
  source: string;
  description: string;
  nextAction: string;
  nextActionDate: string;
  priority: 'low' | 'medium' | 'high';
  lastActivity: string;
  createdAt: any;
  updatedAt: any;
}

interface Stage {
  id: string;
  name: string;
  color: string;
  deals: Deal[];
  value: number;
  count: number;
}

export default function PipelineKanbanView() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showDealModal, setShowDealModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  const defaultStages = [
    { id: 'lead', name: 'Lead', color: '#6B7280' },
    { id: 'qualified', name: 'Qualified', color: '#3B82F6' },
    { id: 'proposal', name: 'Proposal', color: '#8B5CF6' },
    { id: 'negotiation', name: 'Negotiation', color: '#F59E0B' },
    { id: 'closed-won', name: 'Closed Won', color: '#10B981' },
    { id: 'closed-lost', name: 'Closed Lost', color: '#EF4444' }
  ];

  useEffect(() => {
    loadPipelineData();
    const unsubscribe = subscribeToDeals();
    return () => unsubscribe && unsubscribe();
  }, []);

  const subscribeToDeals = () => {
    const dealsQuery = query(
      collection(db, 'deals'),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(dealsQuery, (snapshot) => {
      const dealsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deal[];
      
      setDeals(dealsData);
      organizeDealsIntoStages(dealsData);
    });
  };

  const loadPipelineData = async () => {
    setLoading(true);
    try {
      const dealsSnapshot = await getDocs(collection(db, 'deals'));
      const dealsData = dealsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Deal[];
      
      setDeals(dealsData);
      organizeDealsIntoStages(dealsData);
    } catch (error) {
      console.error('Error loading pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeDealsIntoStages = (dealsData: Deal[]) => {
    const organizedStages = defaultStages.map(stage => {
      const stageDeals = dealsData.filter(deal => 
        deal.stage === stage.id || deal.stageId === stage.id
      );
      
      const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      
      return {
        ...stage,
        deals: stageDeals,
        value: totalValue,
        count: stageDeals.length
      };
    });
    
    setStages(organizedStages);
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same stage
      return;
    }

    // Moving to a different stage
    const dealToMove = deals.find(d => d.id === draggableId);
    if (!dealToMove) return;

    const newStageId = destination.droppableId;
    const newStage = stages.find(s => s.id === newStageId);
    if (!newStage) return;

    try {
      // Update the deal's stage in Firestore
      await updateDoc(doc(db, 'deals', dealToMove.id), {
        stage: newStageId,
        stageId: newStageId,
        probability: getStrageProbability(newStageId),
        updatedAt: Timestamp.now()
      });

      // Optimistically update the UI
      const updatedDeals = deals.map(deal =>
        deal.id === dealToMove.id
          ? { ...deal, stage: newStageId, stageId: newStageId }
          : deal
      );
      
      setDeals(updatedDeals);
      organizeDealsIntoStages(updatedDeals);
    } catch (error) {
      console.error('Error updating deal stage:', error);
      alert('Failed to update deal stage');
    }
  };

  const getStrageProbability = (stageId: string): number => {
    const probabilities: { [key: string]: number } = {
      'lead': 10,
      'qualified': 25,
      'proposal': 50,
      'negotiation': 75,
      'closed-won': 100,
      'closed-lost': 0
    };
    return probabilities[stageId] || 50;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getDealPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getDaysUntilClose = (closeDate: string) => {
    const close = new Date(closeDate);
    const today = new Date();
    const diffTime = close.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading pipeline...</div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deal Pipeline</h1>
              <p className="text-gray-600 mt-1">
                Drag and drop deals to move them through stages
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-64"
                />
              </div>
              
              {/* Filter */}
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All Owners</option>
                <option value="me">My Deals</option>
                <option value="team">My Team</option>
              </select>

              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-3 py-1 rounded ${viewMode === 'compact' ? 'bg-white shadow' : ''}`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 rounded ${viewMode === 'detailed' ? 'bg-white shadow' : ''}`}
                >
                  Detailed
                </button>
              </div>

              {/* Add Deal */}
              <button
                onClick={() => setShowDealModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </button>
            </div>
          </div>

          {/* Pipeline Metrics */}
          <div className="flex space-x-6 mt-4">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Pipeline Value</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(stages.reduce((sum, s) => sum + s.value, 0))}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Deals</p>
                <p className="text-lg font-semibold">
                  {stages.reduce((sum, s) => sum + s.count, 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <Check className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Won This Month</p>
                <p className="text-lg font-semibold">
                  {stages.find(s => s.id === 'closed-won')?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto bg-gray-50 p-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex space-x-4 h-full">
              {stages.map((stage) => (
                <div key={stage.id} className="flex-shrink-0 w-80">
                  <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
                    {/* Stage Header */}
                    <div 
                      className="p-4 border-b"
                      style={{ borderTopColor: stage.color, borderTopWidth: '3px' }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {stage.count} deals · {formatCurrency(stage.value)}
                          </p>
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Deals */}
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto p-2 ${
                            snapshot.isDraggingOver ? 'bg-blue-50' : ''
                          }`}
                        >
                          {stage.deals.map((deal, index) => (
                            <Draggable
                              key={deal.id}
                              draggableId={deal.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white border rounded-lg p-3 mb-2 cursor-move hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                  }`}
                                  onClick={() => {
                                    setSelectedDeal(deal);
                                    setShowDealModal(true);
                                  }}
                                >
                                  {/* Deal Card */}
                                  <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
                                      {deal.name}
                                    </h4>
                                    {deal.priority && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${getDealPriorityColor(deal.priority)}`}>
                                        {deal.priority}
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center text-xs text-gray-600">
                                      <Building2 className="h-3 w-3 mr-1" />
                                      {deal.company}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-600">
                                      <DollarSign className="h-3 w-3 mr-1" />
                                      {formatCurrency(deal.value)}
                                    </div>
                                    {viewMode === 'detailed' && (
                                      <>
                                        <div className="flex items-center text-xs text-gray-600">
                                          <User className="h-3 w-3 mr-1" />
                                          {deal.owner}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-600">
                                          <Calendar className="h-3 w-3 mr-1" />
                                          {deal.closeDate ? `${getDaysUntilClose(deal.closeDate)}d` : 'No date'}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {deal.nextAction && viewMode === 'detailed' && (
                                    <div className="mt-2 pt-2 border-t">
                                      <p className="text-xs text-gray-500">Next: {deal.nextAction}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          
                          {/* Add Deal to Stage */}
                          <button className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors">
                            <Plus className="h-4 w-4 mx-auto" />
                          </button>
                        </div>
                      )}
                    </Droppable>
                  </div>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {selectedDeal ? 'Edit Deal' : 'New Deal'}
              </h2>
              <button
                onClick={() => {
                  setShowDealModal(false);
                  setSelectedDeal(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Deal form would go here */}
              <p className="text-gray-600">Deal form implementation coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </CRMLayout>
  );
}