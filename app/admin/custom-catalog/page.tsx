'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { supabase } from '@/lib/supabase'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore'
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Copy, Upload, Download, Search, Filter, Grid, List, DollarSign, Package, RefreshCw, Database } from 'lucide-react'

interface Supplier {
  id?: string
  name: string
  company: string
  email: string
  phone: string
  website?: string
  status: 'active' | 'inactive'
}

interface VolumePrice {
  min_quantity: number
  max_quantity?: number
  price: number
  supplier_id?: string
  supplier_name?: string
  starting_quantity?: number
}

interface ProductVariant {
  id?: string
  name: string
  sku_suffix: string
  price_modifier: number
  stock_quantity: number
  attributes: Record<string, string>
}

interface ProductOption {
  id?: string
  name: string
  type: 'color' | 'size' | 'material' | 'custom'
  values: string[]
  required: boolean
}

interface CustomProduct {
  id?: string
  product_name: string
  sku: string
  category: string
  subcategory?: string
  base_price: number
  cost?: number
  description: string
  long_description?: string
  image_url?: string
  additional_images?: string[]
  status: 'active' | 'draft' | 'discontinued'
  featured: boolean
  tags: string[]
  source?: 'firebase' | 'supabase'
  
  // Inventory
  stock_quantity?: number
  low_stock_threshold?: number
  track_inventory: boolean
  
  // Pricing
  compare_at_price?: number
  volume_prices: VolumePrice[]
  
  // Variants & Options
  has_variants: boolean
  variants?: ProductVariant[]
  options?: ProductOption[]
  
  // Supplier info
  primary_supplier_id?: string
  suppliers_by_volume?: {
    supplier_id: string
    supplier_name: string
    min_qty: number
    max_qty?: number
    price: number
    lead_time_days?: number
  }[]
  
  // SEO & Meta
  meta_title?: string
  meta_description?: string
  seo_url?: string
  
  // Timestamps
  created_at?: Date
  updated_at?: Date
  
  // Supabase specific fields
  big_commerce_id?: string
  shureprint_artboard_image?: string
  image_data?: string
  category_id?: number
}

