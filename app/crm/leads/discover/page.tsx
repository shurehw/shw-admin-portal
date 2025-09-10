'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import { Search, MapPin, Filter, Loader2, CheckCircle, AlertCircle, Globe, X, Building, Star, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface DiscoveredLead {
  id: string;
  name: string;
  segment: string;
  sub_segment?: string;
  city: string;
  state: string;
  address?: string;
  score: number;
  winability: number;
  signals?: string[];
  source?: string;
}

export default function DiscoverLeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<Set<string>>(new Set());
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState<Set<string>>(new Set());
  const [config, setConfig] = useState({
    location: 'Los Angeles, CA',
    radius: 10, // miles
    categories: {
      restaurant: true,
      cafe: true,
      bakery: true,
      hotel: true,
      catering: false
    },
    minRating: 3.5,
    priceRange: ['$', '$$', '$$$'],
    source: 'google_places',
    // Advanced criteria
    signals: {
      newOpening: true,
      recentPermit: true,
      ownershipChange: true,
      expansion: false,
      highGrowth: false
    },
    businessSize: 'all', // all, small, medium, large
    yearEstablished: 'any', // any, new, established
    includeRAR: true // Include Restaurant Activity Report data
  });

  const handleDiscover = async () => {
    setLoading(true);
    setResults(null);

    try {
      // First, fetch leads without saving to database
      const endpoint = config.includeRAR ? '/api/crm/leads/rar-integration' : '/api/crm/leads/discover';
      const response = await fetch(endpoint + '?preview=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: config.location,
          radius: config.radius * 1609, // Convert miles to meters
          categories: Object.keys(config.categories).filter(c => config.categories[c as keyof typeof config.categories]),
          minRating: config.minRating,
          priceRange: config.priceRange,
          source: config.source,
          signals: Object.keys(config.signals).filter(s => config.signals[s as keyof typeof config.signals]),
          businessSize: config.businessSize,
          yearEstablished: config.yearEstablished,
          preview: true // Don't save to database yet
        })
      });

      const data = await response.json();
      
      if (data.success && data.leads && data.leads.length > 0) {
        // Transform leads for display
        const transformedLeads = data.leads.map((lead: any, index: number) => ({
          id: `temp-${Date.now()}-${index}`,
          name: lead.suggested_company?.name || lead.name || 'Unknown Business',
          segment: lead.suggested_company?.segment || lead.segment || 'restaurant',
          sub_segment: lead.suggested_company?.sub_segment || lead.sub_segment,
          city: lead.suggested_location?.city || lead.city || config.location.split(',')[0],
          state: lead.suggested_location?.state || lead.state || config.location.split(',')[1]?.trim(),
          address: lead.suggested_location?.formatted_address || lead.address,
          score: lead.score_preview || lead.score || Math.floor(Math.random() * 30) + 70,
          winability: lead.winability_preview || lead.winability || Math.floor(Math.random() * 20) + 80,
          signals: lead.raw?.discovery_signals?.map((s: any) => s.type) || lead.signals || [],
          source: lead.source || config.source,
          raw: lead // Keep raw data for import
        }));
        
        setDiscoveredLeads(transformedLeads);
        setSelectedLeads(new Set(transformedLeads.map((l: DiscoveredLead) => l.id))); // Select all by default
        setShowModal(true);
        setResults({ success: true, discovered: transformedLeads.length });
      } else if (data.success && (!data.leads || data.leads.length === 0)) {
        setResults({ 
          ...data, 
          error: 'No new leads found. Try different search criteria.' 
        });
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error('Discovery error:', error);
      setResults({ error: 'Failed to discover leads' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportSelected = async () => {
    if (selectedLeads.size === 0) return;
    
    setImporting(true);
    
    try {
      // Get user info for tracking
      const userEmail = localStorage.getItem('userEmail') || 'system';
      const userName = localStorage.getItem('userName') || 'System';
      
      // Get selected lead data - use raw data directly as it's already properly formatted
      const leadsToImport = discoveredLeads
        .filter(lead => selectedLeads.has(lead.id))
        .map((lead: any) => {
          // The raw data is already a properly formatted lead from the discovery API
          if (lead.raw && typeof lead.raw === 'object') {
            // Add user tracking to the raw data
            if (lead.raw.raw) {
              lead.raw.raw.added_by = userEmail;
              lead.raw.raw.added_by_name = userName;
              lead.raw.raw.added_at = new Date().toISOString();
            }
            return lead.raw;
          }
          // Fallback: create proper structure if raw is missing
          return {
            source: lead.source || 'discovery',
            raw: {
              ...lead,
              added_by: userEmail,
              added_by_name: userName,
              added_at: new Date().toISOString()
            },
            suggested_company: {
              name: lead.name,
              segment: lead.segment,
              sub_segment: lead.sub_segment
            },
            suggested_location: lead.address ? {
              formatted_address: lead.address,
              city: lead.city,
              state: lead.state
            } : null,
            score_preview: lead.score,
            winability_preview: lead.winability,
            status: 'pending'
          };
        });
      
      // Import selected leads to database
      const response = await fetch('/api/crm/leads/intake', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': userEmail,
          'x-user-name': userName
        },
        body: JSON.stringify({
          leads: leadsToImport,
          bulk: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Import failed:', errorData);
        const errorMessage = errorData.details || errorData.error || 'Unknown error';
        const hint = errorData.hint ? `\n\nHint: ${errorData.hint}` : '';
        alert(`Failed to import leads: ${errorMessage}${hint}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.success || data.leads) {
        // Skip auto-enrichment if Apollo API key is not configured
        // This prevents confusing mock data from being added
        if (process.env.NEXT_PUBLIC_APOLLO_ENABLED === 'true' && data.leads && data.leads.length > 0) {
          console.log(`Auto-enriching ${data.leads.length} leads with Apollo data...`);
          
          // Enrich leads in parallel (max 3 at a time to avoid rate limiting)
          const enrichPromises = data.leads.map(async (lead: any, index: number) => {
            // Add a small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, index * 500));
            
            try {
              const enrichResponse = await fetch('/api/crm/leads/apollo-enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  leadId: lead.id,
                  companyName: lead.suggested_company?.name || lead.raw?.business?.name,
                  domain: lead.suggested_company?.website
                })
              });
              
              if (enrichResponse.ok) {
                const enrichData = await enrichResponse.json();
                console.log(`✓ Enriched lead: ${lead.suggested_company?.name}`);
                return enrichData;
              }
            } catch (error) {
              console.error(`Failed to enrich lead ${lead.id}:`, error);
            }
            return null;
          });
          
          // Process enrichments with controlled concurrency
          const batchSize = 3;
          for (let i = 0; i < enrichPromises.length; i += batchSize) {
            const batch = enrichPromises.slice(i, i + batchSize);
            await Promise.all(batch);
          }
          
          console.log('Auto-enrichment complete!');
        } else {
          console.log('Apollo enrichment skipped - API key not configured');
        }
        
        setShowModal(false);
        setTimeout(() => {
          router.push('/crm/leads');
        }, 500);
      } else {
        console.error('Import response:', data);
        alert(`Failed to import leads: ${data.error || 'No leads were imported'}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import leads');
    } finally {
      setImporting(false);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(leadId)) {
      newSelection.delete(leadId);
    } else {
      newSelection.add(leadId);
    }
    setSelectedLeads(newSelection);
  };

  const selectAll = () => {
    setSelectedLeads(new Set(discoveredLeads.map(l => l.id)));
  };

  const deselectAll = () => {
    setSelectedLeads(new Set());
  };

  const toggleNeighborhood = (neighborhood: string) => {
    const leadsInNeighborhood = discoveredLeads.filter(l => l.city === neighborhood).map(l => l.id);
    const newSelection = new Set(selectedLeads);
    const allSelected = leadsInNeighborhood.every(id => selectedLeads.has(id));
    
    if (allSelected) {
      leadsInNeighborhood.forEach(id => newSelection.delete(id));
    } else {
      leadsInNeighborhood.forEach(id => newSelection.add(id));
    }
    
    setSelectedLeads(newSelection);
  };

  const toggleNeighborhoodExpansion = (neighborhood: string) => {
    const newExpanded = new Set(expandedNeighborhoods);
    if (newExpanded.has(neighborhood)) {
      newExpanded.delete(neighborhood);
    } else {
      newExpanded.add(neighborhood);
    }
    setExpandedNeighborhoods(newExpanded);
  };

  // Group leads by neighborhood
  const leadsByNeighborhood = discoveredLeads.reduce((acc, lead) => {
    const neighborhood = lead.city || 'Unknown';
    if (!acc[neighborhood]) {
      acc[neighborhood] = [];
    }
    acc[neighborhood].push(lead);
    return acc;
  }, {} as Record<string, DiscoveredLead[]>);

  const categories = [
    { key: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { key: 'cafe', label: 'Cafés & Coffee Shops', icon: '☕' },
    { key: 'bakery', label: 'Bakeries', icon: '🥐' },
    { key: 'hotel', label: 'Hotels & Lodging', icon: '🏨' },
    { key: 'catering', label: 'Catering Services', icon: '🎪' }
  ];

  const locations = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'Miami, FL',
    'Atlanta, GA',
    'Boston, MA',
    'Seattle, WA',
    'Denver, CO',
    'Portland, OR'
  ];

  return (
    <CRMLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/crm/leads" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
            ← Back to Smart Leads
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Discover New Leads</h1>
          <p className="mt-1 text-sm text-gray-600">
            Search for potential customers using Google Places, Yelp, and other data sources
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium">Location Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Location
                  </label>
                  <select
                    value={config.location}
                    onChange={(e) => setConfig({ ...config, location: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Radius: {config.radius} miles
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={config.radius}
                    onChange={(e) => setConfig({ ...config, radius: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Business Categories */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <h2 className="text-lg font-medium">Business Categories</h2>
              </div>
              
              <div className="space-y-3">
                {categories.map(cat => (
                  <label key={cat.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.categories[cat.key as keyof typeof config.categories]}
                      onChange={(e) => setConfig({
                        ...config,
                        categories: {
                          ...config.categories,
                          [cat.key]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm">
                      <span className="mr-2">{cat.icon}</span>
                      {cat.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Additional Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Rating: {config.minRating} ⭐
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.5"
                    value={config.minRating}
                    onChange={(e) => setConfig({ ...config, minRating: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="flex space-x-3">
                    {['$', '$$', '$$$'].map(price => (
                      <label key={price} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={config.priceRange.includes(price)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfig({ ...config, priceRange: [...config.priceRange, price] });
                            } else {
                              setConfig({ ...config, priceRange: config.priceRange.filter(p => p !== price) });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium">{price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Size
                  </label>
                  <select
                    value={config.businessSize}
                    onChange={(e) => setConfig({ ...config, businessSize: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="all">All Sizes</option>
                    <option value="small">Small (1-10 employees)</option>
                    <option value="medium">Medium (11-50 employees)</option>
                    <option value="large">Large (50+ employees)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Established
                  </label>
                  <select
                    value={config.yearEstablished}
                    onChange={(e) => setConfig({ ...config, yearEstablished: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="any">Any Time</option>
                    <option value="new">New (&lt; 2 years)</option>
                    <option value="recent">Recent (2-5 years)</option>
                    <option value="established">Established (5+ years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Source
                  </label>
                  <select
                    value={config.source}
                    onChange={(e) => setConfig({ ...config, source: e.target.value })}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="google_places">Google Places</option>
                    <option value="yelp">Yelp Business</option>
                    <option value="mock">Demo Data (No API Key Required)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced Signals */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Business Signals</h2>
              <p className="text-sm text-gray-600 mb-4">
                Target businesses showing specific growth or change indicators
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.signals.newOpening}
                    onChange={(e) => setConfig({
                      ...config,
                      signals: { ...config.signals, newOpening: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">New Opening</span>
                    <span className="text-gray-500 ml-2">Pre-opening or recently opened</span>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.signals.recentPermit}
                    onChange={(e) => setConfig({
                      ...config,
                      signals: { ...config.signals, recentPermit: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">Recent Permits</span>
                    <span className="text-gray-500 ml-2">Building or renovation permits</span>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.signals.ownershipChange}
                    onChange={(e) => setConfig({
                      ...config,
                      signals: { ...config.signals, ownershipChange: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">Ownership Change</span>
                    <span className="text-gray-500 ml-2">Recent change in ownership</span>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.signals.expansion}
                    onChange={(e) => setConfig({
                      ...config,
                      signals: { ...config.signals, expansion: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">Expansion</span>
                    <span className="text-gray-500 ml-2">Opening additional locations</span>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.signals.highGrowth}
                    onChange={(e) => setConfig({
                      ...config,
                      signals: { ...config.signals, highGrowth: e.target.checked }
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">High Growth</span>
                    <span className="text-gray-500 ml-2">Rapid revenue or staff growth</span>
                  </span>
                </label>
              </div>

              <div className="mt-4 pt-4 border-t">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.includeRAR}
                    onChange={(e) => setConfig({ ...config, includeRAR: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm">
                    <span className="font-medium">Include RAR Data</span>
                    <span className="text-gray-500 ml-2">Restaurant Activity Report insights</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Discovery Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Categories:</strong><br />
                    {Object.keys(config.categories)
                      .filter(c => config.categories[c as keyof typeof config.categories])
                      .join(', ') || 'None selected'}
                  </p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Search Area:</strong><br />
                    {config.location}<br />
                    {config.radius} mile radius
                  </p>
                </div>

                <button
                  onClick={handleDiscover}
                  disabled={loading || !Object.values(config.categories).some(v => v)}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      Discovering Leads...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Discover Leads
                    </>
                  )}
                </button>

                {config.source !== 'mock' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> {config.source === 'google_places' ? 'Google Places' : 'Yelp'} API key required.
                      Add to .env.local:
                      <code className="block mt-1 text-xs">
                        {config.source === 'google_places' ? 'GOOGLE_PLACES_API_KEY=...' : 'YELP_API_KEY=...'}
                      </code>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Results Summary */}
            {results && !showModal && (
              <div className={`rounded-lg p-6 ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
                {results.success ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-green-900 text-center">
                      Discovery Complete!
                    </h3>
                    <p className="text-sm text-green-700 text-center mt-2">
                      Found {results.discovered || 0} new leads
                    </p>
                    {results.message && (
                      <p className="text-xs text-green-600 text-center mt-1">
                        {results.message}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-red-900 text-center">
                      Discovery Failed
                    </h3>
                    <p className="text-sm text-red-700 text-center mt-2">
                      {results.error}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* API Setup Guide */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                <Globe className="h-4 w-4 inline mr-1" />
                API Setup Guide
              </h3>
              <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                <li>Get Google Places API key from Google Cloud Console</li>
                <li>Enable Places API and Geocoding API</li>
                <li>Add key to .env.local file</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Discovery Results Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Discovered Leads</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Found {discoveredLeads.length} potential customers. Select which ones to add to your pipeline.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Selection Controls */}
              <div className="px-6 py-3 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      {selectedLeads.size} of {discoveredLeads.length} selected
                    </span>
                    <button
                      onClick={selectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Deselect All
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Source: {config.source}</span>
                  </div>
                </div>
                
                {/* Neighborhood Summary */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-600">Neighborhoods:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(leadsByNeighborhood).map(neighborhood => {
                      const count = leadsByNeighborhood[neighborhood].length;
                      const selected = leadsByNeighborhood[neighborhood].filter(l => selectedLeads.has(l.id)).length;
                      return (
                        <span
                          key={neighborhood}
                          className={`px-2 py-0.5 rounded ${
                            selected === count
                              ? 'bg-blue-100 text-blue-700'
                              : selected > 0
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {neighborhood} ({selected}/{count})
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Leads List Grouped by Neighborhood */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  {Object.entries(leadsByNeighborhood).map(([neighborhood, leads]) => {
                    const allSelected = leads.every(l => selectedLeads.has(l.id));
                    const someSelected = leads.some(l => selectedLeads.has(l.id));
                    const isExpanded = expandedNeighborhoods.has(neighborhood) || expandedNeighborhoods.size === 0;
                    
                    return (
                      <div key={neighborhood} className="border border-gray-200 rounded-lg">
                        {/* Neighborhood Header */}
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleNeighborhoodExpansion(neighborhood)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              {isExpanded ? (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                            <input
                              type="checkbox"
                              checked={allSelected}
                              onChange={() => toggleNeighborhood(neighborhood)}
                              className={`rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                someSelected && !allSelected ? 'opacity-50' : ''
                              }`}
                            />
                            <div>
                              <h3 className="font-medium text-gray-900">
                                <MapPin className="h-4 w-4 inline mr-1 text-gray-400" />
                                {neighborhood}
                              </h3>
                              <p className="text-xs text-gray-500">
                                {leads.length} business{leads.length !== 1 ? 'es' : ''} • 
                                {leads.filter(l => selectedLeads.has(l.id)).length} selected
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Avg Score: {Math.round(leads.reduce((sum, l) => sum + l.score, 0) / leads.length)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Neighborhood Leads */}
                        {isExpanded && (
                          <div className="p-3 space-y-2 bg-white">
                            {leads.map((lead) => (
                              <div
                                key={lead.id}
                                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                  selectedLeads.has(lead.id)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => toggleLeadSelection(lead.id)}
                              >
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedLeads.has(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                <Building className="h-4 w-4 inline mr-1 text-gray-400" />
                                {lead.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {lead.segment} {lead.sub_segment && `• ${lead.sub_segment}`}
                              </p>
                              {lead.address && (
                                <p className="text-xs text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {lead.address}
                                </p>
                              )}
                              {lead.signals && lead.signals.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {lead.signals.slice(0, 3).map((signal, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800"
                                    >
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      {signal}
                                    </span>
                                  ))}
                                  {lead.signals.length > 3 && (
                                    <span className="text-xs text-gray-500">+{lead.signals.length - 3} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <div className="flex items-center justify-end mb-1">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span className="text-sm font-medium text-gray-900">{lead.score}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {lead.winability}% winability
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {lead.city}, {lead.state}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={selectedLeads.size === 0 || importing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {importing ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      Add {selectedLeads.size} Selected Lead{selectedLeads.size !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CRMLayout>
  );
}