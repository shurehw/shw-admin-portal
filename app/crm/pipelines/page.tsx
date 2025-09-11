'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, GripVertical, Settings, 
  ChevronRight, Save, X, ArrowUp, ArrowDown
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  Timestamp 
} from 'firebase/firestore';

interface PipelineStage {
  id: string;
  name: string;
  description: string;
  order: number;
  probability: number;
  color: string;
}

interface Pipeline {
  id: string;
  name: string;
  description: string;
  stages: PipelineStage[];
  isDefault: boolean;
  createdAt: any;
  updatedAt: any;
}

const STAGE_COLORS = [
  '#6B7280', // Gray
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#14B8A6', // Teal
];

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  
  // Form state for creating/editing pipeline
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    stages: [
      { id: '1', name: 'Lead', description: 'Initial contact or inquiry', order: 0, probability: 10, color: '#6B7280' },
      { id: '2', name: 'Qualified', description: 'Lead has been qualified as a potential opportunity', order: 1, probability: 25, color: '#3B82F6' },
      { id: '3', name: 'Proposal', description: 'Proposal or quote has been presented', order: 2, probability: 50, color: '#8B5CF6' },
      { id: '4', name: 'Negotiation', description: 'In active negotiation with the prospect', order: 3, probability: 75, color: '#F59E0B' },
      { id: '5', name: 'Closed Won', description: 'Deal successfully closed', order: 4, probability: 100, color: '#10B981' },
      { id: '6', name: 'Closed Lost', description: 'Deal was lost or declined', order: 5, probability: 0, color: '#EF4444' }
    ]
  });

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'pipelines'));
      const pipelinesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pipeline[];
      
      setPipelines(pipelinesData);
      
      // Set default pipeline if none selected
      if (!selectedPipeline && pipelinesData.length > 0) {
        setSelectedPipeline(pipelinesData.find(p => p.isDefault) || pipelinesData[0]);
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
      
      // Create default pipeline if none exist
      if (pipelines.length === 0) {
        createDefaultPipeline();
      }
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPipeline = async () => {
    const defaultPipeline = {
      name: 'Sales Pipeline',
      description: 'Default sales pipeline',
      stages: [
        { id: '1', name: 'Lead', description: 'Initial contact or inquiry', order: 0, probability: 10, color: '#6B7280' },
        { id: '2', name: 'Qualified', description: 'Lead has been qualified as a potential opportunity', order: 1, probability: 25, color: '#3B82F6' },
        { id: '3', name: 'Proposal', description: 'Proposal or quote has been presented', order: 2, probability: 50, color: '#8B5CF6' },
        { id: '4', name: 'Negotiation', description: 'In active negotiation with the prospect', order: 3, probability: 75, color: '#F59E0B' },
        { id: '5', name: 'Closed Won', description: 'Deal successfully closed', order: 4, probability: 100, color: '#10B981' },
        { id: '6', name: 'Closed Lost', description: 'Deal was lost or declined', order: 5, probability: 0, color: '#EF4444' }
      ],
      isDefault: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    try {
      const docRef = await addDoc(collection(db, 'pipelines'), defaultPipeline);
      const newPipeline = { ...defaultPipeline, id: docRef.id };
      setPipelines([newPipeline]);
      setSelectedPipeline(newPipeline);
    } catch (error) {
      console.error('Error creating default pipeline:', error);
    }
  };

  const handleCreatePipeline = async () => {
    try {
      const newPipeline = {
        ...formData,
        isDefault: pipelines.length === 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'pipelines'), newPipeline);
      const createdPipeline = { ...newPipeline, id: docRef.id };
      
      setPipelines([...pipelines, createdPipeline]);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Error creating pipeline:', error);
      alert('Failed to create pipeline');
    }
  };

  const handleUpdatePipeline = async () => {
    if (!editingPipeline) return;
    
    try {
      const updatedData = {
        ...formData,
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(doc(db, 'pipelines', editingPipeline.id), updatedData);
      
      setPipelines(pipelines.map(p => 
        p.id === editingPipeline.id 
          ? { ...p, ...updatedData }
          : p
      ));
      
      if (selectedPipeline?.id === editingPipeline.id) {
        setSelectedPipeline({ ...selectedPipeline, ...updatedData });
      }
      
      setEditingPipeline(null);
      resetForm();
    } catch (error) {
      console.error('Error updating pipeline:', error);
      alert('Failed to update pipeline');
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    if (!confirm('Are you sure you want to delete this pipeline?')) return;
    
    try {
      await deleteDoc(doc(db, 'pipelines', pipelineId));
      setPipelines(pipelines.filter(p => p.id !== pipelineId));
      
      if (selectedPipeline?.id === pipelineId) {
        setSelectedPipeline(pipelines[0] || null);
      }
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      alert('Failed to delete pipeline');
    }
  };

  const handleAddStage = () => {
    const newStage: PipelineStage = {
      id: Date.now().toString(),
      name: 'New Stage',
      description: 'Describe what happens in this stage',
      order: formData.stages.length,
      probability: 50,
      color: STAGE_COLORS[formData.stages.length % STAGE_COLORS.length]
    };
    
    setFormData({
      ...formData,
      stages: [...formData.stages, newStage]
    });
  };

  const handleRemoveStage = (stageId: string) => {
    setFormData({
      ...formData,
      stages: formData.stages
        .filter(s => s.id !== stageId)
        .map((s, index) => ({ ...s, order: index }))
    });
  };

  const handleUpdateStage = (stageId: string, updates: Partial<PipelineStage>) => {
    setFormData({
      ...formData,
      stages: formData.stages.map(s => 
        s.id === stageId ? { ...s, ...updates } : s
      )
    });
  };

  const handleMoveStage = (stageId: string, direction: 'up' | 'down') => {
    const stageIndex = formData.stages.findIndex(s => s.id === stageId);
    if (
      (direction === 'up' && stageIndex === 0) ||
      (direction === 'down' && stageIndex === formData.stages.length - 1)
    ) {
      return;
    }
    
    const newStages = [...formData.stages];
    const targetIndex = direction === 'up' ? stageIndex - 1 : stageIndex + 1;
    
    // Swap stages
    [newStages[stageIndex], newStages[targetIndex]] = 
    [newStages[targetIndex], newStages[stageIndex]];
    
    // Update order
    newStages.forEach((stage, index) => {
      stage.order = index;
    });
    
    setFormData({ ...formData, stages: newStages });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      stages: [
        { id: '1', name: 'Lead', description: 'Initial contact or inquiry', order: 0, probability: 10, color: '#6B7280' },
        { id: '2', name: 'Qualified', description: 'Lead has been qualified as a potential opportunity', order: 1, probability: 25, color: '#3B82F6' },
        { id: '3', name: 'Proposal', description: 'Proposal or quote has been presented', order: 2, probability: 50, color: '#8B5CF6' },
        { id: '4', name: 'Negotiation', description: 'In active negotiation with the prospect', order: 3, probability: 75, color: '#F59E0B' },
        { id: '5', name: 'Closed Won', description: 'Deal successfully closed', order: 4, probability: 100, color: '#10B981' },
        { id: '6', name: 'Closed Lost', description: 'Deal was lost or declined', order: 5, probability: 0, color: '#EF4444' }
      ]
    });
  };

  const startEdit = (pipeline: Pipeline) => {
    setEditingPipeline(pipeline);
    setFormData({
      name: pipeline.name,
      description: pipeline.description,
      stages: pipeline.stages
    });
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading pipelines...</div>
        </div>
      
    );
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Management</h1>
            <p className="text-gray-600 mt-1">
              Create and manage your sales pipelines
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Pipeline
          </button>
        </div>

        {/* Pipeline List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Your Pipelines</h3>
              </div>
              <div className="p-2">
                {pipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                      selectedPipeline?.id === pipeline.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPipeline(pipeline)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {pipeline.name}
                          {pipeline.isDefault && (
                            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {pipeline.stages.length} stages
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(pipeline);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600" />
                        </button>
                        {!pipeline.isDefault && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePipeline(pipeline.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {pipelines.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No pipelines yet. Create your first pipeline.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pipeline Details */}
          <div className="lg:col-span-2">
            {selectedPipeline ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedPipeline.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {selectedPipeline.description}
                  </p>
                </div>
                
                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Pipeline Stages</h4>
                  
                  <div className="space-y-3">
                    {selectedPipeline.stages
                      .sort((a, b) => a.order - b.order)
                      .map((stage, index) => (
                        <div
                          key={stage.id}
                          className="flex items-start p-4 bg-gray-50 rounded-lg"
                        >
                          <div
                            className="w-4 h-4 rounded-full mr-4 mt-1"
                            style={{ backgroundColor: stage.color }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {index + 1}. {stage.name}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {stage.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Probability: {stage.probability}%
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 mt-1" />
                        </div>
                      ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <Settings className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900">Pipeline Usage</p>
                        <p className="text-blue-700 mt-1">
                          This pipeline is used by deals to track their progress through your sales process.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Select a pipeline to view its details
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingPipeline) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {editingPipeline ? 'Edit Pipeline' : 'Create New Pipeline'}
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pipeline Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      placeholder="e.g., Sales Pipeline"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      rows={2}
                      placeholder="Describe this pipeline..."
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium text-gray-700">
                        Pipeline Stages
                      </label>
                      <button
                        onClick={handleAddStage}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Stage
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.stages
                        .sort((a, b) => a.order - b.order)
                        .map((stage, index) => (
                          <div
                            key={stage.id}
                            className="border border-gray-200 p-4 bg-white rounded-lg"
                          >
                            <div className="flex items-center mb-3">
                              <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                              
                              <input
                                type="color"
                                value={stage.color}
                                onChange={(e) => handleUpdateStage(stage.id, { color: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer mr-3"
                              />
                              
                              <input
                                type="text"
                                value={stage.name}
                                onChange={(e) => handleUpdateStage(stage.id, { name: e.target.value })}
                                className="flex-1 border border-gray-300 rounded px-2 py-1 mr-3"
                                placeholder="Stage name"
                              />
                              
                              <div className="flex items-center mr-3">
                                <label className="text-xs text-gray-500 mr-1">Prob:</label>
                                <input
                                  type="number"
                                  value={stage.probability}
                                  onChange={(e) => handleUpdateStage(stage.id, { 
                                    probability: parseInt(e.target.value) || 0 
                                  })}
                                  className="w-16 border border-gray-300 rounded px-2 py-1"
                                  min="0"
                                  max="100"
                                />
                                <span className="text-xs text-gray-500 ml-1">%</span>
                              </div>
                              
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleMoveStage(stage.id, 'up')}
                                  disabled={index === 0}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleMoveStage(stage.id, 'down')}
                                  disabled={index === formData.stages.length - 1}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </button>
                                {formData.stages.length > 1 && (
                                  <button
                                    onClick={() => handleRemoveStage(stage.id)}
                                    className="p-1 hover:bg-red-100 rounded"
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <div>
                              <input
                                type="text"
                                value={stage.description}
                                onChange={(e) => handleUpdateStage(stage.id, { description: e.target.value })}
                                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                                placeholder="Describe what happens in this stage (e.g., 'Initial contact made, gathering basic requirements')"
                              />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPipeline(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPipeline ? handleUpdatePipeline : handleCreatePipeline}
                  disabled={!formData.name || formData.stages.length === 0}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingPipeline ? 'Update Pipeline' : 'Create Pipeline'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}