export default function CustomCatalogPage() {
  const [products, setProducts] = useState<CustomProduct[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingSupabase, setLoadingSupabase] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showForm, setShowForm] = useState(false)
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<CustomProduct | null>(null)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'import'>('products')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterSource, setFilterSource] = useState<string>('')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [supabaseProductsCount, setSupabaseProductsCount] = useState(0)
  
  const [formData, setFormData] = useState<CustomProduct>({
    product_name: '',
    sku: '',
    category: '',
    base_price: 0,
    description: '',
    status: 'draft',
    featured: false,
    tags: [],
    track_inventory: false,
    volume_prices: [],
    has_variants: false,
    suppliers_by_volume: []
  })

  const [supplierFormData, setSupplierFormData] = useState<Supplier>({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'active'
  })

  useEffect(() => {
    // Set a timeout to ensure loading state clears
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
      }
    }, 5000)
    
    loadData()
    loadSupabaseProducts()
    
    return () => clearTimeout(timeout)
  }, [])

  const loadData = async () => {
    try {
      // Load products from Firebase
      const productsSnapshot = await getDocs(collection(db, 'custom_products'))
      const loadedProducts: CustomProduct[] = []
      productsSnapshot.forEach((doc) => {
        loadedProducts.push({ 
          id: doc.id, 
          ...doc.data(),
          source: 'firebase'
        } as CustomProduct)
      })
      setProducts(prev => {
        // Keep Supabase products and update Firebase products
        const supabaseProducts = prev.filter(p => p.source === 'supabase')
        return [...supabaseProducts, ...loadedProducts]
      })

      // Load suppliers
      const suppliersSnapshot = await getDocs(collection(db, 'suppliers'))
      const loadedSuppliers: Supplier[] = []
      suppliersSnapshot.forEach((doc) => {
        loadedSuppliers.push({ id: doc.id, ...doc.data() } as Supplier)
      })
      setSuppliers(loadedSuppliers)
    } catch (error) {
      console.error('Error loading data from Firebase:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSupabaseProducts = async () => {
    setLoadingSupabase(true)
    try {
      console.log('Loading products from Supabase...')
      
      // Load main products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            category,
            big_commerce_id
          ),
          suppliers (
            id,
            name,
            company
          )
        `)
      
      if (productsError) {
        console.error('Error loading products from Supabase:', productsError)
        return
      }

      // Load suppliers by volume
      const { data: suppliersByVolumeData, error: suppliersByVolumeError } = await supabase
        .from('suppliers_by_volume')
        .select(`
          *,
          suppliers (
            id,
            name,
            company
          )
        `)
      
      if (suppliersByVolumeError) {
        console.error('Error loading suppliers by volume:', suppliersByVolumeError)
      }

      // Load volume prices
      const { data: volumePricesData, error: volumePricesError } = await supabase
        .from('volume_prices')
        .select('*')
      
      if (volumePricesError) {
        console.error('Error loading volume prices:', volumePricesError)
      }

      // Map Supabase products to our format
      const supabaseProducts: CustomProduct[] = (productsData || []).map(product => {
        // Find suppliers by volume for this product
        const productSuppliersByVolume = (suppliersByVolumeData || [])
          .filter(sv => sv.product_id === product.id)
          .map(sv => ({
            supplier_id: sv.supplier_id,
            supplier_name: sv.suppliers?.name || sv.supplier_name || '',
            min_qty: sv.min_qty || 0,
            max_qty: sv.max_qty,
            price: sv.price || 0,
            lead_time_days: sv.lead_time_days
          }))

        // Find volume prices for this product
        const productVolumePrices = (volumePricesData || [])
          .filter(vp => {
            // Check if the product name matches
            try {
              const nameArray = JSON.parse(vp.product_name_from_product_from_variant || '[]')
              return nameArray[0] === product.product_name
            } catch {
              return false
            }
          })
          .map(vp => ({
            min_quantity: vp.min_quantity || vp.starting_quantity || 0,
            max_quantity: vp.max_quantity,
            price: vp.price || 0,
            starting_quantity: vp.starting_quantity
          }))
          .sort((a, b) => a.min_quantity - b.min_quantity)

        return {
          id: `supabase_${product.id}`,
          product_name: product.product_name || product.name || '',
          sku: product.sku || '',
          category: product.categories?.category || product.category || '',
          subcategory: product.subcategory,
          base_price: product.base_price || 0,
          cost: product.cost,
          description: product.description || '',
          long_description: product.long_description,
          image_url: product.image_data || product.shureprint_artboard_image || product.image_url,
          status: product.status || 'active',
          featured: product.featured || false,
          tags: product.tags || [],
          source: 'supabase' as const,
          track_inventory: false,
          volume_prices: productVolumePrices,
          has_variants: false,
          suppliers_by_volume: productSuppliersByVolume,
          big_commerce_id: product.big_commerce_id,
          shureprint_artboard_image: product.shureprint_artboard_image,
          image_data: product.image_data,
          category_id: product.category_id
        }
      })

      console.log(`Loaded ${supabaseProducts.length} products from Supabase`)
      setSupabaseProductsCount(supabaseProducts.length)
      
      // Merge with existing Firebase products
      setProducts(prev => {
        const firebaseProducts = prev.filter(p => p.source === 'firebase')
        return [...supabaseProducts, ...firebaseProducts]
      })
    } catch (error) {
      console.error('Error loading products from Supabase:', error)
    } finally {
      setLoadingSupabase(false)
    }
  }

  const syncProductToFirebase = async (product: CustomProduct) => {
    try {
      // Remove Supabase-specific fields and prepare for Firebase
      const { id, source, big_commerce_id, shureprint_artboard_image, image_data, category_id, ...productData } = product
      
      const firebaseProduct = {
        ...productData,
        created_at: new Date(),
        updated_at: new Date()
      }

      await addDoc(collection(db, 'custom_products'), firebaseProduct)
      await loadData()
      alert(`Product "${product.product_name}" has been synced to Firebase`)
    } catch (error) {
      console.error('Error syncing product to Firebase:', error)
      alert('Error syncing product. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const productData = {
        ...formData,
        updated_at: new Date()
      }

      if (editingProduct?.id) {
        // Check if it's a Supabase product
        if (editingProduct.source === 'supabase') {
          // For Supabase products, save to Firebase as a new custom product
          const { id, source, ...newProductData } = productData
          newProductData.created_at = new Date()
          await addDoc(collection(db, 'custom_products'), newProductData)
        } else {
          // For Firebase products, update normally
          const productRef = doc(db, 'custom_products', editingProduct.id.replace('supabase_', ''))
          await updateDoc(productRef, productData)
        }
      } else {
        productData.created_at = new Date()
        await addDoc(collection(db, 'custom_products'), productData)
      }
      
      await loadData()
      resetForm()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSupplier?.id) {
        const supplierRef = doc(db, 'suppliers', editingSupplier.id)
        await updateDoc(supplierRef, supplierFormData)
      } else {
        await addDoc(collection(db, 'suppliers'), supplierFormData)
      }
      
      await loadData()
      resetSupplierForm()
    } catch (error) {
      console.error('Error saving supplier:', error)
    }
  }

  const handleDelete = async (productId: string) => {
    // Check if it's a Supabase product
    if (productId.startsWith('supabase_')) {
      alert('Supabase products cannot be deleted from here. They must be managed in the Supabase database.')
      return
    }

    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'custom_products', productId))
        await loadData()
      } catch (error) {
        console.error('Error deleting product:', error)
      }
    }
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteDoc(doc(db, 'suppliers', supplierId))
        await loadData()
      } catch (error) {
        console.error('Error deleting supplier:', error)
      }
    }
  }

  const handleEdit = (product: CustomProduct) => {
    setEditingProduct(product)
    setFormData(product)
    setShowForm(true)
  }

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    setSupplierFormData(supplier)
    setShowSupplierForm(true)
  }

  const handleDuplicate = (product: CustomProduct) => {
    const duplicatedProduct = {
      ...product,
      product_name: `${product.product_name} (Copy)`,
      sku: `${product.sku}-COPY`,
      id: undefined,
      source: 'firebase' as const
    }
    setFormData(duplicatedProduct)
    setEditingProduct(null)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      product_name: '',
      sku: '',
      category: '',
      base_price: 0,
      description: '',
      status: 'draft',
      featured: false,
      tags: [],
      track_inventory: false,
      volume_prices: [],
      has_variants: false,
      suppliers_by_volume: []
    })
    setEditingProduct(null)
    setShowForm(false)
  }

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      status: 'active'
    })
    setEditingSupplier(null)
    setShowSupplierForm(false)
  }

  const addVolumePricing = () => {
    setFormData({
      ...formData,
      volume_prices: [...(formData.volume_prices || []), { min_quantity: 0, price: 0 }]
    })
  }

  const updateVolumePricing = (index: number, field: keyof VolumePrice, value: any) => {
    const newPricing = [...(formData.volume_prices || [])]
    newPricing[index] = { ...newPricing[index], [field]: value }
    setFormData({ ...formData, volume_prices: newPricing })
  }

  const removeVolumePricing = (index: number) => {
    const newPricing = (formData.volume_prices || []).filter((_, i) => i !== index)
    setFormData({ ...formData, volume_prices: newPricing })
  }

  const addSupplierByVolume = () => {
    setFormData({
      ...formData,
      suppliers_by_volume: [...(formData.suppliers_by_volume || []), {
        supplier_id: '',
        supplier_name: '',
        min_qty: 0,
        price: 0
      }]
    })
  }

  const updateSupplierByVolume = (index: number, field: string, value: any) => {
    const newSuppliers = [...(formData.suppliers_by_volume || [])]
    newSuppliers[index] = { ...newSuppliers[index], [field]: value }
    
    // Update supplier name when ID changes
    if (field === 'supplier_id') {
      const supplier = suppliers.find(s => s.id === value)
      if (supplier) {
        newSuppliers[index].supplier_name = supplier.name
      }
    }
    
    setFormData({ ...formData, suppliers_by_volume: newSuppliers })
  }

  const removeSupplierByVolume = (index: number) => {
    const newSuppliers = (formData.suppliers_by_volume || []).filter((_, i) => i !== index)
    setFormData({ ...formData, suppliers_by_volume: newSuppliers })
  }

  const exportProducts = () => {
    const dataStr = JSON.stringify(products, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `products_export_${new Date().toISOString().split('T')[0]}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importProducts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const importedProducts = JSON.parse(text)
      
      if (!Array.isArray(importedProducts)) {
        alert('Invalid file format. Expected an array of products.')
        return
      }

      // Add imported products to Firestore
      for (const product of importedProducts) {
        const { id, source, ...productData } = product
        await addDoc(collection(db, 'custom_products'), {
          ...productData,
          created_at: new Date(),
          updated_at: new Date()
        })
      }

      await loadData()
      alert(`Successfully imported ${importedProducts.length} products`)
    } catch (error) {
      console.error('Error importing products:', error)
      alert('Error importing products. Please check the file format.')
    }
  }

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || product.category === filterCategory
    const matchesStatus = !filterStatus || product.status === filterStatus
    const matchesSource = !filterSource || product.source === filterSource
    return matchesSearch && matchesCategory && matchesStatus && matchesSource
  })

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  if (loading && !products.length) {
    return <div className="p-6">Loading custom catalog...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Custom Product Catalog</h1>
        <div className="flex gap-2 items-center">
          {loadingSupabase && (
            <div className="flex items-center text-blue-600">
              <RefreshCw className="animate-spin mr-2" size={18} />
              Loading Supabase...
            </div>
          )}
          <button
            onClick={loadSupabaseProducts}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
            disabled={loadingSupabase}
          >
            <Database size={18} />
            Refresh Supabase ({supabaseProductsCount})
          </button>
          <button
            onClick={exportProducts}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export
          </button>
          <label className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 cursor-pointer">
            <Upload size={18} />
            Import
            <input
              type="file"
              accept=".json"
              onChange={importProducts}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suppliers'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Suppliers ({suppliers.length})
          </button>
        </nav>
      </div>

      {activeTab === 'products' && (
        <>
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow mb-6 p-4">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="discontinued">Discontinued</option>
              </select>
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="border rounded px-3 py-2"
              >
                <option value="">All Sources</option>
                <option value="supabase">Supabase</option>
                <option value="firebase">Custom</option>
              </select>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                >
                  <List size={20} />
                </button>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Product
              </button>
            </div>
          </div>

          {/* Product Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
                <h2 className="text-xl font-semibold mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                  {editingProduct?.source === 'supabase' && (
                    <span className="text-sm text-purple-600 ml-2">(Will save as custom product)</span>
                  )}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SKU *</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Base Price *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.base_price}
                        onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Cost</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost || ''}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || undefined })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="discontinued">Discontinued</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Image URL</label>
                      <input
                        type="text"
                        value={formData.image_url || ''}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="col-span-2 flex items-center gap-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.featured}
                          onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                          className="mr-2"
                        />
                        Featured Product
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.track_inventory}
                          onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                          className="mr-2"
                        />
                        Track Inventory
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.has_variants}
                          onChange={(e) => setFormData({ ...formData, has_variants: e.target.checked })}
                          className="mr-2"
                        />
                        Has Variants
                      </label>
                    </div>
                  </div>

                  {/* Volume Pricing Section */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Volume Pricing</h3>
                      <button
                        type="button"
                        onClick={addVolumePricing}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Add Tier
                      </button>
                    </div>
                    {(formData.volume_prices || []).map((tier, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="number"
                          placeholder="Min Qty"
                          value={tier.min_quantity}
                          onChange={(e) => updateVolumePricing(index, 'min_quantity', parseInt(e.target.value))}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="Max Qty (optional)"
                          value={tier.max_quantity || ''}
                          onChange={(e) => updateVolumePricing(index, 'max_quantity', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={tier.price}
                          onChange={(e) => updateVolumePricing(index, 'price', parseFloat(e.target.value))}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeVolumePricing(index)}
                          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Supplier by Volume Section */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Suppliers by Volume</h3>
                      <button
                        type="button"
                        onClick={addSupplierByVolume}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Add Supplier
                      </button>
                    </div>
                    {(formData.suppliers_by_volume || []).map((supplier, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <select
                          value={supplier.supplier_id}
                          onChange={(e) => updateSupplierByVolume(index, 'supplier_id', e.target.value)}
                          className="flex-1 border rounded px-3 py-2"
                        >
                          <option value="">Select Supplier</option>
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Min Qty"
                          value={supplier.min_qty}
                          onChange={(e) => updateSupplierByVolume(index, 'min_qty', parseInt(e.target.value))}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <input
                          type="number"
                          placeholder="Max Qty"
                          value={supplier.max_qty || ''}
                          onChange={(e) => updateSupplierByVolume(index, 'max_qty', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          value={supplier.price}
                          onChange={(e) => updateSupplierByVolume(index, 'price', parseFloat(e.target.value))}
                          className="flex-1 border rounded px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeSupplierByVolume(index)}
                          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Products Display */}
          {viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <React.Fragment key={product.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.source === 'supabase' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {product.source === 'supabase' ? 'Supabase' : 'Custom'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <button
                              onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                              className="mr-2 text-gray-500 hover:text-gray-700"
                            >
                              {expandedProduct === product.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                            </button>
                            <div>
                              <div className="font-medium">{product.product_name}</div>
                              <div className="text-sm text-gray-500">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{product.sku}</td>
                        <td className="px-6 py-4 text-sm">{product.category}</td>
                        <td className="px-6 py-4 text-sm">
                          ${(product.base_price || 0).toFixed(2)}
                          {product.volume_prices && product.volume_prices.length > 0 && (
                            <div className="text-xs text-gray-500">
                              {product.volume_prices.length} volume tiers
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.status === 'active' ? 'bg-green-100 text-green-800' : 
                            product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDuplicate(product)}
                              className="text-green-600 hover:text-green-900"
                              title="Duplicate"
                            >
                              <Copy size={18} />
                            </button>
                            {product.source === 'supabase' ? (
                              <button
                                onClick={() => syncProductToFirebase(product)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Sync to Firebase"
                              >
                                <Database size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => product.id && handleDelete(product.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedProduct === product.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-gray-50">
                            <div className="grid grid-cols-2 gap-4">
                              {/* Volume Pricing */}
                              {product.volume_prices && product.volume_prices.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Volume Pricing</h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left py-1">Quantity</th>
                                        <th className="text-left py-1">Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.volume_prices.map((tier, idx) => (
                                        <tr key={idx}>
                                          <td className="py-1">
                                            {tier.min_quantity || tier.starting_quantity || 0}
                                            {tier.max_quantity ? `-${tier.max_quantity}` : '+'}
                                          </td>
                                          <td className="py-1">${(tier.price || 0).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                              
                              {/* Suppliers */}
                              {product.suppliers_by_volume && product.suppliers_by_volume.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-2">Suppliers by Volume</h4>
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left py-1">Supplier</th>
                                        <th className="text-left py-1">Qty Range</th>
                                        <th className="text-left py-1">Price</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {product.suppliers_by_volume.map((supplier, idx) => (
                                        <tr key={idx}>
                                          <td className="py-1">{supplier.supplier_name}</td>
                                          <td className="py-1">
                                            {supplier.min_qty}{supplier.max_qty ? `-${supplier.max_qty}` : '+'}
                                          </td>
                                          <td className="py-1">${(supplier.price || 0).toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                              {/* Image Preview if available */}
                              {product.image_url && (
                                <div className="col-span-2">
                                  <h4 className="font-semibold mb-2">Image Preview</h4>
                                  <img 
                                    src={product.image_url} 
                                    alt={product.product_name}
                                    className="max-h-32 object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found. Try adjusting your filters or add a new product.
                </div>
              )}
            </div>
          ) : (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow relative">
                  <div className="absolute top-2 right-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.source === 'supabase' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {product.source === 'supabase' ? 'DB' : 'Custom'}
                    </span>
                  </div>
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.product_name}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E'
                      }}
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{product.product_name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{product.sku}</p>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl font-bold">${(product.base_price || 0).toFixed(2)}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 
                        product.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-blue-600 text-white py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDuplicate(product)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Duplicate"
                      >
                        <Copy size={18} />
                      </button>
                      {product.source === 'supabase' ? (
                        <button
                          onClick={() => syncProductToFirebase(product)}
                          className="p-1 text-purple-600 hover:text-purple-800"
                          title="Sync"
                        >
                          <Database size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => product.id && handleDelete(product.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'suppliers' && (
        <>
          <div className="mb-4">
            <button
              onClick={() => setShowSupplierForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Supplier
            </button>
          </div>

          {/* Supplier Form Modal */}
          {showSupplierForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h2>
                <form onSubmit={handleSupplierSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name *</label>
                      <input
                        type="text"
                        value={supplierFormData.name}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Company *</label>
                      <input
                        type="text"
                        value={supplierFormData.company}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, company: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={supplierFormData.email}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone *</label>
                      <input
                        type="tel"
                        value={supplierFormData.phone}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Website</label>
                      <input
                        type="url"
                        value={supplierFormData.website || ''}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, website: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={supplierFormData.status}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, status: e.target.value as any })}
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                    </button>
                    <button
                      type="button"
                      onClick={resetSupplierForm}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Suppliers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{supplier.name}</td>
                    <td className="px-6 py-4 text-sm">{supplier.company}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{supplier.email}</div>
                      <div className="text-gray-500">{supplier.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        supplier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditSupplier(supplier)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => supplier.id && handleDeleteSupplier(supplier.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No suppliers added yet. Add your first supplier above.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}