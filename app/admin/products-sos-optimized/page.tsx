'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronRight, ChevronLeft, Search, Package, Database, Loader2, RefreshCw, Link2, Plus, X } from 'lucide-react'

interface SOSItem {
  id: string
  name: string
  sku: string
  description: string
  sos_id: string
}

interface ParentProduct {
  airtable_id: string
  name: string
  st_sku: string
  b2b_id: string
  category: string
  subcategory: string
  sos_count?: number
  has_sos_items?: boolean
  variant_count?: number
  product_variants?: string[]
  variants?: any[]
}

export default function ProductsSOSOptimized() {
  const [parents, setParents] = useState<ParentProduct[]>([])
  const [unmappedSosItems, setUnmappedSosItems] = useState<SOSItem[]>([])
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [loadingVariants, setLoadingVariants] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeTab, setActiveTab] = useState<'parents' | 'unmapped'>('parents')
  const [selectedSosItem, setSelectedSosItem] = useState<SOSItem | null>(null)
  const [showParentModal, setShowParentModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [parentSearchTerm, setParentSearchTerm] = useState('')
  const [mappingLoading, setMappingLoading] = useState(false)
  const [newParentForm, setNewParentForm] = useState({
    name: '',
    category: '',
    description: ''
  })
  const [allParentsForModal, setAllParentsForModal] = useState<ParentProduct[]>([])
  const [successMessage, setSuccessMessage] = useState('')
  const [loadingModalParents, setLoadingModalParents] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [totalParents, setTotalParents] = useState(0)
  const [unmappedPage, setUnmappedPage] = useState(0)
  const [totalUnmapped, setTotalUnmapped] = useState(0)
  const pageSize = 100
  const totalPages = Math.ceil(totalParents / pageSize)
  const unmappedTotalPages = Math.ceil(totalUnmapped / pageSize)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // Fetch everything in parallel for maximum speed
      const [parentsRes, unmappedRes, allParentsRes] = await Promise.all([
        fetch(`/api/products/parents-with-sos-items-lite?page=0&limit=${pageSize}`),
        fetch('/api/products/unmapped-sos-count?page=0&limit=100'),
        fetch('/api/products/parents-with-sos-items-lite?page=0&limit=200') // Preload smaller batch for modal
      ])
      
      const [parentsData, unmappedData, allParentsData] = await Promise.all([
        parentsRes.json(),
        unmappedRes.json(),
        allParentsRes.json()
      ])
      
      setParents(parentsData.parents || [])
      setTotalParents(parentsData.total || 0)
      setCurrentPage(0)
      setUnmappedSosItems(unmappedData.items || [])
      setTotalUnmapped(unmappedData.total || 0)
      setUnmappedPage(0)
      setAllParentsForModal(allParentsData.parents || [])
      
      // Continue loading remaining parents for modal in background
      if (allParentsData.total > 200) {
        loadRemainingParentsForModal(200, allParentsData.total)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }
  
  const loadRemainingParentsForModal = async (start: number, total: number) => {
    const promises = []
    const batchSize = 200 // Smaller batches to avoid timeouts
    for (let offset = start; offset < total; offset += batchSize) {
      promises.push(
        fetch(`/api/products/parents-with-sos-items-lite?page=${Math.floor(offset/100)}&limit=${batchSize}`)
          .then(res => res.json())
      )
    }
    
    try {
      const results = await Promise.all(promises)
      const additionalParents = results.flatMap(r => r.parents || [])
      setAllParentsForModal(prev => [...prev, ...additionalParents])
    } catch (error) {
      console.error('Error loading additional parents:', error)
    }
  }

  const loadPage = async (page: number) => {
    if (page < 0 || (totalPages > 0 && page >= totalPages)) return
    
    setLoadingMore(true)
    setExpandedParents(new Set()) // Clear expanded when changing pages
    try {
      const res = await fetch(`/api/products/parents-with-sos-items-lite?page=${page}&limit=${pageSize}`)
      const data = await res.json()
      
      setParents(data.parents || [])
      setCurrentPage(page)
      // Make sure total is updated
      if (data.total) {
        setTotalParents(data.total)
      }
    } catch (error) {
      console.error('Error loading page:', error)
    }
    setLoadingMore(false)
  }

  const loadUnmappedPage = async (page: number) => {
    if (page < 0 || (unmappedTotalPages > 0 && page >= unmappedTotalPages)) return
    
    setLoadingMore(true)
    try {
      const res = await fetch(`/api/products/unmapped-sos-count?page=${page}&limit=${pageSize}`)
      const data = await res.json()
      
      setUnmappedSosItems(data.items || [])
      setUnmappedPage(page)
      if (data.total) {
        setTotalUnmapped(data.total)
      }
    } catch (error) {
      console.error('Error loading unmapped page:', error)
    }
    setLoadingMore(false)
  }

  const loadVariantsForParent = async (parentId: string) => {
    const parent = parents.find(p => p.airtable_id === parentId)
    if (!parent || !parent.product_variants || parent.variants) return
    
    setLoadingVariants(prev => new Set(prev).add(parentId))
    
    try {
      const res = await fetch(`/api/products/parent-variants/${parentId}`)
      const data = await res.json()
      
      setParents(prev => prev.map(p => 
        p.airtable_id === parentId 
          ? { ...p, variants: data.variants || [] }
          : p
      ))
    } catch (error) {
      console.error('Error loading variants:', error)
    }
    
    setLoadingVariants(prev => {
      const newSet = new Set(prev)
      newSet.delete(parentId)
      return newSet
    })
  }

  const toggleExpand = async (parentId: string) => {
    const newExpanded = new Set(expandedParents)
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId)
    } else {
      newExpanded.add(parentId)
      // Load variants when expanding
      await loadVariantsForParent(parentId)
    }
    setExpandedParents(newExpanded)
  }
  
  const loadAllParentsForModal = async () => {
    if (allParentsForModal.length > 0 || loadingModalParents) return // Don't reload if already loaded
    
    setLoadingModalParents(true)
    try {
      // Load all pages in smaller batches to avoid timeouts
      const batchSize = 200
      const firstRes = await fetch(`/api/products/parents-with-sos-items-lite?page=0&limit=${batchSize}`)
      const firstData = await firstRes.json()
      const total = firstData.total || 0
      const totalPages = Math.ceil(total / batchSize)
      
      // Set first batch immediately
      setAllParentsForModal(firstData.parents || [])
      
      if (totalPages > 1) {
        // Load remaining pages in parallel
        const promises = []
        for (let page = 1; page < totalPages; page++) {
          promises.push(
            fetch(`/api/products/parents-with-sos-items-lite?page=${page}&limit=${batchSize}`)
              .then(res => res.json())
          )
        }
        
        const results = await Promise.all(promises)
        const allParents = [...(firstData.parents || [])]
        results.forEach(data => {
          if (data.parents) {
            allParents.push(...data.parents)
          }
        })
        
        setAllParentsForModal(allParents)
      }
    } catch (error) {
      console.error('Error loading all parents:', error)
    } finally {
      setLoadingModalParents(false)
    }
  }

  const filteredParents = parents.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredUnmapped = unmappedSosItems.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const parentsShown = parents.length
  const parentsWithSOS = parents.filter(p => p.has_sos_items).length
  const totalUnmapped = unmappedSosItems.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Products → SOS Manager (Optimized)</h1>
          <p className="text-gray-600">Fast loading with pagination - Showing page {currentPage + 1} of {totalPages || '...'} ({totalParents || '...'} total parents)</p>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{totalParents}</div>
              <div className="text-sm text-gray-600">Total Parents</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-700">{parentsShown}</div>
              <div className="text-sm text-blue-600">Loaded</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{parentsWithSOS}</div>
              <div className="text-sm text-green-600">With SOS</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-amber-700">{totalUnmapped}</div>
              <div className="text-sm text-amber-600">Unmapped</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 w-96"
              />
            </div>
            
            <button
              onClick={fetchInitialData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('parents')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'parents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <Package className="inline-block h-4 w-4 mr-2" />
                Parent Products
              </button>
              <button
                onClick={() => setActiveTab('unmapped')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'unmapped'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                <Database className="inline-block h-4 w-4 mr-2" />
                Unmapped SOS ({totalUnmapped})
              </button>
            </nav>
          </div>

          {/* Parents Tab */}
          {activeTab === 'parents' && (
            <div className="p-6">
              <div className="space-y-4">
                {filteredParents.map((parent) => (
                  <div key={parent.airtable_id} className="border rounded-lg">
                    <div className={`p-4 ${parent.has_sos_items ? 'bg-green-50' : 'bg-gray-50'} hover:bg-opacity-80`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => toggleExpand(parent.airtable_id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {expandedParents.has(parent.airtable_id) ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </button>
                          
                          <div>
                            <h3 className="font-semibold text-gray-900">{parent.name}</h3>
                            <div className="text-sm text-gray-500 mt-1">
                              {parent.category} • {parent.variant_count || 0} variants
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          {parent.has_sos_items ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {parent.sos_count} SOS items
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                              No SOS items
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {expandedParents.has(parent.airtable_id) && (
                      <div className="border-t p-4">
                        {loadingVariants.has(parent.airtable_id) ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                            <span className="ml-2 text-gray-600">Loading variants...</span>
                          </div>
                        ) : parent.variants && parent.variants.length > 0 ? (
                          <div className="space-y-2">
                            {parent.variants.map((variant: any) => (
                              <div key={variant.airtable_id} className="p-2 bg-gray-50 rounded">
                                <div className="font-medium">{variant.name}</div>
                                {variant.sos_item && (
                                  <div className="text-sm text-green-600 mt-1">
                                    SOS: {variant.sos_item.name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 text-center">No variants loaded</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 py-6 border-t">
                    <button
                      onClick={() => loadPage(currentPage - 1)}
                      disabled={currentPage === 0 || loadingMore}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-2">
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum = i;
                        if (totalPages > 5) {
                          if (currentPage < 3) {
                            pageNum = i;
                          } else if (currentPage > totalPages - 3) {
                            pageNum = totalPages - 5 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                        }
                        
                        if (pageNum >= 0 && pageNum < totalPages) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => loadPage(pageNum)}
                              disabled={loadingMore}
                              className={`px-3 py-1 rounded-lg ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              } disabled:opacity-50`}
                            >
                              {pageNum + 1}
                            </button>
                          )
                        }
                        return null;
                      })}
                    </div>
                    
                    <span className="text-gray-600">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => loadPage(currentPage + 1)}
                      disabled={currentPage === totalPages - 1 || loadingMore}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unmapped Tab */}
          {activeTab === 'unmapped' && (
            <div className="p-6">
              {/* Unmapped Items Stats */}
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-800">
                  Showing {unmappedSosItems.length} of {totalUnmapped} unmapped SOS items
                  {totalUnmapped > 100 && (
                    <span className="ml-2">(Page {unmappedPage + 1} of {unmappedTotalPages})</span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {filteredUnmapped.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.sku} • SOS ID: {item.sos_id}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSosItem(item)
                            setShowParentModal(true)
                            // Load parents if not already loaded
                            if (allParentsForModal.length === 0 && !loadingModalParents) {
                              loadAllParentsForModal()
                            }
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center"
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Link to Parent
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSosItem(item)
                            setNewParentForm({
                              name: item.name.replace(/\s*\/\s*\d+(\(\w+\))?$/, '').trim(),
                              category: 'Uncategorized',
                              description: item.description || ''
                            })
                            setShowCreateModal(true)
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Parent
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination Controls for Unmapped */}
                {unmappedTotalPages > 1 && (
                  <div className="flex items-center justify-center space-x-4 py-6 border-t">
                    <button
                      onClick={() => loadUnmappedPage(unmappedPage - 1)}
                      disabled={unmappedPage === 0 || loadingMore}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    
                    <div className="text-sm text-gray-600">
                      Page {unmappedPage + 1} of {unmappedTotalPages}
                    </div>
                    
                    <button
                      onClick={() => loadUnmappedPage(unmappedPage + 1)}
                      disabled={unmappedPage >= unmappedTotalPages - 1 || loadingMore}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Create Parent Modal */}
        {showCreateModal && selectedSosItem && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false)
                setSelectedSosItem(null)
                setNewParentForm({ name: '', category: '', description: '' })
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create New Parent Product</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedSosItem(null)
                    setNewParentForm({ name: '', category: '', description: '' })
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">Creating parent from: {selectedSosItem.name}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Product Name *
                    </label>
                    <input
                      type="text"
                      value={newParentForm.name}
                      onChange={(e) => setNewParentForm({ ...newParentForm, name: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter parent product name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newParentForm.category}
                      onChange={(e) => setNewParentForm({ ...newParentForm, category: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter category"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newParentForm.description}
                      onChange={(e) => setNewParentForm({ ...newParentForm, description: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Enter description"
                    />
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">
                      <strong>SOS Item Details:</strong><br />
                      SKU: {selectedSosItem.sku}<br />
                      SOS ID: {selectedSosItem.sos_id}<br />
                      {selectedSosItem.description && `Description: ${selectedSosItem.description}`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedSosItem(null)
                    setNewParentForm({ name: '', category: '', description: '' })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateParent()}
                  disabled={!newParentForm.name || mappingLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {mappingLoading ? 'Creating...' : 'Create Parent'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Parent Selection Modal */}
        {showParentModal && selectedSosItem && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowParentModal(false)
                setSelectedSosItem(null)
                setParentSearchTerm('')
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Link SOS Item to Parent Product</h2>
                <button
                  onClick={() => {
                    setShowParentModal(false)
                    setSelectedSosItem(null)
                    setParentSearchTerm('')
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Linking: {selectedSosItem.name}</p>
                <input
                  type="text"
                  placeholder="Search parent products..."
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {loadingModalParents || allParentsForModal.length === 0 ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
                    <p className="text-gray-600 font-medium">Loading {totalParents || '3,500+'} parent products...</p>
                    <p className="text-sm text-gray-500 mt-1">This may take a moment</p>
                  </div>
                ) : (
                  <>
                    <div className="text-sm text-gray-500 mb-2">
                      {allParentsForModal.filter(p => 
                        p.name?.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
                        p.category?.toLowerCase().includes(parentSearchTerm.toLowerCase())
                      ).length} matching parents
                    </div>
                    {allParentsForModal
                      .filter(p => 
                        p.name?.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
                        p.category?.toLowerCase().includes(parentSearchTerm.toLowerCase())
                      )
                      .slice(0, 100) // Limit display for performance
                      .map((parent) => (
                    <div
                      key={parent.airtable_id}
                      className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleLinkToParent(selectedSosItem, parent)}
                    >
                      <div className="font-medium">{parent.name}</div>
                      <div className="text-sm text-gray-500">
                        {parent.category} • {parent.variant_count || 0} variants
                      </div>
                    </div>
                  ))}
                    {allParentsForModal.filter(p => 
                      p.name?.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
                      p.category?.toLowerCase().includes(parentSearchTerm.toLowerCase())
                    ).length > 100 && (
                      <div className="text-center text-sm text-gray-500 py-2">
                        Showing first 100 results. Use search to narrow down.
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
  
  async function handleLinkToParent(sosItem: SOSItem, parent: ParentProduct) {
    setMappingLoading(true)
    try {
      const res = await fetch('/api/products/link-sos-to-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sosItemId: sosItem.id,
          parentId: parent.airtable_id,
          sosItem: sosItem
        })
      })
      
      if (res.ok) {
        // Remove from unmapped list
        setUnmappedSosItems(prev => prev.filter(item => item.id !== sosItem.id))
        setShowParentModal(false)
        setSelectedSosItem(null)
        setParentSearchTerm('')
        // Show success message
        setSuccessMessage(`Successfully linked "${sosItem.name}" to "${parent.name}"`)
        setTimeout(() => setSuccessMessage(''), 5000)
        // Update unmapped count in stats
        const newCount = unmappedSosItems.length - 1
        // Refresh to get updated counts
        await fetchInitialData()
      } else {
        const error = await res.json()
        console.error('Error linking SOS item:', error)
        alert(`Failed to link: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error linking SOS item:', error)
      alert('Failed to link SOS item to parent')
    }
    setMappingLoading(false)
  }
  
  async function handleCreateParent() {
    if (!selectedSosItem || !newParentForm.name) return
    
    setMappingLoading(true)
    try {
      const res = await fetch('/api/products/create-parent-for-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sosItem: selectedSosItem,
          parentName: newParentForm.name,
          category: newParentForm.category || 'Uncategorized'
        })
      })
      
      if (res.ok) {
        // Remove from unmapped list and refresh parents
        setUnmappedSosItems(prev => prev.filter(item => item.id !== selectedSosItem.id))
        setShowCreateModal(false)
        setSelectedSosItem(null)
        setNewParentForm({ name: '', category: '', description: '' })
        // Show success message
        setSuccessMessage(`Successfully created parent "${newParentForm.name}" with SOS item "${selectedSosItem.name}"`)
        setTimeout(() => setSuccessMessage(''), 5000)
        await fetchInitialData()
      } else {
        const error = await res.json()
        console.error('Error creating parent:', error)
        alert(`Failed to create parent: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating parent:', error)
      alert('Failed to create parent product')
    }
    setMappingLoading(false)
  }
}// Force redeploy Fri, Sep 12, 2025  5:36:51 PM
