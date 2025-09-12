'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Star, Trophy, TrendingUp, Users, Save, Plus, X, 
  ChevronUp, ChevronDown, Settings, ArrowLeft
} from 'lucide-react';

interface RankingTier {
  id: string;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  benefits: string[];
  icon: string;
}

interface RankingCriteria {
  id: string;
  name: string;
  weight: number;
  description: string;
  category: 'revenue' | 'engagement' | 'loyalty' | 'growth';
}

export default function CustomerRankingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tiers');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check permissions
  const canEdit = user?.role === 'admin' || user?.role === 'sales_manager' || !user?.role;

  // Ranking Tiers
  const [tiers, setTiers] = useState<RankingTier[]>([
    {
      id: '1',
      name: 'Platinum',
      minScore: 90,
      maxScore: 100,
      color: 'purple',
      benefits: ['Priority Support', 'Custom Pricing', 'Dedicated Account Manager', 'Early Access'],
      icon: 'trophy'
    },
    {
      id: '2',
      name: 'Gold',
      minScore: 70,
      maxScore: 89,
      color: 'yellow',
      benefits: ['Extended Support', 'Volume Discounts', 'Quarterly Reviews'],
      icon: 'star'
    },
    {
      id: '3',
      name: 'Silver',
      minScore: 50,
      maxScore: 69,
      color: 'gray',
      benefits: ['Standard Support', 'Annual Reviews'],
      icon: 'medal'
    },
    {
      id: '4',
      name: 'Bronze',
      minScore: 0,
      maxScore: 49,
      color: 'orange',
      benefits: ['Basic Support'],
      icon: 'shield'
    }
  ]);

  // Ranking Criteria
  const [criteria, setCriteria] = useState<RankingCriteria[]>([
    {
      id: '1',
      name: 'Annual Revenue',
      weight: 35,
      description: 'Total revenue generated in the last 12 months',
      category: 'revenue'
    },
    {
      id: '2',
      name: 'Order Frequency',
      weight: 20,
      description: 'Average number of orders per month',
      category: 'engagement'
    },
    {
      id: '3',
      name: 'Customer Lifetime',
      weight: 15,
      description: 'Years as an active customer',
      category: 'loyalty'
    },
    {
      id: '4',
      name: 'Growth Rate',
      weight: 15,
      description: 'Year-over-year revenue growth percentage',
      category: 'growth'
    },
    {
      id: '5',
      name: 'Payment History',
      weight: 10,
      description: 'On-time payment percentage',
      category: 'loyalty'
    },
    {
      id: '6',
      name: 'Product Diversity',
      weight: 5,
      description: 'Number of different product categories purchased',
      category: 'engagement'
    }
  ]);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    setHasChanges(false);
  };

  const updateTier = (tierId: string, field: keyof RankingTier, value: any) => {
    setTiers(prev => prev.map(tier => 
      tier.id === tierId ? { ...tier, [field]: value } : tier
    ));
    setHasChanges(true);
  };

  const updateCriteria = (criteriaId: string, field: keyof RankingCriteria, value: any) => {
    setCriteria(prev => prev.map(c => 
      c.id === criteriaId ? { ...c, [field]: value } : c
    ));
    setHasChanges(true);
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'revenue': return '💰';
      case 'engagement': return '🤝';
      case 'loyalty': return '⭐';
      case 'growth': return '📈';
      default: return '📊';
    }
  };

  const getTierColorClasses = (color: string) => {
    switch(color) {
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'gray': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!canEdit) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You don't have permission to view Customer Rankings settings. 
            Only administrators and sales managers can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/crm/settings')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Rankings Configuration</h1>
            <p className="text-gray-600 mt-1">
              Define customer tiers and scoring criteria for automated customer segmentation
            </p>
          </div>
          
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tiers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tiers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ranking Tiers
          </button>
          <button
            onClick={() => setActiveTab('criteria')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'criteria'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Scoring Criteria
          </button>
          <button
            onClick={() => setActiveTab('automation')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'automation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Automation Rules
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'tiers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Tiers</h2>
              
              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColorClasses(tier.color)}`}>
                            {tier.name}
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            Score Range: {tier.minScore} - {tier.maxScore}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Tier Name</label>
                            <input
                              type="text"
                              value={tier.name}
                              onChange={(e) => updateTier(tier.id, 'name', e.target.value)}
                              className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Min Score</label>
                              <input
                                type="number"
                                value={tier.minScore}
                                onChange={(e) => updateTier(tier.id, 'minScore', parseInt(e.target.value))}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Max Score</label>
                              <input
                                type="number"
                                value={tier.maxScore}
                                onChange={(e) => updateTier(tier.id, 'maxScore', parseInt(e.target.value))}
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Benefits</label>
                          <div className="flex flex-wrap gap-2">
                            {tier.benefits.map((benefit, bIndex) => (
                              <span key={bIndex} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                {benefit}
                              </span>
                            ))}
                            <button className="px-2 py-1 border border-dashed border-gray-300 text-gray-500 rounded text-xs hover:border-gray-400">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {index > 0 && (
                        <button className="ml-4 p-1 text-gray-400 hover:text-gray-600">
                          <ChevronUp className="h-4 w-4" />
                        </button>
                      )}
                      {index < tiers.length - 1 && (
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'criteria' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Scoring Criteria</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  totalWeight === 100 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  Total Weight: {totalWeight}%
                </div>
              </div>
              
              <div className="space-y-3">
                {criteria.map((criterion) => (
                  <div key={criterion.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <span className="text-2xl mr-3">{getCategoryIcon(criterion.category)}</span>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900">{criterion.name}</h3>
                            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {criterion.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{criterion.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center ml-4">
                        <label className="text-sm text-gray-600 mr-2">Weight:</label>
                        <input
                          type="number"
                          value={criterion.weight}
                          onChange={(e) => updateCriteria(criterion.id, 'weight', parseInt(e.target.value))}
                          className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center"
                          min="0"
                          max="100"
                        />
                        <span className="ml-1 text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {totalWeight !== 100 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Weights must total 100%. Currently at {totalWeight}%.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Automation Rules</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Automatic Tier Updates</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Automatically recalculate and update customer tiers based on scoring criteria
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <label className="text-sm text-gray-600">Recalculation Frequency:</label>
                    <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>Quarterly</option>
                    </select>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Tier Change Notifications</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Send notifications when customers move between tiers
                  </p>
                  <div className="mt-3 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-600">Notify account managers</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      <span className="text-sm text-gray-600">Notify customers of upgrades</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm text-gray-600">Notify customers of downgrades</span>
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Automated Benefits</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    Automatically apply tier benefits like discounts and priority support
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}