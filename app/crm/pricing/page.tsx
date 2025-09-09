'use client'

import { useState, useEffect, Suspense } from 'react'
import { DollarSign, Save, X, Check, Edit2, Building, Search, Plus, Trash2, Percent } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface Product {
  id: number
  name: string
  sku: string
  base_price: number
  category: string
}

interface Company {
  id: number
  name: string
  email: string
  status: string
}

interface PriceListItem {
  id: string
  product_id: number
  product_name: string
  product_sku: string
  base_price: number
  markup_percent: number
  final_price: number
  isNew?: boolean
}

function CompanyPricingContent() {
  const searchParams = useSearchParams()
  const companyIdParam = searchParams.get('company')
  
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [priceList, setPriceList] = useState<PriceListItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{[key: string]: any}>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showNewRow, setShowNewRow] = useState(false)
  const [newItemValues, setNewItemValues] = useState({
    product_id: '',
    markup_percent: 0
  })

  useEffect(() => {
    fetchCompanies()
    fetchProducts()
  }, [])

  useEffect(() => {
    // Auto-select company from URL parameter
    if (companyIdParam && companies.length > 0) {
      const company = companies.find(c => c.id === parseInt(companyIdParam))
      if (company) {
        setSelectedCompany(company)
      }
    }
  }, [companyIdParam, companies])

  useEffect(() => {
    if (selectedCompany) {
      fetchCompanyPriceList(selectedCompany.id)
    }
  }, [selectedCompany])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      const data = await response.json()
      if (data.success) {
        setCompanies(data.data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCompanyPriceList = async (companyId: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/b2b/price-lists?company_id=${companyId}`)
      const data = await response.json()
      
      if (data.success && data.data.length > 0) {
        // Transform the data to our format
        const items = data.data[0].items || []
        const transformedItems = items.map((item: any) => ({
          id: `${companyId}-${item.product_id}`,
          product_id: item.product_id,
          product_name: products.find(p => p.id === item.product_id)?.name || 'Unknown',
          product_sku: item.sku || products.find(p => p.id === item.product_id)?.sku || '',
          base_price: item.retail_price || item.price,
          markup_percent: ((item.price - (item.retail_price || item.price)) / (item.retail_price || item.price)) * 100,
          final_price: item.price
        }))
        setPriceList(transformedItems)
      } else {
        // Initialize with empty price list
        setPriceList([])
      }
    } catch (error) {
      console.error('Error fetching price list:', error)
      setPriceList([])
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: PriceListItem) => {
    setEditingId(item.id)
    setEditValues({
      [item.id]: {
        markup_percent: item.markup_percent
      }
    })
  }

  const handleSave = (item: PriceListItem) => {
    const values = editValues[item.id]
    if (!values) return

    const finalPrice = item.base_price * (1 + values.markup_percent / 100)
    
    // Update local state
    setPriceList(prev => prev.map(p => 
      p.id === item.id 
        ? { ...p, markup_percent: values.markup_percent, final_price: finalPrice }
        : p
    ))
    setEditingId(null)
    setEditValues({})
    setHasUnsavedChanges(true)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({})
  }

  const handleAddNewItem = () => {
    setShowNewRow(true)
    setNewItemValues({
      product_id: '',
      markup_percent: 0
    })
  }

  const handleSaveNewItem = () => {
    if (!newItemValues.product_id || !selectedCompany) return

    const product = products.find(p => p.id === parseInt(newItemValues.product_id))
    if (!product) return

    const finalPrice = product.base_price * (1 + newItemValues.markup_percent / 100)
    const newItem: PriceListItem = {
      id: `${selectedCompany.id}-${product.id}-new-${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      base_price: product.base_price,
      markup_percent: newItemValues.markup_percent,
      final_price: finalPrice,
      isNew: true
    }

    setPriceList(prev => [...prev, newItem])
    setShowNewRow(false)
    setNewItemValues({ product_id: '', markup_percent: 0 })
    setHasUnsavedChanges(true)
  }

  const handleCancelNewItem = () => {
    setShowNewRow(false)
    setNewItemValues({ product_id: '', markup_percent: 0 })
  }

  const handleRemoveProduct = (itemId: string) => {
    setPriceList(prev => prev.filter(p => p.id !== itemId))
    setHasUnsavedChanges(true)
  }

  const handleSaveAll = async () => {
    if (!selectedCompany) return

    try {
      const response = await fetch('/api/b2b/price-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: selectedCompany.id,
          name: `${selectedCompany.name} Price List`,
          items: priceList.map(item => ({
            product_id: item.product_id,
            sku: item.product_sku,
            price: item.final_price,
            retail_price: item.base_price
          }))
        })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        // Remove isNew flag from all items
        setPriceList(prev => prev.map(item => ({ ...item, isNew: false })))
        alert('Price list saved successfully!')
      }
    } catch (error) {
      console.error('Error saving price list:', error)
      alert('Failed to save price list')
    }
  }

  const filteredPriceList = priceList.filter(item =>
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const availableProducts = products.filter(p => 
    !priceList.some(item => item.product_id === p.id)
  )

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DollarSign className="text-blue-600" />
              Company Pricing
            </h1>
            <p className="text-gray-600 mt-1">Manage custom pricing for B2B companies</p>
          </div>
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Save size={16} />
              Save All Changes
            </button>
          )}
        </div>

        {/* Company Selector */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex items-center gap-4">
            <Building className="text-gray-500" size={20} />
            <label className="text-sm font-medium text-gray-700">Select Company:</label>
            <select
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCompany?.id || ''}
              onChange={(e) => {
                const company = companies.find(c => c.id === parseInt(e.target.value))
                setSelectedCompany(company || null)
              }}
            >
              <option value="">Choose a company...</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedCompany && (
          <>
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow mb-6 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Price List Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Price
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Markup %
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Price
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        Loading price list...
                      </td>
                    </tr>
                  ) : (
                    <>
                      {filteredPriceList.map(item => {
                        const isEditing = editingId === item.id
                        const values = isEditing ? editValues[item.id] : null
                        const calculatedPrice = isEditing && values 
                          ? item.base_price * (1 + values.markup_percent / 100)
                          : item.final_price

                        return (
                          <tr key={item.id} className={`hover:bg-gray-50 ${item.isNew ? 'bg-green-50' : ''}`}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {item.product_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {item.product_sku}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              ${item.base_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    step="0.1"
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                    value={values.markup_percent}
                                    onChange={(e) => setEditValues({
                                      ...editValues,
                                      [item.id]: { ...values, markup_percent: parseFloat(e.target.value) || 0 }
                                    })}
                                  />
                                  <Percent size={14} className="text-gray-400" />
                                </div>
                              ) : (
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  item.markup_percent > 0 ? 'bg-green-100 text-green-800' :
                                  item.markup_percent < 0 ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.markup_percent.toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <span className={`font-semibold ${
                                isEditing ? 'text-blue-600' : 'text-gray-900'
                              }`}>
                                ${calculatedPrice.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleSave(item)}
                                    className="text-green-600 hover:text-green-900"
                                    title="Save"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancel}
                                    className="text-red-600 hover:text-red-900"
                                    title="Cancel"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="text-blue-600 hover:text-blue-900"
                                    title="Edit"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleRemoveProduct(item.id)}
                                    className="text-red-600 hover:text-red-900"
                                    title="Remove"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}

                      {/* New Item Row */}
                      {showNewRow ? (
                        <tr className="bg-blue-50">
                          <td className="px-6 py-4" colSpan={2}>
                            <select
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={newItemValues.product_id}
                              onChange={(e) => setNewItemValues({ ...newItemValues, product_id: e.target.value })}
                              autoFocus
                            >
                              <option value="">Select a product...</option>
                              {availableProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right">
                            {newItemValues.product_id && (
                              <span>${products.find(p => p.id === parseInt(newItemValues.product_id))?.base_price.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.1"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                value={newItemValues.markup_percent}
                                onChange={(e) => setNewItemValues({ ...newItemValues, markup_percent: parseFloat(e.target.value) || 0 })}
                              />
                              <Percent size={14} className="text-gray-400" />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            {newItemValues.product_id && (
                              <span className="font-semibold text-blue-600">
                                ${((products.find(p => p.id === parseInt(newItemValues.product_id))?.base_price || 0) * (1 + newItemValues.markup_percent / 100)).toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={handleSaveNewItem}
                                disabled={!newItemValues.product_id}
                                className="text-green-600 hover:text-green-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                                title="Add"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={handleCancelNewItem}
                                className="text-red-600 hover:text-red-900"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-3 text-center">
                            <button
                              onClick={handleAddNewItem}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              <Plus size={14} className="mr-1" />
                              Add Item
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Total Items</div>
                <div className="text-2xl font-bold text-gray-900">{priceList.length}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Average Markup</div>
                <div className="text-2xl font-bold text-green-600">
                  {priceList.length > 0 
                    ? (priceList.reduce((sum, item) => sum + item.markup_percent, 0) / priceList.length).toFixed(1)
                    : 0}%
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-500">Total Value</div>
                <div className="text-2xl font-bold text-blue-600">
                  ${priceList.reduce((sum, item) => sum + item.final_price, 0).toFixed(2)}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CompanyPricingPage() {
  return (
    <Suspense fallback={
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading pricing...</div>
          </div>
        </div>
      </div>
    }>
      <CompanyPricingContent />
    </Suspense>
  )
}