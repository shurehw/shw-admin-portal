'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search, Plus, Filter, TrendingUp, Target, Users, Building2,
  MapPin, DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Eye, ThumbsUp, ThumbsDown, Timer, Merge,
  UserPlus, Zap, Coffee, Store, Hotel, Star, Activity,
  Calendar, Phone, Mail, Globe, Hash, Award, Shield
} from 'lucide-react';

interface LeadIntake {
  id: string;
  source: string;
  suggested_company: {
    brand_name: string;
    segment?: string;
    price_band?: string;
    location_count?: number;
  };
  suggested_location: {
    city?: string;
    state?: string;
    formatted_address?: string;
  };
  score_preview: number;
  winability_preview: number;
  status: 'pending' | 'approved' | 'denied' | 'snoozed' | 'merged' | 'assigned';
  reason_code?: string;
  notes?: string;
  assigned_to?: string;
  created_at: string;
  signals?: Array<{
    type: string;
    value: any;
  }>;
}

interface SmartList {
  id: string;
  name: string;
  description?: string;
  count: number;
  median_score: number;
  icon: string;
  color: string;
}

export default function SmartLeadsPage() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'intake' | 'lists' | 'assigned'>('intake');
  const [intakeQueue, setIntakeQueue] = useState<LeadIntake[]>([]);
  const [smartLists, setSmartLists] = useState<SmartList[]>([]);
  const [selectedLead, setSelectedLead] = useState<LeadIntake | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);
  const [salesReps, setSalesReps] = useState<Array<{id: string, name: string}>>([]);
  const [selectedRep, setSelectedRep] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch intake queue
      const intakeRes = await fetch(`/api/crm/leads/intake?status=${filterStatus}`);
      if (intakeRes.ok) {
        const data = await intakeRes.json();
        setIntakeQueue(data.leads || []);
      }

      // Fetch smart lists
      const listsRes = await fetch('/api/crm/leads/smart-lists');
      if (listsRes.ok) {
        const data = await listsRes.json();
        setSmartLists(data.lists || mockSmartLists);
      } else {
        setSmartLists(mockSmartLists);
      }

      // Fetch sales reps
      const repsRes = await fetch('/api/admin/users?role=sales_rep');
      if (repsRes.ok) {
        const data = await repsRes.json();
        setSalesReps(data.users?.map((u: any) => ({
          id: u.id,
          name: u.full_name || u.email
        })) || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Use mock data for now
      setIntakeQueue(mockIntakeQueue);
      setSmartLists(mockSmartLists);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/crm/leads/intake/${leadId}/approve`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchData();
        alert('Lead approved and promoted to companies');
      }
    } catch (error) {
      console.error('Error approving lead:', error);
    }
  };

  const handleDenyLead = async (leadId: string, reasonCode: string) => {
    try {
      const res = await fetch(`/api/crm/leads/intake/${leadId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason_code: reasonCode })
      });
      if (res.ok) {
        await fetchData();
        alert('Lead denied and suppressed');
      }
    } catch (error) {
      console.error('Error denying lead:', error);
    }
  };

  const handleSnoozeLead = async (leadId: string, days: number) => {
    try {
      const res = await fetch(`/api/crm/leads/intake/${leadId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      if (res.ok) {
        await fetchData();
        alert(`Lead snoozed for ${days} days`);
      }
    } catch (error) {
      console.error('Error snoozing lead:', error);
    }
  };

  const handleAssignLead = async (leadId: string, repId: string) => {
    try {
      const res = await fetch(`/api/crm/leads/intake/${leadId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: repId })
      });
      if (res.ok) {
        await fetchData();
        setShowAssignModal(false);
        setSelectedLead(null);
        alert('Lead assigned successfully');
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-100';
    if (score >= 55) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getPriorityBand = (score: number) => {
    if (score >= 70) return 'P0';
    if (score >= 55) return 'P1';
    if (score >= 40) return 'P2';
    return 'P3';
  };

  const getSegmentIcon = (segment?: string) => {
    switch (segment) {
      case 'restaurant': return <Store className="h-4 w-4" />;
      case 'cafe': return <Coffee className="h-4 w-4" />;
      case 'bakery': return <Coffee className="h-4 w-4" />;
      case 'hotel': return <Hotel className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  // Mock data
  const mockIntakeQueue: LeadIntake[] = [
    {
      id: '1',
      source: 'RAR',
      suggested_company: {
        brand_name: 'Sunset Grill',
        segment: 'restaurant',
        price_band: '$$',
        location_count: 3
      },
      suggested_location: {
        city: 'Los Angeles',
        state: 'CA',
        formatted_address: '123 Sunset Blvd, Los Angeles, CA 90028'
      },
      score_preview: 78,
      winability_preview: 72,
      status: 'pending',
      created_at: new Date().toISOString(),
      signals: [
        { type: 'rar_type', value: { lead_type: 'pre_open' } },
        { type: 'review_velocity', value: { trend: 'up' } }
      ]
    },
    {
      id: '2',
      source: 'Manual',
      suggested_company: {
        brand_name: 'Urban Café',
        segment: 'cafe',
        price_band: '$',
        location_count: 5
      },
      suggested_location: {
        city: 'Santa Monica',
        state: 'CA'
      },
      score_preview: 62,
      winability_preview: 58,
      status: 'pending',
      created_at: new Date().toISOString(),
      signals: [
        { type: 'expansion', value: { hiring: true } }
      ]
    }
  ];

  const mockSmartLists: SmartList[] = [
    {
      id: '1',
      name: 'Multi-Unit 3-20 (LA/OC)',
      description: 'Growing chains in Los Angeles & Orange County',
      count: 47,
      median_score: 65,
      icon: 'building',
      color: 'blue'
    },
    {
      id: '2',
      name: 'RAR This Week',
      description: 'Fresh pre-opening and ownership changes',
      count: 23,
      median_score: 71,
      icon: 'zap',
      color: 'yellow'
    },
    {
      id: '3',
      name: 'Hotel F&B Programs',
      description: 'Hotels with multiple F&B outlets',
      count: 18,
      median_score: 68,
      icon: 'hotel',
      color: 'purple'
    },
    {
      id: '4',
      name: 'Expansion Signals',
      description: 'Hiring GMs or Executive Chefs',
      count: 31,
      median_score: 64,
      icon: 'trending',
      color: 'green'
    }
  ];

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Target className="h-8 w-8 text-blue-600" />
                Smart Leads Engine
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered lead discovery and scoring for B2B wholesale
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Target
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {intakeQueue.filter(l => l.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">P0 Leads (70+)</p>
                <p className="text-2xl font-bold text-green-600">
                  {intakeQueue.filter(l => l.score_preview >= 70).length}
                </p>
              </div>
              <Zap className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Winability</p>
                <p className="text-2xl font-bold text-blue-600">68%</p>
              </div>
              <Award className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pipeline</p>
                <p className="text-2xl font-bold text-purple-600">$248K</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('intake')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'intake'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Intake Queue
              </button>
              <button
                onClick={() => setActiveTab('lists')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'lists'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Smart Lists
              </button>
              <button
                onClick={() => setActiveTab('assigned')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'assigned'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                My Assigned Leads
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Intake Queue Tab */}
            {activeTab === 'intake' && (
              <div>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex gap-2">
                    {['pending', 'approved', 'denied', 'snoozed'].map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg capitalize ${
                          filterStatus === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lead Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {intakeQueue.map(lead => (
                    <div key={lead.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          {getSegmentIcon(lead.suggested_company.segment)}
                          <h3 className="font-semibold text-gray-900">
                            {lead.suggested_company.brand_name}
                          </h3>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getScoreColor(lead.score_preview)}`}>
                          {getPriorityBand(lead.score_preview)}
                        </span>
                      </div>

                      {/* Location */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4" />
                        {lead.suggested_location.city}, {lead.suggested_location.state}
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Score</p>
                          <p className="text-lg font-bold text-gray-900">{lead.score_preview}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Winability</p>
                          <p className="text-lg font-bold text-blue-600">{lead.winability_preview}%</p>
                        </div>
                      </div>

                      {/* Signals */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {lead.signals?.slice(0, 3).map((signal, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {signal.type === 'rar_type' ? `RAR ${signal.value.lead_type}` : signal.type}
                          </span>
                        ))}
                        {lead.suggested_company.price_band && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            {lead.suggested_company.price_band}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveLead(lead.id)}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          title="Approve (Enter)"
                        >
                          <ThumbsUp className="h-4 w-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleDenyLead(lead.id, 'not_icp')}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          title="Deny (D)"
                        >
                          <ThumbsDown className="h-4 w-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => handleSnoozeLead(lead.id, 30)}
                          className="flex-1 px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                          title="Snooze 30d (S)"
                        >
                          <Timer className="h-4 w-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowAssignModal(true);
                          }}
                          className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          title="Assign (A)"
                        >
                          <UserPlus className="h-4 w-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Lists Tab */}
            {activeTab === 'lists' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {smartLists.map(list => (
                  <div
                    key={list.id}
                    className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg bg-${list.color}-100`}>
                        {list.icon === 'building' && <Building2 className={`h-6 w-6 text-${list.color}-600`} />}
                        {list.icon === 'zap' && <Zap className={`h-6 w-6 text-${list.color}-600`} />}
                        {list.icon === 'hotel' && <Hotel className={`h-6 w-6 text-${list.color}-600`} />}
                        {list.icon === 'trending' && <TrendingUp className={`h-6 w-6 text-${list.color}-600`} />}
                      </div>
                      <span className="text-2xl font-bold text-gray-900">{list.count}</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{list.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{list.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Median Score</span>
                      <span className={`font-medium ${list.median_score >= 65 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {list.median_score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Assigned Leads Tab */}
            {activeTab === 'assigned' && (
              <div>
                <p className="text-gray-600">Your assigned leads will appear here...</p>
              </div>
            )}
          </div>
        </div>

        {/* Assignment Modal */}
        {showAssignModal && selectedLead && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAssignModal(false)} />
              
              <div className="relative bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-xl font-semibold mb-4">Assign Lead</h2>
                <p className="text-gray-600 mb-4">
                  Assign <strong>{selectedLead.suggested_company.brand_name}</strong> to a sales rep:
                </p>
                
                <select
                  value={selectedRep}
                  onChange={(e) => setSelectedRep(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg mb-4"
                >
                  <option value="">Select a rep...</option>
                  {salesReps.map(rep => (
                    <option key={rep.id} value={rep.id}>{rep.name}</option>
                  ))}
                </select>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => selectedRep && handleAssignLead(selectedLead.id, selectedRep)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    disabled={!selectedRep}
                  >
                    Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}