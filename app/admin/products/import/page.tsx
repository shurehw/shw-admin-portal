'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Upload, RefreshCw, CheckCircle, AlertCircle, Database, Package, FileSpreadsheet } from 'lucide-react'

export default function ProductImportPage() {
  const [importing, setImporting] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [uploadingMappings, setUploadingMappings] = useState(false)
  const [mappingFile, setMappingFile] = useState<File | null>(null)
  const [importingFromAirtable, setImportingFromAirtable] = useState(false)
  const [airtableConfig, setAirtableConfig] = useState({
    apiKey: '',
    baseId: '',
    tableName: 'Parent Mappings',
    viewName: 'Grid view'
  })
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'info' | null
    message: string
  }>({ type: null, message: '' })
  const [results, setResults] = useState<{
    imported?: number
    parents_created?: number
    variants_created?: number
    crosswalk_entries?: number
    errors?: number
    mappings_uploaded?: number
    airtable_imported?: number
  }>({})

  const importFromSOS = async () => {
    setImporting(true)
    setStatus({ type: 'info', message: 'Importing products from SOS database...' })
    
    try {
      const response = await fetch('/api/products/import-sos', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: `Successfully imported ${data.imported} products to staging` 
        })
        setResults(prev => ({ ...prev, imported: data.imported }))
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setImporting(false)
    }
  }

  const processStaging = async () => {
    setProcessing(true)
    setStatus({ type: 'info', message: 'Processing staging data into parent/variant structure...' })
    
    try {
      const response = await fetch('/api/products/process-staging', {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: 'Successfully processed staging data!' 
        })
        setResults(data.results)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setProcessing(false)
    }
  }

  const importFromAirtable = async () => {
    if (!airtableConfig.apiKey || !airtableConfig.baseId) {
      setStatus({ type: 'error', message: 'Please provide Airtable API Key and Base ID' })
      return
    }

    setImportingFromAirtable(true)
    setStatus({ type: 'info', message: 'Fetching parent mappings from Airtable...' })
    
    try {
      const response = await fetch('/api/products/import-airtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(airtableConfig)
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: `Successfully imported ${data.imported} parent mappings from Airtable` 
        })
        setResults(prev => ({ ...prev, airtable_imported: data.imported }))
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Airtable import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setImportingFromAirtable(false)
    }
  }

  const uploadMappings = async () => {
    if (!mappingFile) {
      setStatus({ type: 'error', message: 'Please select a CSV file first' })
      return
    }

    setUploadingMappings(true)
    setStatus({ type: 'info', message: 'Uploading parent mappings...' })
    
    try {
      const formData = new FormData()
      formData.append('file', mappingFile)
      
      const response = await fetch('/api/products/upload-mappings', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      
      if (data.success) {
        setStatus({ 
          type: 'success', 
          message: `Successfully uploaded ${data.imported} parent mappings` 
        })
        setResults(prev => ({ ...prev, mappings_uploaded: data.imported }))
        setMappingFile(null)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    } finally {
      setUploadingMappings(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Product Import & Variant Mapping</h1>
          <p className="text-gray-600">
            Import products from SOS and organize them into parent products with variants for NetSuite migration
          </p>
        </div>

        {status.type && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-800' :
            status.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {status.type === 'success' ? <CheckCircle className="mt-0.5" size={20} /> :
             status.type === 'error' ? <AlertCircle className="mt-0.5" size={20} /> :
             <RefreshCw className="mt-0.5 animate-spin" size={20} />}
            <div>
              <p className="font-medium">{status.message}</p>
              {Object.keys(results).length > 0 && (
                <div className="mt-2 text-sm">
                  {results.imported && <p>• Products imported: {results.imported}</p>}
                  {results.parents_created !== undefined && <p>• Parent products created: {results.parents_created}</p>}
                  {results.variants_created !== undefined && <p>• Variants created: {results.variants_created}</p>}
                  {results.crosswalk_entries !== undefined && <p>• Crosswalk entries: {results.crosswalk_entries}</p>}
                  {results.errors !== undefined && results.errors > 0 && (
                    <p className="text-red-600">• Errors: {results.errors}</p>
                  )}
                  {results.mappings_uploaded && <p>• Parent mappings uploaded: {results.mappings_uploaded}</p>}
                  {results.airtable_imported && <p>• Airtable mappings imported: {results.airtable_imported}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Optional: Import Parent Mappings from Airtable */}
        <div className="bg-purple-50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-full">
              <Database className="text-purple-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Optional: Import Parent Mappings from Airtable</h2>
              <p className="text-sm text-gray-600">Connect to your Airtable base to import parent-variant relationships</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded">
              <p className="font-medium text-sm mb-2">Airtable Configuration:</p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-600">API Key:</label>
                  <input
                    type="password"
                    placeholder="key..."
                    value={airtableConfig.apiKey}
                    onChange={(e) => setAirtableConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Base ID:</label>
                  <input
                    type="text"
                    placeholder="app..."
                    value={airtableConfig.baseId}
                    onChange={(e) => setAirtableConfig(prev => ({ ...prev, baseId: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Table Name:</label>
                  <input
                    type="text"
                    placeholder="Parent Mappings"
                    value={airtableConfig.tableName}
                    onChange={(e) => setAirtableConfig(prev => ({ ...prev, tableName: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded">
              <p className="font-medium text-sm mb-2">Expected Airtable Columns:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Parent SKU / parent_sku</li>
                <li>• Parent Name / parent_name</li>
                <li>• Variant SKU / SKU / variant_sku</li>
                <li>• Optional: Size, Color, Pack</li>
                <li>• Optional: Category, Brand</li>
              </ul>
              <button
                onClick={importFromAirtable}
                disabled={!airtableConfig.apiKey || !airtableConfig.baseId || importingFromAirtable || processing || importing}
                className="mt-3 w-full flex items-center justify-center gap-2 bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importingFromAirtable ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    Import from Airtable
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-purple-100 rounded">
            <p className="text-xs text-purple-800">
              <strong>Tip:</strong> Find your Base ID in the Airtable URL (airtable.com/appXXXXXX) and generate an API key from your Airtable account settings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Import from SOS */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Database className="text-blue-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Step 1: Import from SOS</h2>
                <p className="text-sm text-gray-600">Load products from SOS into staging table</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium mb-1">This will:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Connect to SOS backup database</li>
                  <li>Import all products to staging table</li>
                  <li>Preserve original SOS IDs for mapping</li>
                  <li>Mark new items as unprocessed</li>
                </ul>
              </div>
              
              <button
                onClick={importFromSOS}
                disabled={importing || processing}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Import from SOS
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step 2: Process Staging */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Package className="text-green-600" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Step 2: Process Staging</h2>
                <p className="text-sm text-gray-600">Create parent/variant structure</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-medium mb-1">This will:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Extract variant attributes (size, color, pack)</li>
                  <li>Create parent products from base SKUs</li>
                  <li>Create variants with specific options</li>
                  <li>Build crosswalk for SOS ID mapping</li>
                  <li>Auto-update parent summaries</li>
                </ul>
              </div>
              
              <button
                onClick={processStaging}
                disabled={importing || processing}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <RefreshCw className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <Package size={20} />
                    Process Staging Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">How This Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium mb-1">Variant Detection</p>
              <p className="text-gray-600">
                Automatically detects size (S, M, L, XL), color (Black, White, Red), 
                and pack size (10PK, 25PK) from SKUs and product names.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Parent Grouping</p>
              <p className="text-gray-600">
                Groups variants under parent products based on base SKU. 
                For example: SHIRT-001-S, SHIRT-001-M, SHIRT-001-L all become variants of SHIRT-001.
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">NetSuite Ready</p>
              <p className="text-gray-600">
                Creates clean structure for NetSuite matrix items. 
                Parent = Matrix Item, Variants = Child Items with options.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="mt-6 flex gap-4">
          <button className="text-blue-600 hover:text-blue-800">
            View Staging Table →
          </button>
          <button className="text-blue-600 hover:text-blue-800">
            View Parent Products →
          </button>
          <button className="text-blue-600 hover:text-blue-800">
            View Crosswalk →
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}