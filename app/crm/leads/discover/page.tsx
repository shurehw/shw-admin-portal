'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import { Search, MapPin, Filter, Loader2, CheckCircle, AlertCircle, Globe } from 'lucide-react';
import Link from 'next/link';

export default function DiscoverLeadsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [config, setConfig] = useState({
    location: 'New York, NY',
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
    source: 'google_places'
  });

  const handleDiscover = async () => {
    setLoading(true);
    setResults(null);

    try {
      const response = await fetch('/api/crm/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: config.location,
          radius: config.radius * 1609, // Convert miles to meters
          categories: Object.keys(config.categories).filter(c => config.categories[c as keyof typeof config.categories]),
          minRating: config.minRating,
          priceRange: config.priceRange,
          source: config.source
        })
      });

      const data = await response.json();
      setResults(data);

      if (data.success) {
        setTimeout(() => {
          router.push('/crm/leads');
        }, 3000);
      }
    } catch (error) {
      console.error('Discovery error:', error);
      setResults({ error: 'Failed to discover leads' });
    } finally {
      setLoading(false);
    }
  };

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

            {/* Results */}
            {results && (
              <div className={`rounded-lg p-6 ${results.success ? 'bg-green-50' : 'bg-red-50'}`}>
                {results.success ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-green-900 text-center">
                      Discovery Complete!
                    </h3>
                    <p className="text-sm text-green-700 text-center mt-2">
                      Found {results.discovered} new leads
                    </p>
                    <p className="text-xs text-green-600 text-center mt-2">
                      Redirecting to leads page...
                    </p>
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
      </div>
    </CRMLayout>
  );
}