'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  Image, Upload, Send, Check, X, Clock, Download,
  MessageSquare, Eye, Trash2, RefreshCw, Trello,
  FileText, Calendar, AlertCircle, CheckCircle, Loader
} from 'lucide-react';

interface ArtProof {
  id: string;
  trelloCardId?: string;
  customerName: string;
  customerEmail: string;
  projectName: string;
  description: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision';
  files: Array<{
    id: string;
    name: string;
    url: string;
    version: number;
    uploadedAt: string;
  }>;
  comments: Array<{
    id: string;
    author: string;
    text: string;
    timestamp: string;
  }>;
  createdAt: string;
  updatedAt: string;
  deadline?: string;
}

export default function ArtProofsFull() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [proofs, setProofs] = useState<ArtProof[]>([]);
  const [selectedProof, setSelectedProof] = useState<ArtProof | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user has production/art team access
  useEffect(() => {
    // Skip role check for now - hardcoded admin access
    // In production, implement proper role-based access control
  }, [router]);

  // Load art proofs
  const loadProofs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/proxy?path=api/proofs');
      if (response.ok) {
        const data = await response.json();
        setProofs(data.proofs || []);
      } else {
        // Fallback to mock data if API is not available
        const mockProofs: ArtProof[] = [
          {
            id: '1',
            customerName: 'Marriott International',
            customerEmail: 'branding@marriott.com',
            projectName: 'Custom Napkins - Logo Embossing',
            description: 'White dinner napkins with embossed Marriott logo, 3-ply, 16x16 inches',
            status: 'in_review',
            files: [
              {
                id: 'f1',
                name: 'napkin_design_v1.pdf',
                url: '#',
                version: 1,
                uploadedAt: new Date().toISOString()
              }
            ],
            comments: [
              {
                id: 'c1',
                author: 'John Smith (Marriott)',
                text: 'Can we make the logo 15% larger?',
                timestamp: new Date().toISOString()
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            customerName: 'Hilton Hotels',
            customerEmail: 'marketing@hilton.com',
            projectName: 'Custom Glassware - Etched Logo',
            description: '16oz water glasses with laser-etched Hilton logo',
            status: 'approved',
            files: [
              {
                id: 'f2',
                name: 'glassware_mockup.jpg',
                url: '#',
                version: 2,
                uploadedAt: new Date().toISOString()
              }
            ],
            comments: [
              {
                id: 'c2',
                author: 'Sarah Johnson (Hilton)',
                text: 'Perfect! Approved for production.',
                timestamp: new Date().toISOString()
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
        setProofs(mockProofs);
      }
    } catch (error) {
      console.error('Error loading proofs:', error);
      setError('Failed to load art proofs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProofs();
  }, []);

  // Upload new proof version
  const uploadProofVersion = async (proofId: string) => {
    if (!uploadFile) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('proofId', proofId);
    
    try {
      const response = await fetch('/api/admin/quote-builder/proxy?path=api/proofs/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setSuccessMessage('New version uploaded successfully');
        setUploadFile(null);
        loadProofs();
      } else {
        setError('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  // Update proof status
  const updateProofStatus = async (proofId: string, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/proxy?path=api/proofs/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofId, status: newStatus })
      });
      
      if (response.ok) {
        setSuccessMessage(`Proof ${newStatus}`);
        loadProofs();
        setSelectedProof(null);
      } else {
        setError('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  // Add comment
  const addComment = async (proofId: string) => {
    if (!newComment) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/proxy?path=api/proofs/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          proofId, 
          comment: newComment,
          author: 'Production Team'
        })
      });
      
      if (response.ok) {
        setNewComment('');
        loadProofs();
      } else {
        setError('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      in_review: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Eye },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: X },
      revision: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: RefreshCw }
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredProofs = filterStatus === 'all' 
    ? proofs 
    : proofs.filter(p => p.status === filterStatus);

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Art Proof Management</h1>
          <p className="text-gray-600 mt-1">
            Manage artwork proofs with version control and customer approvals
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Proofs</p>
                <p className="text-2xl font-bold">{proofs.length}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Review</p>
                <p className="text-2xl font-bold">
                  {proofs.filter(p => p.status === 'in_review').length}
                </p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">
                  {proofs.filter(p => p.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Revision</p>
                <p className="text-2xl font-bold">
                  {proofs.filter(p => p.status === 'revision').length}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Filter and Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revision">Needs Revision</option>
              </select>
            </div>
            <button
              onClick={loadProofs}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Proofs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProofs.map(proof => (
              <div key={proof.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg">{proof.projectName}</h3>
                    {getStatusBadge(proof.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div>{proof.customerName}</div>
                    {proof.deadline && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Due: {new Date(proof.deadline).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {proof.files.length} file(s) • v{proof.files[proof.files.length - 1]?.version || 1}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{proof.description}</p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProof(proof)}
                      className="flex-1 px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm"
                    >
                      View Details
                    </button>
                    {proof.status === 'in_review' && (
                      <>
                        <button
                          onClick={() => updateProofStatus(proof.id, 'approved')}
                          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          title="Approve"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateProofStatus(proof.id, 'revision')}
                          className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                          title="Request Revision"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProofs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Image className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No art proofs found</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedProof && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedProof.projectName}</h2>
                    <p className="text-gray-600">{selectedProof.customerName}</p>
                  </div>
                  <button
                    onClick={() => setSelectedProof(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Files */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4">Proof Files</h3>
                  <div className="space-y-2">
                    {selectedProof.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-3 text-gray-500" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              Version {file.version} • {new Date(file.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-800">
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Upload new version */}
                  <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <input
                      type="file"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex items-center justify-center">
                      <Upload className="h-5 w-5 mr-2 text-gray-400" />
                      <span className="text-gray-600">Upload new version</span>
                    </label>
                    {uploadFile && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm">{uploadFile.name}</span>
                        <button
                          onClick={() => uploadProofVersion(selectedProof.id)}
                          className="px-3 py-1 bg-gray-900 text-white rounded text-sm"
                        >
                          Upload
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Comments */}
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-4">Comments & Feedback</h3>
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {selectedProof.comments.map(comment => (
                      <div key={comment.id} className="bg-gray-50 rounded p-3">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                      onClick={() => addComment(selectedProof.id)}
                      className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}