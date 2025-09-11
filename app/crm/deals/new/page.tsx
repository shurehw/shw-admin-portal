'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, DollarSign, Calendar, User, Briefcase } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore';

interface Pipeline {
  id: string;
  name: string;
  stages: Array<{
    id: string;
    name: string;
    order: number;
    probability: number;
    color: string;
  }>;
}

export default function NewDealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    value: '',
    pipelineId: '',
    stageId: '',
    probability: '10',
    closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contactId: '',
    companyId: '',
    owner: '',
    source: '',
    description: ''
  });

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'pipelines'));
      const pipelinesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Pipeline[];
      
      setPipelines(pipelinesData);
      
      // Set default pipeline
      if (pipelinesData.length > 0) {
        const defaultPipeline = pipelinesData[0];
        setSelectedPipeline(defaultPipeline);
        setFormData(prev => ({
          ...prev,
          pipelineId: defaultPipeline.id,
          stageId: defaultPipeline.stages[0]?.id || '',
          probability: defaultPipeline.stages[0]?.probability.toString() || '10'
        }));
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    if (pipeline) {
      setSelectedPipeline(pipeline);
      setFormData(prev => ({
        ...prev,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0]?.id || '',
        probability: pipeline.stages[0]?.probability.toString() || '10'
      }));
    }
  };

  const handleStageChange = (stageId: string) => {
    if (selectedPipeline) {
      const stage = selectedPipeline.stages.find(s => s.id === stageId);
      if (stage) {
        setFormData(prev => ({
          ...prev,
          stageId: stage.id,
          probability: stage.probability.toString()
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get current stage details
      const currentStage = selectedPipeline?.stages.find(s => s.id === formData.stageId);
      
      await addDoc(collection(db, 'deals'), {
        ...formData,
        value: parseFloat(formData.value),
        probability: parseInt(formData.probability),
        stageName: currentStage?.name || '',
        stageColor: currentStage?.color || '#6B7280',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      router.push('/crm/deals');
    } catch (error) {
      console.error('Error creating deal:', error);
      alert('Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New Deal</h1>
          <p className="text-gray-600 mt-1">Create a new sales opportunity</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Deal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline h-4 w-4 mr-1" />
                    Deal Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Deal Value
                  </label>
                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Expected Close Date
                  </label>
                  <input
                    type="date"
                    name="closeDate"
                    value={formData.closeDate}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pipeline
                  </label>
                  <select
                    name="pipelineId"
                    value={formData.pipelineId}
                    onChange={(e) => handlePipelineChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {pipelines.map(pipeline => (
                      <option key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stage
                  </label>
                  <select
                    name="stageId"
                    value={formData.stageId}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    disabled={!selectedPipeline}
                  >
                    {selectedPipeline?.stages
                      .sort((a, b) => a.order - b.order)
                      .map(stage => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Probability (%)
                  </label>
                  <input
                    type="number"
                    name="probability"
                    value={formData.probability}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1" />
                    Deal Owner
                  </label>
                  <input
                    type="text"
                    name="owner"
                    value={formData.owner}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Assign to sales rep"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Source
                  </label>
                  <select
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select source</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="cold-outreach">Cold Outreach</option>
                    <option value="trade-show">Trade Show</option>
                    <option value="social-media">Social Media</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="contactId"
                    value={formData.contactId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Link to contact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Link to company"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Add deal description and notes..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
  );
}