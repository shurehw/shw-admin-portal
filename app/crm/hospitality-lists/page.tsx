'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Download, Upload, 
  Building2, MapPin, DollarSign, TrendingUp, Target,
  Wine, Coffee, Pizza, CheckCircle2, XCircle
} from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone?: string;
  email?: string;
  capacity?: number;
  liquor_license_type?: string;
  liquor_license_status?: string;
  annual_revenue?: string;
  alcohol_sales_percentage?: number;
  decision_maker_name?: string;
  decision_maker_title?: string;
  decision_maker_email?: string;
  status: string;
  opportunity_score?: number;
  created_at?: string;
}

export default function HospitalityListsPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    city: 'all',
    status: 'all'
  });

  // Mock data for demonstration
  const mockVenues: Venue[] = [
    {
      id: '1',
      name: "Tony's Italian Kitchen",
      type: 'restaurant',
      address: '123 Main St',
      city: 'Boston',
      state: 'MA',
      zip_code: '02101',
      phone: '(617) 555-0123',
      email: 'info@tonysitalian.com',
      capacity: 120,
      liquor_license_type: 'full',
      liquor_license_status: 'active',
      annual_revenue: '$1M-$2M',
      alcohol_sales_percentage: 35,
      decision_maker_name: 'Tony Marino',
      decision_maker_title: 'Owner',
      decision_maker_email: 'tony@tonysitalian.com',
      status: 'prospect',
      opportunity_score: 85
    },
    {
      id: '2',
      name: 'The Dive Bar',
      type: 'bar',
      address: '456 Oak Ave',
      city: 'Miami',
      state: 'FL',
      zip_code: '33101',
      phone: '(305) 555-0456',
      email: 'manager@divebar.com',
      capacity: 80,
      liquor_license_type: 'full',
      liquor_license_status: 'active',
      annual_revenue: '$500K-$1M',
      alcohol_sales_percentage: 75,
      decision_maker_name: 'Sarah Johnson',
      decision_maker_title: 'Manager',
      status: 'contacted',
      opportunity_score: 72
    },
    {
      id: '3',
      name: 'Sunrise Coffee Co',
      type: 'cafe',
      address: '789 Coffee Blvd',
      city: 'Seattle',
      state: 'WA',
      zip_code: '98101',
      phone: '(206) 555-0789',
      capacity: 45,
      liquor_license_type: 'beer_wine',
      liquor_license_status: 'pending',
      annual_revenue: '$200K-$500K',
      alcohol_sales_percentage: 15,
      decision_maker_name: 'Mike Chen',
      decision_maker_title: 'Owner',
      status: 'qualified',
      opportunity_score: 68
    },
    {
      id: '4',
      name: 'Club Midnight',
      type: 'nightclub',
      address: '321 Party St',
      city: 'Las Vegas',
      state: 'NV',
      zip_code: '89101',
      phone: '(702) 555-0321',
      email: 'info@clubmidnight.com',
      capacity: 500,
      liquor_license_type: 'full',
      liquor_license_status: 'active',
      annual_revenue: '$5M-$10M',
      alcohol_sales_percentage: 85,
      decision_maker_name: 'Jessica Lee',
      decision_maker_title: 'General Manager',
      status: 'customer',
      opportunity_score: 95
    },
    {
      id: '5',
      name: 'Craft Brew House',
      type: 'brewery',
      address: '555 Hop Lane',
      city: 'Portland',
      state: 'OR',
      zip_code: '97201',
      phone: '(503) 555-0555',
      email: 'brew@craftbrewhouse.com',
      capacity: 150,
      liquor_license_type: 'brewery',
      liquor_license_status: 'active',
      annual_revenue: '$2M-$5M',
      alcohol_sales_percentage: 90,
      decision_maker_name: 'Tom Wilson',
      decision_maker_title: 'Brewmaster',
      status: 'prospect',
      opportunity_score: 88
    }
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setVenues(mockVenues);
      setLoading(false);
    }, 500);
  }, []);

  // Filter venues
  const filteredVenues = venues.filter(venue => {
    if (searchTerm && !venue.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.type !== 'all' && venue.type !== filters.type) {
      return false;
    }
    if (filters.city !== 'all' && venue.city !== filters.city) {
      return false;
    }
    if (filters.status !== 'all' && venue.status !== filters.status) {
      return false;
    }
    return true;
  });

  const getVenueIcon = (type: string) => {
    switch(type) {
      case 'bar': return <Wine className="w-4 h-4" />;
      case 'restaurant': return <Pizza className="w-4 h-4" />;
      case 'cafe': return <Coffee className="w-4 h-4" />;
      case 'nightclub': return <Building2 className="w-4 h-4" />;
      case 'brewery': return <Wine className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any }> = {
      prospect: { color: 'bg-blue-100 text-blue-800', icon: Target },
      contacted: { color: 'bg-yellow-100 text-yellow-800', icon: Users },
      qualified: { color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
      customer: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      closed_lost: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.prospect;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Hospitality Venues</h1>
          <p className="mt-2 text-gray-600">Manage bars, restaurants, and entertainment venues</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Total Venues</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{venues.length}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Active Customers</div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {venues.filter(v => v.status === 'customer').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Qualified Leads</div>
            <div className="mt-2 text-3xl font-bold text-purple-600">
              {venues.filter(v => v.status === 'qualified').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm font-medium text-gray-500">Avg Opportunity Score</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {venues.length > 0 
                ? Math.round(venues.reduce((acc, v) => acc + (v.opportunity_score || 0), 0) / venues.length)
                : 0}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search venues..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="bar">Bar</option>
              <option value="restaurant">Restaurant</option>
              <option value="cafe">Cafe</option>
              <option value="nightclub">Nightclub</option>
              <option value="brewery">Brewery</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="prospect">Prospect</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="customer">Customer</option>
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Add Venue
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading venues...</div>
          ) : filteredVenues.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No venues found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVenues.map((venue) => (
                  <tr key={venue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getVenueIcon(venue.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{venue.name}</div>
                          <div className="text-sm text-gray-500">{venue.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{venue.city}, {venue.state}</div>
                      <div className="text-sm text-gray-500">{venue.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{venue.decision_maker_name}</div>
                      <div className="text-sm text-gray-500">{venue.decision_maker_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(venue.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{venue.opportunity_score}</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${venue.opportunity_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
  );
}