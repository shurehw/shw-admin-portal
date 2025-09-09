'use client';

import { useState, useEffect } from 'react';
import CRMLayout from '@/components/CRMLayout';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Search, Plus, Filter, TrendingUp, Target, Users, Building2,
  MapPin, DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Eye, ThumbsUp, ThumbsDown, Timer, Merge,
  UserPlus, Zap, Coffee, Store, Hotel, Star, Activity,
  Calendar, Phone, Mail, Globe, Hash, Award, Shield,
  Grid, List, RefreshCw, Sparkles, User, Linkedin, X, Loader2
} from 'lucide-react';

interface LeadIntake {
  id: string;
  source: string;
  suggested_company: {
    brand_name: string;
    segment?: string;
    price_band?: string;
    location_count?: number;
    website?: string;
    phone?: string;
    employee_count?: number;
    annual_revenue?: number;
    industry?: string;
  };
  suggested_location: {
    city?: string;
    state?: string;
    formatted_address?: string;
  };
  suggested_contacts?: Array<{
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
  }>;
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
  raw?: {
    added_by?: string;
    added_by_name?: string;
    added_at?: string;
    apollo_data?: {
      company?: any;
      people?: any[];
      fetched_at?: string;
    };
  };
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
  const [filterSource, setFilterSource] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [salesReps, setSalesReps] = useState<Array<{id: string, name: string}>>([]);
  const [selectedRep, setSelectedRep] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [detailLead, setDetailLead] = useState<LeadIntake | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [apolloData, setApolloData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterSource]);

  // Auto-refresh on mount (for when redirecting from discovery)
  useEffect(() => {
    fetchData();
  }, []);

  const handleLeadClick = (lead: LeadIntake) => {
    setDetailLead(lead);
    setApolloData(lead.raw?.apollo_data || null);
    setShowLeadDetail(true);
  };

  const enrichLead = async () => {
    if (!detailLead) return;
    
    setEnriching(true);
    try {
      const response = await fetch('/api/crm/leads/apollo-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: detailLead.id,
          companyName: detailLead.suggested_company.brand_name,
          domain: detailLead.suggested_company.website,
          forceRefresh: true
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setApolloData(data.data);
        // Update the lead in the list
        setIntakeQueue(prev => prev.map(l => 
          l.id === detailLead.id ? { ...l, raw: { ...l.raw, apollo_data: data.data } } : l
        ));
      }
    } catch (error) {
      console.error('Enrichment error:', error);
    } finally {
      setEnriching(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch intake queue
      const sourceParam = filterSource !== 'all' ? `&source=${filterSource}` : '';
      const intakeRes = await fetch(`/api/crm/leads/intake?status=${filterStatus}${sourceParam}`);
      if (intakeRes.ok) {
        const data = await intakeRes.json();
        setIntakeQueue(data || []);
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

  const refineWithAI = async () => {
    if (!process.env.NEXT_PUBLIC_OPENAI_CONFIGURED) {
      alert('AI refinement requires OpenAI API key. Add OPENAI_API_KEY to your environment variables.');
      return;
    }
    
    setLoading(true);
    try {
      // Send current leads to AI for enhancement
      const response = await fetch('/api/crm/leads/ai-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'Los Angeles, CA',
          categories: ['restaurant', 'cafe', 'hotel'],
          existingLeads: intakeQueue.slice(0, 10), // Refine first 10 leads
          enhance: true
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`AI refined ${data.enhanced} leads with insights and scoring.`);
        fetchData(); // Refresh to see enhanced data
      } else {
        alert('AI refinement in demo mode. Add OpenAI API key for full functionality.');
      }
    } catch (error) {
      console.error('Error refining with AI:', error);
      alert('AI refinement failed. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLead = async (leadId: string) => {
    try {
      const res = await fetch('/api/crm/leads/intake', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: leadId, 
          status: 'approved',
          createCompany: true 
        })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        console.error('Failed to approve lead:', error);
      }
    } catch (error) {
      console.error('Error approving lead:', error);
    }
  };

  const handleDenyLead = async (leadId: string, reasonCode: string) => {
    try {
      const res = await fetch('/api/crm/leads/intake', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: leadId, 
          status: 'denied',
          reason_code: reasonCode 
        })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const error = await res.json();
        console.error('Failed to deny lead:', error);
      }
    } catch (error) {
      console.error('Error denying lead:', error);
    }
  };

  const handleSnoozeLead = async (leadId: string, days: number) => {
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + days);
      
      const res = await fetch('/api/crm/leads/intake', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: leadId, 
          status: 'snoozed',
          notes: `Snoozed until ${snoozeUntil.toLocaleDateString()}`
        })
      });
      if (res.ok) {
        await fetchData();
        alert(`Lead snoozed for ${days} days`);
      } else {
        const error = await res.json();
        alert('Failed to snooze lead: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error snoozing lead:', error);
      alert('Failed to snooze lead');
    }
  };

  const handleAssignLead = async (leadId: string, repId: string) => {
    try {
      const res = await fetch('/api/crm/leads/intake', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: leadId,
          status: 'assigned',
          assigned_to: repId 
        })
      });
      if (res.ok) {
        await fetchData();
        setShowAssignModal(false);
        setSelectedLead(null);
        alert('Lead assigned successfully');
      } else {
        const error = await res.json();
        alert('Failed to assign lead: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      alert('Failed to assign lead');
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
              <div className="flex space-x-3">
                <Link href="/crm/leads/discover" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Discover Leads
                </Link>
                <Link href="/crm/leads/new" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Lead
                </Link>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Import CSV
                </button>
              </div>
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
                {/* Filters and View Controls */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col gap-3">
                    {/* Status Filters */}
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-500 self-center mr-2">Status:</span>
                      {['pending', 'approved', 'denied', 'snoozed'].map(status => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-1.5 rounded-lg capitalize text-sm ${
                          filterStatus === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                      ))}
                    </div>
                    
                    {/* Source Filters */}
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-500 self-center mr-2">Source:</span>
                      {['all', 'mock', 'google_places', 'yelp', 'rar_signal', 'manual'].map(source => (
                        <button
                          key={source}
                          onClick={() => setFilterSource(source)}
                          className={`px-3 py-1.5 rounded-lg capitalize text-sm ${
                          filterSource === source
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {source === 'rar_signal' ? 'RAR' : 
                         source === 'google_places' ? 'Google' :
                         source === 'mock' ? 'Demo' : source}
                      </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* View Controls */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchData()}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    <button
                      onClick={refineWithAI}
                      className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 flex items-center gap-2"
                      title="Use AI to enhance lead scoring and insights"
                    >
                      <Sparkles className="h-4 w-4" />
                      AI Refine
                    </button>
                    <div className="flex bg-gray-100 rounded-lg">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-2 rounded-l-lg flex items-center gap-2 ${
                          viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <List className="h-4 w-4" />
                        List
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-3 py-2 rounded-r-lg flex items-center gap-2 ${
                          viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Grid className="h-4 w-4" />
                        Grid
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lead Display */}
                {viewMode === 'grid' ? (
                  // Grid View
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {intakeQueue.map(lead => (
                    <div 
                      key={lead.id} 
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleLeadClick(lead)}
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getSegmentIcon(lead.suggested_company.segment)}
                            <h3 className="font-semibold text-gray-900">
                              {lead.suggested_company.name || lead.suggested_company.brand_name || 'Unknown Company'}
                            </h3>
                          </div>
                          {lead.raw?.added_by_name && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {lead.raw.added_by_name}
                              </span>
                            </div>
                          )}
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
                ) : (
                  // List View
                  <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <div className="max-h-[600px] overflow-y-auto">
                      <table className="min-w-full">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Winability
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {intakeQueue.map(lead => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {lead.suggested_company.name || lead.suggested_company.brand_name || 'Unknown Company'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {lead.suggested_company.segment}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {lead.suggested_location.city}, {lead.suggested_location.state}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <span className={`text-sm font-medium ${
                                  lead.score_preview >= 80 ? 'text-green-600' :
                                  lead.score_preview >= 60 ? 'text-yellow-600' : 'text-gray-600'
                                }`}>
                                  {lead.score_preview}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-900">
                                {lead.winability_preview}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                {lead.source}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                lead.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                lead.status === 'approved' ? 'bg-green-100 text-green-800' :
                                lead.status === 'denied' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleApproveLead(lead.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve"
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDenyLead(lead.id, 'not_icp')}
                                  className="text-red-600 hover:text-red-900"
                                  title="Deny"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSnoozeLead(lead.id, 30)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Snooze"
                                >
                                  <Timer className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedLead(lead);
                                    setShowAssignModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Assign"
                                >
                                  <UserPlus className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
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
                  Assign <strong>{selectedLead.suggested_company.name || selectedLead.suggested_company.brand_name || 'Unknown Company'}</strong> to a sales rep:
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

        {/* Lead Detail Modal */}
        {showLeadDetail && detailLead && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowLeadDetail(false)} />
              
              <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {detailLead.suggested_company.brand_name}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-gray-600">
                        {detailLead.suggested_company.segment || 'Restaurant'}
                      </span>
                      {detailLead.suggested_company.location_count && (
                        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {detailLead.suggested_company.location_count} locations
                        </span>
                      )}
                      <span className={`text-sm px-2 py-1 rounded ${
                        detailLead.status === 'approved' ? 'bg-green-100 text-green-700' :
                        detailLead.status === 'denied' ? 'bg-red-100 text-red-700' :
                        detailLead.status === 'snoozed' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {detailLead.status}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLeadDetail(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Added By Info */}
                {detailLead.raw?.added_by_name && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Added by <strong>{detailLead.raw.added_by_name}</strong>
                        {detailLead.raw.added_at && (
                          <span className="ml-2 text-gray-500">
                            on {new Date(detailLead.raw.added_at).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Details */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Company Details</h3>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">Location</dt>
                        <dd className="text-sm text-gray-900">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {detailLead.suggested_location.formatted_address ||
                           `${detailLead.suggested_location.city}, ${detailLead.suggested_location.state}`}
                        </dd>
                      </div>
                      {detailLead.suggested_company.website && (
                        <div>
                          <dt className="text-sm text-gray-500">Website</dt>
                          <dd className="text-sm text-gray-900">
                            <Globe className="h-4 w-4 inline mr-1" />
                            <a href={detailLead.suggested_company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {detailLead.suggested_company.website}
                            </a>
                          </dd>
                        </div>
                      )}
                      {detailLead.suggested_company.phone && (
                        <div>
                          <dt className="text-sm text-gray-500">Phone</dt>
                          <dd className="text-sm text-gray-900">
                            <Phone className="h-4 w-4 inline mr-1" />
                            {detailLead.suggested_company.phone}
                          </dd>
                        </div>
                      )}
                      {detailLead.suggested_company.employee_count && (
                        <div>
                          <dt className="text-sm text-gray-500">Employees</dt>
                          <dd className="text-sm text-gray-900">
                            <Users className="h-4 w-4 inline mr-1" />
                            {detailLead.suggested_company.employee_count}
                          </dd>
                        </div>
                      )}
                      {detailLead.suggested_company.annual_revenue && (
                        <div>
                          <dt className="text-sm text-gray-500">Annual Revenue</dt>
                          <dd className="text-sm text-gray-900">
                            <DollarSign className="h-4 w-4 inline mr-1" />
                            ${(detailLead.suggested_company.annual_revenue / 1000000).toFixed(1)}M
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Scoring */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Lead Scoring</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Lead Score</span>
                        <span className="text-2xl font-bold text-gray-900">{detailLead.score_preview}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Winability</span>
                        <span className="text-2xl font-bold text-blue-600">{detailLead.winability_preview}%</span>
                      </div>
                      {detailLead.signals && detailLead.signals.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600">Signals</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {detailLead.signals.map((signal, idx) => (
                              <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                                {signal.type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-900">Contacts</h3>
                    {!apolloData && (
                      <button
                        onClick={enrichLead}
                        disabled={enriching}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {enriching ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enriching...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Enrich with Apollo
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  
                  {(apolloData?.people || detailLead.suggested_contacts) && (
                    <div className="space-y-2">
                      {(apolloData?.people || detailLead.suggested_contacts || []).map((contact: any, idx: number) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">
                                {contact.name || `${contact.firstName} ${contact.lastName}`}
                              </p>
                              <p className="text-sm text-gray-600">{contact.title}</p>
                              {contact.email && (
                                <p className="text-sm text-gray-500">
                                  <Mail className="h-3 w-3 inline mr-1" />
                                  {contact.email}
                                </p>
                              )}
                              {(contact.phone_numbers?.[0] || contact.phone) && (
                                <p className="text-sm text-gray-500">
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  {contact.phone_numbers?.[0] || contact.phone}
                                </p>
                              )}
                            </div>
                            {(contact.linkedin_url || contact.linkedin) && (
                              <a
                                href={contact.linkedin_url || contact.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Linkedin className="h-5 w-5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {!apolloData && (!detailLead.suggested_contacts || detailLead.suggested_contacts.length === 0) && (
                    <p className="text-sm text-gray-500">No contacts available. Click "Enrich with Apollo" to find contacts.</p>
                  )}
                </div>

                {/* Apollo Company Data */}
                {apolloData?.company && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-3">Apollo Intelligence</h3>
                    <dl className="grid grid-cols-2 gap-4">
                      {apolloData.company.technologies && (
                        <div>
                          <dt className="text-sm text-gray-500">Technologies</dt>
                          <dd className="text-sm text-gray-900">
                            {apolloData.company.technologies.join(', ')}
                          </dd>
                        </div>
                      )}
                      {apolloData.company.keywords && (
                        <div>
                          <dt className="text-sm text-gray-500">Keywords</dt>
                          <dd className="text-sm text-gray-900">
                            {apolloData.company.keywords.join(', ')}
                          </dd>
                        </div>
                      )}
                    </dl>
                    {apolloData.mock && (
                      <p className="text-xs text-gray-500 mt-2">Mock data - Configure APOLLO_API_KEY for real data</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleApproveLead(detailLead.id)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve Lead
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLead(detailLead);
                      setShowAssignModal(true);
                      setShowLeadDetail(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Assign to Rep
                  </button>
                  <button
                    onClick={() => setShowLeadDetail(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
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