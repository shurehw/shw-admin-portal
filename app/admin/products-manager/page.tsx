'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Save, X, Search, Package, AlertCircle, Link2, Unlink, Loader2, Plus, Database } from 'lucide-react'

interface ParentProduct {
  airtable_id: string
  name: string
  st_sku: string
  b2b_id: string
  category: string
  subcategory: string
  variant_count: number
  product_variants: string[]
  variants?: VariantProduct[]
}

interface VariantProduct {
  airtable_id: string
  name: string
  sos_id: string
  b2b_id: string
  style_code: string
  quantity_available: number
  cost: number
  sos_item?: {
    id: string
    name: string
    sku: string
    description: string
  }
}

interface SOSItem {
  id: string
  name: string
  sku: string
  description: string
  sos_id: string
}

export default function ProductsManager() {
  const [parents, setParents] = useState<ParentProduct[]>([])
  const [orphanedVariants, setOrphanedVariants] = useState<VariantProduct[]>([])
  const [unmappedSosItems, setUnmappedSosItems] = useState<SOSItem[]>([])
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'parents' | 'orphans' | 'unmapped'>('parents')
  const [showOnlyMatched, setShowOnlyMatched] = useState(true)
  
  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<VariantProduct | null>(null)
  const [modalSearchTerm, setModalSearchTerm] = useState('')
  const [selectedParentForLink, setSelectedParentForLink] = useState<string>('')
  
  // Add variant modal
  const [showAddVariantModal, setShowAddVariantModal] = useState(false)
  const [selectedParentForAdd, setSelectedParentForAdd] = useState<ParentProduct | null>(null)
  const [variantSearchTerm, setVariantSearchTerm] = useState('')
  
  // Create parent modal
  const [showCreateParentModal, setShowCreateParentModal] = useState(false)
  const [selectedVariantForParent, setSelectedVariantForParent] = useState<VariantProduct | null>(null)
  const [newParentName, setNewParentName] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch parent products with variants
      const parentsRes = await fetch('/api/products/parents-with-variants')
      const parentsData = await parentsRes.json()
      setParents(parentsData.parents || [])
      
      // Fetch orphaned variants
      const orphansRes = await fetch('/api/products/orphaned-variants')
      const orphansData = await orphansRes.json()
      setOrphanedVariants(orphansData.variants || [])
      
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

  const linkVariantToParent = async () => {
    if (!selectedVariant || !selectedParentForLink) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/products/link-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          variantId: selectedVariant.airtable_id, 
          parentId: selectedParentForLink 
        })
      })
      
      if (res.ok) {
        await fetchData()
        setShowLinkModal(false)
        setSelectedVariant(null)
        setSelectedParentForLink('')
        setModalSearchTerm('')
      }
    } catch (error) {
      console.error('Error linking variant:', error)
    }
    setSaving(false)
  }
  
  const addVariantToParent = async (variantId: string) => {
    if (!selectedParentForAdd) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/products/link-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          variantId: variantId, 
          parentId: selectedParentForAdd.airtable_id 
        })
      })
      
      if (res.ok) {
        await fetchData()
        setShowAddVariantModal(false)
        setSelectedParentForAdd(null)
        setVariantSearchTerm('')
      }
    } catch (error) {
      console.error('Error adding variant:', error)
    }
    setSaving(false)
  }

  const unlinkVariant = async (variantId: string, parentId: string) => {
    if (!confirm('Are you sure you want to unlink this variant?')) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/products/unlink-variant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, parentId })
      })
      
      if (res.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error unlinking variant:', error)
    }
    setSaving(false)
  }
  
  const createParentFromVariant = async () => {
    if (!selectedVariantForParent || !newParentName.trim()) return
    
    setSaving(true)
    try {
      const res = await fetch('/api/products/create-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          variantId: selectedVariantForParent.airtable_id,
          parentName: newParentName.trim()
        })
      })
      
      if (res.ok) {
        await fetchData()
        setShowCreateParentModal(false)
        setSelectedVariantForParent(null)
        setNewParentName('')
      }
    } catch (error) {
      console.error('Error creating parent:', error)
    }
    setSaving(false)
  }

  const filteredParents = parents.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.st_sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredOrphans = orphanedVariants.filter(v =>
    v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.style_code?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const filteredUnmapped = unmappedSosItems.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const modalFilteredParents = parents.filter(p =>
    p.name?.toLowerCase().includes(modalSearchTerm.toLowerCase())
  )
  
  const filteredOrphansForAdd = orphanedVariants.filter(v =>
    v.name?.toLowerCase().includes(variantSearchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Products Manager</h1>
          <p className="text-gray-600">Manage parent products and their variants with SOS item relationships</p>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
                />
              </div>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyMatched}
                  onChange={(e) => setShowOnlyMatched(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Show only SOS items</span>
              </label>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {filteredParents.length} parents | {orphanedVariants.length} orphans | {unmappedSosItems.length} unmapped
                </span>
              </div>
            </div>
            
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
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
                onClick={() => setActiveTab('orphans')}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'orphans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <AlertCircle className="inline-block h-4 w-4 mr-2" />
                Orphaned Variants ({filteredOrphans.length})
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
                    <div className="p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
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
                              <span className="text-sm text-gray-500">SKU: {parent.st_sku || 'N/A'}</span>
                              <span className="text-sm text-gray-500">B2B: {parent.b2b_id || 'N/A'}</span>
                              <span className="text-sm text-gray-500">Category: {parent.category || 'N/A'}</span>
                              <span className="text-sm text-gray-500">{parent.subcategory || ''}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {parent.variant_count} variants
                          </span>
                          {parent.variants && parent.variants.filter(v => v.sos_item).length > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              {parent.variants.filter(v => v.sos_item).length} SOS linked
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedParentForAdd(parent)
                              setShowAddVariantModal(true)
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                          >
                            <Link2 className="h-4 w-4 mr-1" />
                            Add Variant
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Variants */}
                    {expandedParents.has(parent.airtable_id) && (
                      <div className="border-t">
                        {parent.variants && parent.variants.length > 0 ? (
                          <div className="divide-y">
                            {(() => {
                              const filteredVariants = parent.variants.filter(variant => 
                                showOnlyMatched ? variant.sos_item : true
                              );
                              
                              if (filteredVariants.length === 0) {
                                return (
                                  <div className="p-4 text-gray-500 text-center">
                                    {showOnlyMatched 
                                      ? "No SOS items found for this parent" 
                                      : "No variants found"}
                                  </div>
                                );
                              }
                              
                              return filteredVariants.map((variant) => (
                              <div key={variant.airtable_id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{variant.name}</div>
                                    <div className="flex items-center space-x-4 mt-1">
                                      <span className="text-sm text-gray-500">SOS: {variant.sos_id || 'N/A'}</span>
                                      <span className="text-sm text-gray-500">B2B: {variant.b2b_id || 'N/A'}</span>
                                      <span className="text-sm text-gray-500">Style: {variant.style_code || 'N/A'}</span>
                                      <span className="text-sm text-gray-500">Qty: {variant.quantity_available || 0}</span>
                                      <span className="text-sm text-gray-500">Cost: ${variant.cost || 0}</span>
                                    </div>
                                    {variant.sos_item && (
                                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                        <span className="text-green-700 font-medium">SOS Item:</span>
                                        <span className="text-green-600 ml-2">{variant.sos_item.name}</span>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => unlinkVariant(variant.airtable_id, parent.airtable_id)}
                                    className="p-2 text-red-600 hover:text-red-700"
                                    title="Unlink variant"
                                  >
                                    <Unlink className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ));
                            })()}
                          </div>
                        ) : (
                          <div className="p-4 text-gray-500 text-center">
                            No variants linked
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orphans Tab */}
          {activeTab === 'orphans' && (
            <div className="p-6">
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-amber-900">Orphaned Variants</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      These variants exist in the Products table but are not linked to any parent product.
                      Click "Link to Parent" to associate them with a parent product.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {filteredOrphans.map((variant) => (
                  <div key={variant.airtable_id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{variant.name}</div>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">SOS: {variant.sos_id || 'N/A'}</span>
                          <span className="text-sm text-gray-500">B2B: {variant.b2b_id || 'N/A'}</span>
                          <span className="text-sm text-gray-500">Style: {variant.style_code || 'N/A'}</span>
                          <span className="text-sm text-gray-500">Cost: ${variant.cost || 0}</span>
                        </div>
                        {variant.sos_item && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                            <span className="text-green-700 font-medium">SOS Item:</span>
                            <span className="text-green-600 ml-2">{variant.sos_item.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedVariant(variant)
                            setShowLinkModal(true)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
                        >
                          <Link2 className="h-4 w-4 mr-1" />
                          Link to Parent
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVariantForParent(variant)
                            setShowCreateParentModal(true)
                          }}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Parent
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmapped SOS Items Tab */}
          {activeTab === 'unmapped' && (
            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Database className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h3 className="font-medium text-blue-900">Unmapped SOS Items</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      These SOS items exist in your inventory but haven't been linked to any Airtable products yet.
                      They may need to be mapped to existing variants or have new products created for them.
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
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'No unmapped items match your search' : 'All SOS items are mapped!'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link Variant Modal */}
      {showLinkModal && selectedVariant && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowLinkModal(false)
            setSelectedVariant(null)
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
                <h2 className="text-xl font-semibold">Link Variant to Parent</h2>
                <p className="text-gray-600 mt-1">
                  Select a parent for: <span className="font-medium">{selectedVariant.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setSelectedVariant(null)
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
                      {parent.category} • {parent.variant_count} existing variants
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
                  setSelectedVariant(null)
                  setSelectedParentForLink('')
                  setModalSearchTerm('')
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={linkVariantToParent}
                disabled={!selectedParentForLink || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Link Variant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showAddVariantModal && selectedParentForAdd && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowAddVariantModal(false)
            setSelectedParentForAdd(null)
            setVariantSearchTerm('')
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Add Variant to Parent</h2>
                <p className="text-gray-600 mt-1">
                  Adding variant to: <span className="font-medium">{selectedParentForAdd.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddVariantModal(false)
                  setSelectedParentForAdd(null)
                  setVariantSearchTerm('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search orphaned variants..."
                value={variantSearchTerm}
                onChange={(e) => setVariantSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {filteredOrphansForAdd.length > 0 ? (
                filteredOrphansForAdd.map((variant) => (
                  <button
                    key={variant.airtable_id}
                    onClick={() => addVariantToParent(variant.airtable_id)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium">{variant.name}</div>
                    <div className="text-sm text-gray-500">
                      SOS: {variant.sos_id || 'N/A'} • Cost: ${variant.cost || 0}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No orphaned variants found
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowAddVariantModal(false)
                  setSelectedParentForAdd(null)
                  setVariantSearchTerm('')
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Parent Modal */}
      {showCreateParentModal && selectedVariantForParent && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowCreateParentModal(false)
            setSelectedVariantForParent(null)
            setNewParentName('')
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
                  Creating parent for: <span className="font-medium">{selectedVariantForParent.name}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateParentModal(false)
                  setSelectedVariantForParent(null)
                  setNewParentName('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent Product Name
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
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateParentModal(false)
                  setSelectedVariantForParent(null)
                  setNewParentName('')
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createParentFromVariant}
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