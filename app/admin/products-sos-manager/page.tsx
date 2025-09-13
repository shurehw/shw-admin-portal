'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Search, Package, Database, Loader2, RefreshCw, Link2, Plus, X } from 'lucide-react'

interface SOSItem {
  id: string
  name: string
  sku: string
  description: string
  sos_id: string
  matched_via?: string
  variant_name?: string
  variant_id?: string
}

interface ParentProduct {
  airtable_id: string
  name: string
  st_sku: string
  b2b_id: string
  category: string
  subcategory: string
  sos_items?: SOSItem[]
  sos_count?: number
}

export default function ProductsSOSManager() {
  const [parents, setParents] = useState<ParentProduct[]>([])
  const [unmappedSosItems, setUnmappedSosItems] = useState<SOSItem[]>([])
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'parents' | 'unmapped'>('parents')
  
  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSosItem, setSelectedSosItem] = useState<SOSItem | null>(null)
  const [selectedParentForLink, setSelectedParentForLink] = useState('')
  const [modalSearchTerm, setModalSearchTerm] = useState('')
  const [newParentName, setNewParentName] = useState('')
  const [newParentCategory, setNewParentCategory] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch parent products with SOS items
      const parentsRes = await fetch('/api/products/parents-with-sos-items')
      const parentsData = await parentsRes.json()
      setParents(parentsData.parents || [])
      
      // Fetch unmapped SOS items
      const unmappedRes = await fetch('/api/products/unmapped-sos-items')
      const unmappedData = await unmappedRes.json()
      setUnmappedSosItems(unmappedData.items || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const toggleExpand = (parentId: string) => {
    const newExpanded = new Set(expandedParents)
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId)
    } else {
      newExpanded.add(parentId)
    }
    setExpandedParents(newExpanded)
  }
  
  const linkSosToParent = async () => {
    if (!selectedSosItem || !selectedParentForLink) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/products/link-sos-to-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sosItemId: selectedSosItem.id,
          parentId: selectedParentForLink,
          sosItem: selectedSosItem
        })
      })
      
      if (res.ok) {
        await fetchData()
        setShowLinkModal(false)
        setSelectedSosItem(null)
        setSelectedParentForLink('')
        setModalSearchTerm('')
      }
    } catch (error) {
      console.error('Error linking SOS item:', error)
    }
    setSaving(false)
  }
  
  const createParentForSos = async () => {
    if (!selectedSosItem || !newParentName.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/products/create-parent-for-sos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sosItem: selectedSosItem,
          parentName: newParentName.trim(),
          category: newParentCategory.trim() || 'Uncategorized'
        })
      })
      
      if (res.ok) {
        await fetchData()
        setShowCreateModal(false)
        setSelectedSosItem(null)
        setNewParentName('')
        setNewParentCategory('')
      }
    } catch (error) {
      console.error('Error creating parent:', error)
    }
    setSaving(false)
  }

  const filteredParents = parents.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sos_items?.some(item => 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const filteredUnmapped = unmappedSosItems.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const modalFilteredParents = parents.filter(p =>
    p.name?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  )

  // Stats
  const totalParents = parents.length
  const parentsWithSOS = parents.filter(p => p.sos_count && p.sos_count > 0).length
  const totalSOSMapped = parents.reduce((sum, p) => sum + (p.sos_count || 0), 0)
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Parent Products → SOS Items Manager</h1>
          <p className="text-gray-600">Direct mapping between Airtable parent products and SOS inventory items</p>
          
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900">{totalParents}</div>
              <div className="text-sm text-gray-600">Total Parents</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">{parentsWithSOS}</div>
              <div className="text-sm text-green-600">Parents with SOS</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-700">{totalSOSMapped}</div>
              <div className="text-sm text-blue-600">SOS Items Mapped</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-amber-700">{totalUnmapped}</div>
              <div className="text-sm text-amber-600">Unmapped SOS</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search parents or SOS items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-96"
                />
              </div>
            </div>
            
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
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
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'parents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="inline-block h-4 w-4 mr-2" />
                Parent Products ({filteredParents.length})
              </button>
              <button
                onClick={() => setActiveTab('unmapped')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'unmapped'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Database className="inline-block h-4 w-4 mr-2" />
                Unmapped SOS Items ({filteredUnmapped.length})
              </button>
            </nav>
          </div>

          {/* Parents Tab */}
          {activeTab === 'parents' && (
            <div className="p-6">
              <div className="space-y-4">
                {filteredParents.map((parent) => (
                  <div key={parent.airtable_id} className="border rounded-lg">
                    {/* Parent Header */}
                    <div className={`p-4 ${parent.sos_count && parent.sos_count > 0 ? 'bg-green-50' : 'bg-gray-50'} hover:bg-opacity-80 transition-colors`}>
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
                            <h3 className="font-semibold text-gray-900">{parent.name || 'Unnamed Product'}</h3>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-sm text-gray-500">Category: {parent.category || 'N/A'}</span>
                              {parent.subcategory && (
                                <span className="text-sm text-gray-500">{parent.subcategory}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {parent.sos_count && parent.sos_count > 0 ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {parent.sos_count} SOS items
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm font-medium">
                              No SOS items
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* SOS Items */}
                    {expandedParents.has(parent.airtable_id) && (
                      <div className="border-t">
                        {parent.sos_items && parent.sos_items.length > 0 ? (
                          <div className="divide-y">
                            {parent.sos_items.map((item) => (
                              <div key={item.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{item.name}</div>
                                    <div className="flex items-center space-x-4 mt-1">
                                      <span className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</span>
                                      <span className="text-sm text-gray-500">SOS ID: {item.sos_id}</span>
                                      <span className="text-sm text-blue-600">Matched via: {item.matched_via}</span>
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                                    )}
                                    {item.variant_name && (
                                      <p className="text-xs text-gray-500 mt-1">From variant: {item.variant_name}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-gray-500 text-center">
                            No SOS items linked to this parent
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped SOS Items Tab */}
          {activeTab === 'unmapped' && (
            <div className="p-6">
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <Database className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-amber-900">Unmapped SOS Items</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      These SOS items exist in your inventory but haven't been linked to any Airtable parent products.
                      They may need new parent products created or manual mapping.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredUnmapped.length > 0 ? (
                  filteredUnmapped.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</span>
                            <span className="text-sm text-gray-500">SOS ID: {item.sos_id}</span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedSosItem(item)
                              setShowLinkModal(true)
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Link to Parent
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSosItem(item)
                              setShowCreateModal(true)
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Create Parent
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No unmapped items match your search' : 'All SOS items are mapped to parent products!'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link SOS to Parent Modal */}
      {showLinkModal && selectedSosItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowLinkModal(false)
            setSelectedSosItem(null)
            setSelectedParentForLink('')
            setModalSearchTerm('')
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Link SOS Item to Parent</h2>
                <p className="text-gray-600 mt-1">
                  Select a parent for: <span className="font-medium">{selectedSosItem.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setSelectedSosItem(null)
                  setSelectedParentForLink('')
                  setModalSearchTerm('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search parent products..."
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {modalFilteredParents.length > 0 ? (
                modalFilteredParents.map((parent) => (
                  <button
                    key={parent.airtable_id}
                    onClick={() => setSelectedParentForLink(parent.airtable_id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedParentForLink === parent.airtable_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{parent.name}</div>
                    <div className="text-sm text-gray-500">
                      {parent.category} • {parent.sos_count || 0} existing SOS items
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No parent products found
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setSelectedSosItem(null)
                  setSelectedParentForLink('')
                  setModalSearchTerm('')
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={linkSosToParent}
                disabled={!selectedParentForLink || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Link to Parent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Parent Modal */}
      {showCreateModal && selectedSosItem && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowCreateModal(false)
            setSelectedSosItem(null)
            setNewParentName('')
            setNewParentCategory('')
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Create Parent Product</h2>
                <p className="text-gray-600 mt-1">
                  For SOS item: <span className="font-medium">{selectedSosItem.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedSosItem(null)
                  setNewParentName('')
                  setNewParentCategory('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Product Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter parent product name..."
                  value={newParentName}
                  onChange={(e) => setNewParentName(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="Enter category (optional)..."
                  value={newParentCategory}
                  onChange={(e) => setNewParentCategory(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedSosItem(null)
                  setNewParentName('')
                  setNewParentCategory('')
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createParentForSos}
                disabled={!newParentName.trim() || saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Parent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}