'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Package, Search, Grid, List, AlertTriangle, TrendingUp, TrendingDown, Eye, RefreshCw, Download, Bell, Filter } from 'lucide-react'

interface Product {
  id: number | string
  name: string
  sku: string
  price: number
  cost?: number
  sale_price?: number
  inventory_level: number
  inventory_warning_level: number
  is_low_stock: boolean
  is_out_of_stock: boolean
  backorder_enabled: boolean
  category: string
  brand?: string
  is_visible: boolean
  is_featured: boolean
  image_url?: string
  description?: string
  purchase_description?: string
  vendor_part_number?: string
  created_at: string
  updated_at: string
}

interface StockAlert {
  id: string
  product_id: number
  product_name: string
  sku: string
  current_stock: number
  threshold: number
  alert_type: 'low_stock' | 'out_of_stock' | 'back_in_stock'
  status: 'active' | 'resolved' | 'acknowledged'
  created_at: string
  notes?: string
}

export default function ProductsInventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [sortBy, setSortBy] = useState('name')
  const [showAlerts, setShowAlerts] = useState(false)
  const [activeTab, setActiveTab] = useState<'products' | 'alerts'>('products')
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(100)

  useEffect(() => {
    fetchProducts()
    fetchAlerts()
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      checkStockAlerts()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [categoryFilter, stockFilter, sortBy, currentPage])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      // Fetch from inventory API which includes stock data
      const offset = (currentPage - 1) * productsPerPage
      const response = await fetch(`/api/inventory?category=${categoryFilter}&low_stock_only=${stockFilter === 'lowstock' ? 'true' : 'false'}&limit=${productsPerPage}&offset=${offset}`)
      const data = await response.json()
      
      if (data.data) {
        setProducts(data.data)
        setTotalProducts(data.totalInDatabase || data.total || data.data.length)
        
        // Log the count for debugging
        console.log(`Loaded ${data.data.length} products out of ${data.totalInDatabase} total`)
        
        if (data.message) {
          console.log(data.message)
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      // Mock data for demonstration
      setProducts([
        {
          id: 1,
          name: 'Premium Hotel Keycard',
          sku: 'HC-001',
          price: 2.50,
          sale_price: 2.25,
          inventory_level: 5000,
          inventory_warning_level: 100,
          is_low_stock: false,
          is_out_of_stock: false,
          backorder_enabled: false,
          category: 'Keycards',
          brand: 'ShurePrint',
          is_visible: true,
          is_featured: true,
          image_url: '/placeholder-product.jpg',
          description: 'High-quality RFID keycard for hotels',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z'
        },
        {
          id: 2,
          name: 'Restaurant Menu Holder',
          sku: 'MH-002',
          price: 15.00,
          inventory_level: 45,
          inventory_warning_level: 50,
          is_low_stock: true,
          is_out_of_stock: false,
          backorder_enabled: false,
          category: 'Menu Holders',
          brand: 'ShurePrint',
          is_visible: true,
          is_featured: false,
          image_url: '/placeholder-product.jpg',
          description: 'Elegant acrylic menu holder',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-10T00:00:00Z'
        },
        {
          id: 3,
          name: 'Custom Door Hanger',
          sku: 'DH-003',
          price: 3.75,
          inventory_level: 0,
          inventory_warning_level: 25,
          is_low_stock: false,
          is_out_of_stock: true,
          backorder_enabled: true,
          category: 'Door Hangers',
          brand: 'ShurePrint',
          is_visible: true,
          is_featured: false,
          image_url: '/placeholder-product.jpg',
          description: 'Do Not Disturb door hanger',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-12T00:00:00Z'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/inventory/alerts?status=active')
      const data = await response.json()
      setAlerts(data.data || [])
    } catch (error) {
      console.error('Error fetching alerts:', error)
    }
  }

  const checkStockAlerts = async () => {
    try {
      setRefreshing(true)
      const response = await fetch('/api/inventory/alerts', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.new_alerts > 0) {
        alert(`${data.new_alerts} new stock alerts created`)
      }
      
      await fetchAlerts()
      await fetchProducts()
    } catch (error) {
      console.error('Error checking alerts:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/inventory/alerts?id=${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' })
      })
      await fetchAlerts()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const exportInventory = () => {
    const csv = [
      ['SKU', 'Product Name', 'Category', 'Cost', 'Price', 'Markup %', 'Stock Level', 'Warning Level', 'Status', 'Total Value'],
      ...filteredProducts.map(item => [
        item.sku,
        item.name,
        item.category,
        item.cost ? item.cost.toFixed(2) : '0.00',
        item.price.toFixed(2),
        item.cost ? (((item.price - item.cost) / item.cost) * 100).toFixed(1) + '%' : 'N/A',
        item.inventory_level,
        item.inventory_warning_level,
        item.is_out_of_stock ? 'Out of Stock' : item.is_low_stock ? 'Low Stock' : 'In Stock',
        (item.inventory_level * item.price).toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStock = stockFilter === 'all' ||
                        (stockFilter === 'instock' && product.inventory_level > product.inventory_warning_level) ||
                        (stockFilter === 'outofstock' && product.is_out_of_stock) ||
                        (stockFilter === 'lowstock' && product.is_low_stock)
    
    const matchesCategory = categoryFilter === 'all' || 
                           product.category.toLowerCase() === categoryFilter.toLowerCase()
    
    return matchesSearch && matchesStock && matchesCategory
  })

  const getStockStatus = (product: Product) => {
    if (product.is_out_of_stock) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="h-4 w-4" /> }
    if (product.is_low_stock) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: <TrendingDown className="h-4 w-4" /> }
    return { text: 'In Stock', color: 'bg-green-100 text-green-800', icon: <TrendingUp className="h-4 w-4" /> }
  }

  // Calculate stats - totalProducts is already tracked in state
  const lowStockCount = products.filter(p => p.is_low_stock).length
  const outOfStockCount = products.filter(p => p.is_out_of_stock).length
  const backorderCount = products.filter(p => p.backorder_enabled && p.is_out_of_stock).length
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.inventory_level * p.price), 0)

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Products & Inventory</h1>
            <p className="text-gray-600">Manage products and monitor stock levels</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={checkStockAlerts}
              disabled={refreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              Check Alerts
            </button>
            <button
              onClick={exportInventory}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
              <Package className="text-blue-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <TrendingDown className="text-yellow-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <AlertTriangle className="text-red-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Backorder</p>
                <p className="text-2xl font-bold text-purple-600">{backorderCount}</p>
              </div>
              <Package className="text-purple-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inventory Value</p>
                <p className="text-xl font-bold">${totalInventoryValue.toLocaleString()}</p>
              </div>
              <span className="text-green-600 text-2xl">$</span>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="text-yellow-600" size={20} />
                Active Stock Alerts ({alerts.length})
              </h3>
              <button
                onClick={() => setShowAlerts(!showAlerts)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showAlerts ? 'Hide' : 'Show'} Alerts
              </button>
            </div>
            
            {showAlerts && (
              <div className="mt-3 space-y-2">
                {alerts.map(alert => (
                  <div key={alert.id} className="bg-white rounded p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{alert.product_name}</p>
                      <p className="text-sm text-gray-600">
                        SKU: {alert.sku} | Current Stock: {alert.current_stock} | Threshold: {alert.threshold}
                      </p>
                    </div>
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1) // Reset to first page on filter change
              }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              <option value="keycards">Keycards</option>
              <option value="menus">Menu Holders</option>
              <option value="doorhangers">Door Hangers</option>
              <option value="signage">Signage</option>
            </select>
            
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value)
                setCurrentPage(1) // Reset to first page on filter change
              }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Stock Status</option>
              <option value="instock">In Stock</option>
              <option value="lowstock">Low Stock Only</option>
              <option value="outofstock">Out of Stock Only</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="name">Name A-Z</option>
              <option value="sku">SKU</option>
              <option value="stock_low">Stock: Low to High</option>
              <option value="stock_high">Stock: High to Low</option>
              <option value="value">Inventory Value</option>
            </select>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                <List size={20} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
              >
                <Grid size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">Loading products...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">No products found</td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {product.image_url && (
                              <div className="w-10 h-10 bg-gray-200 rounded mr-3"></div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.is_featured && (
                                <span className="text-xs text-purple-600">Featured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{product.sku}</td>
                        <td className="px-6 py-4 text-sm">{product.category}</td>
                        <td className="px-6 py-4 text-sm">
                          {product.cost ? (
                            <span className="font-medium">${product.cost.toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {product.sale_price ? (
                              <>
                                <span className="line-through text-gray-400 text-sm">${product.price.toFixed(2)}</span>
                                <span className="ml-2 font-medium text-green-600">${product.sale_price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="font-medium">${product.price.toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{product.inventory_level}</p>
                            <p className="text-xs text-gray-500">Min: {product.inventory_warning_level}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                            {stockStatus.icon}
                            {stockStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          ${(product.inventory_level * product.price).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-8">Loading products...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-8">No products found</div>
            ) : (
              filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <h3 className="font-medium mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">{product.sku}</p>
                      <div className="flex justify-between items-center mb-2">
                        {product.sale_price ? (
                          <div>
                            <span className="line-through text-gray-400 text-sm">${product.price.toFixed(2)}</span>
                            <span className="ml-2 font-bold text-green-600">${product.sale_price.toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="font-bold">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Stock: {product.inventory_level}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                            {stockStatus.icon}
                            {stockStatus.text}
                          </span>
                        </div>
                        {product.backorder_enabled && product.is_out_of_stock && (
                          <span className="text-xs text-purple-600">Backorder Available</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-6 bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * productsPerPage) + 1} - {Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(totalProducts / productsPerPage) }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and surrounding pages
                  const totalPages = Math.ceil(totalProducts / productsPerPage)
                  return page === 1 || 
                         page === totalPages || 
                         Math.abs(page - currentPage) <= 1
                })
                .map((page, idx, arr) => (
                  <div key={page} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white' 
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalProducts / productsPerPage), prev + 1))}
              disabled={currentPage >= Math.ceil(totalProducts / productsPerPage)}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}