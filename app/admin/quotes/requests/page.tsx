'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  FileText, Search, Eye, Calendar, User, 
  Package, Hash, Palette, Layers, Upload,
  ChevronDown, ChevronUp, Clock, CheckCircle, Plus
} from 'lucide-react';
import Link from 'next/link';

interface QuoteRequest {
  id: string;
  customer: {
    id: string;
    name: string;
  };
  salesRep: {
    id: string;
    name: string;
  };
  items: Array<{
    id: string;
    productService: string;
    additionalDetails: string;
    quantities: Array<{ id: string; value: number; label: string }>;
    colorOptions: Array<{ 
      id: string; 
      colorType: string; 
      customColorDescription?: string; 
      label: string 
    }>;
    pantoneColors: Array<{ id: string; color: string; reference: string }>;
    printedSides: Array<{ id: string; sides: string; label: string }>;
    artFiles: Array<{ fileName: string; id: string }>;
  }>;
  submittedAt: string;
  status: 'pending' | 'reviewed' | 'quoted' | 'rejected';
  createdAt: string;
}

export default function QuoteRequestsPage() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/quotes/submit');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching quote requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItemExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'quoted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'quoted': return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.customer?.name?.toLowerCase().includes(searchLower) ||
      request.salesRep?.name?.toLowerCase().includes(searchLower) ||
      request.items.some(item => 
        item.productService?.toLowerCase().includes(searchLower)
      )
    );
  });

  const formatColorOption = (color: any) => {
    if (color.colorType === 'Other' && color.customColorDescription) {
      return `Other: ${color.customColorDescription}`;
    } else if (color.colorType === 'CMYK') {
      return 'CMYK (Full Color)';
    } else {
      return `${color.colorType} Color${color.colorType !== '1' ? 's' : ''}`;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 mr-3" />
                Quote Requests
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage all quote requests submitted through the form
              </p>
            </div>
            <Link
              href="/quotes/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Quote Request
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {requests.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {requests.filter(r => r.status === 'reviewed').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Quoted</p>
                <p className="text-2xl font-bold text-green-600">
                  {requests.filter(r => r.status === 'quoted').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by customer, sales rep, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              Loading quote requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              No quote requests found
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Request #{request.id}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{request.status}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Customer:</span>
                          <span className="font-medium">{request.customer?.name || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Sales Rep:</span>
                          <span className="font-medium">{request.salesRep?.name || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Submitted:</span>
                          <span className="font-medium">
                            {new Date(request.submittedAt || request.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleItemExpansion(request.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      {expandedItems.has(request.id) ? 
                        <ChevronUp className="h-5 w-5" /> : 
                        <ChevronDown className="h-5 w-5" />
                      }
                    </button>
                  </div>

                  {/* Items Summary */}
                  <div className="border-t pt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>{request.items.length} item{request.items.length !== 1 ? 's' : ''}</span>
                      <span className="text-gray-400">•</span>
                      <span className="font-medium">
                        {request.items.map(item => item.productService).filter(Boolean).join(', ') || 'No products specified'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedItems.has(request.id) && (
                  <div className="border-t bg-gray-50 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Quote Items:</h4>
                    {request.items.map((item, index) => (
                      <div key={item.id} className="mb-4 p-3 bg-white rounded border">
                        <h5 className="font-medium text-gray-900 mb-2">
                          Item {index + 1}: {item.productService || 'Unnamed Item'}
                        </h5>
                        
                        {item.additionalDetails && (
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Details:</span> {item.additionalDetails}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {item.quantities.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                <Hash className="inline h-3 w-3 mr-1" />
                                Quantities:
                              </span> {item.quantities.map(q => q.value).join(', ')}
                            </div>
                          )}
                          
                          {item.colorOptions.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                <Palette className="inline h-3 w-3 mr-1" />
                                Colors:
                              </span> {item.colorOptions.map(c => formatColorOption(c)).join(', ')}
                            </div>
                          )}
                          
                          {item.pantoneColors.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                <Palette className="inline h-3 w-3 mr-1" />
                                Pantone:
                              </span> {item.pantoneColors.map(p => p.color).filter(Boolean).join(', ')}
                            </div>
                          )}
                          
                          {item.printedSides.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                <Layers className="inline h-3 w-3 mr-1" />
                                Printed Sides:
                              </span> {item.printedSides.map(s => `${s.sides} side(s)`).join(', ')}
                            </div>
                          )}
                          
                          {item.artFiles.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                <Upload className="inline h-3 w-3 mr-1" />
                                Art Files:
                              </span> {item.artFiles.length} file(s)
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}