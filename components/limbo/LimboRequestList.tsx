'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Archive, Eye, Edit, 
  ChevronDown, Calendar, User, Package, Tag, DollarSign,
  AlertCircle, Clock, CheckCircle, X
} from 'lucide-react';

interface LimboRequest {
  id: string;
  type: string;
  name_of_item?: string;
  brand_specific?: boolean;
  brand_name?: string;
  reference_link?: string;
  preferred_vendor?: string;
  stock_double_check?: boolean;
  par_requested?: number;
  prev_price?: number;
  case_pack_number?: number;
  status: string;
  archived: boolean;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  sales_rep_name?: string;
  created_at: string;
  updated_at: string;
  sp_customer_field?: string;
}

interface LimboRequestListProps {
  requests: LimboRequest[];
  loading: boolean;
  onArchive: (id: string) => void;
  onRefresh: () => void;
  currentUser: any;
}

export default function LimboRequestList({ 
  requests, 
  loading, 
  onArchive, 
  onRefresh,
  currentUser 
}: LimboRequestListProps) {
  const [filteredRequests, setFilteredRequests] = useState<LimboRequest[]>(requests);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LimboRequest | null>(null);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchTerm, filterType, filterStatus, sortBy, sortOrder]);

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.name_of_item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.creator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.preferred_vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.sp_customer_field?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(req => req.type === filterType);
    }

    // Status filter
    if (filterStatus === 'active') {
      filtered = filtered.filter(req => !req.archived);
    } else if (filterStatus === 'archived') {
      filtered = filtered.filter(req => req.archived);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy as keyof LimboRequest];
      let bVal = b[sortBy as keyof LimboRequest];
      
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredRequests(filtered);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'New Stock Item': return 'bg-cyan-100 text-cyan-800';
      case 'Specialty': return 'bg-blue-100 text-blue-800';
      case 'Need Better Pricing': return 'bg-teal-100 text-teal-800';
      case 'New Source Please': return 'bg-green-100 text-green-800';
      case 'Sample ONLY - Rush': return 'bg-yellow-100 text-yellow-800';
      case 'Convert to Stock': return 'bg-orange-100 text-orange-800';
      case 'Update Par-Request from Sales': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (request: LimboRequest) => {
    if (request.archived) {
      return <Archive className="h-4 w-4 text-gray-400" />;
    }
    switch (request.status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const canEdit = (request: LimboRequest) => {
    return request.creator_id === currentUser?.id || currentUser?.role === 'admin';
  };

  const canArchive = (request: LimboRequest) => {
    return request.creator_id === currentUser?.id && !request.archived;
  };

  const typeOptions = [
    'New Stock Item',
    'Specialty',
    'Need Better Pricing',
    'New Source Please',
    'Sample ONLY - Rush',
    'Convert to Stock',
    'Update Par-Request from Sales'
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {typeOptions.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="created_at">Date Created</option>
            <option value="updated_at">Last Updated</option>
            <option value="type">Type</option>
            <option value="creator_name">Creator</option>
            <option value="par_requested">Par Requested</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          <button
            onClick={onRefresh}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Refresh
          </button>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredRequests.length} of {requests.length} requests
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Par / Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request.id} className={request.archived ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusIcon(request)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(request.type)}`}>
                      {request.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.name_of_item || 'N/A'}
                      </div>
                      {request.brand_name && (
                        <div className="text-xs text-gray-500">Brand: {request.brand_name}</div>
                      )}
                      {request.preferred_vendor && (
                        <div className="text-xs text-gray-500">Vendor: {request.preferred_vendor}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.sp_customer_field || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {request.par_requested && (
                        <div className="flex items-center">
                          <Package className="h-3 w-3 mr-1 text-gray-400" />
                          {request.par_requested}
                        </div>
                      )}
                      {request.prev_price && (
                        <div className="flex items-center text-green-600">
                          <DollarSign className="h-3 w-3" />
                          {request.prev_price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{request.creator_name}</div>
                      {request.sales_rep_name && (
                        <div className="text-xs text-gray-500">Rep: {request.sales_rep_name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(request.created_at).toLocaleDateString()}</div>
                    <div className="text-xs">{new Date(request.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {canEdit(request) && (
                        <button
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {canArchive(request) && (
                        <button
                          onClick={() => onArchive(request.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No requests found matching your criteria
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Request Details</h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(selectedRequest.type)}`}>
                        {selectedRequest.type}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1 text-sm">{selectedRequest.archived ? 'Archived' : 'Active'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Item Name</label>
                  <p className="mt-1 text-sm">{selectedRequest.name_of_item || 'N/A'}</p>
                </div>

                {selectedRequest.brand_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Brand</label>
                    <p className="mt-1 text-sm">{selectedRequest.brand_name}</p>
                  </div>
                )}

                {selectedRequest.reference_link && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reference Link</label>
                    <p className="mt-1 text-sm">
                      <a href={selectedRequest.reference_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {selectedRequest.reference_link}
                      </a>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Par Requested</label>
                    <p className="mt-1 text-sm">{selectedRequest.par_requested || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Previous Price</label>
                    <p className="mt-1 text-sm">
                      {selectedRequest.prev_price ? `$${selectedRequest.prev_price.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer</label>
                    <p className="mt-1 text-sm">{selectedRequest.sp_customer_field || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Sales Rep</label>
                    <p className="mt-1 text-sm">{selectedRequest.sales_rep_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Creator</label>
                    <p className="mt-1 text-sm">{selectedRequest.creator_name}</p>
                    <p className="text-xs text-gray-500">{selectedRequest.creator_email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="mt-1 text-sm">
                      {new Date(selectedRequest.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}