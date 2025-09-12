'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Trash2, Save, Send, Calculator, 
  Search, DollarSign, Package, User,
  FileText, Building2, Mail, Phone
} from 'lucide-react';
import { Quote, QuoteItem, Item, CreateQuoteRequest } from '@/lib/types/quotes';
import { 
  calculateCostWithPad, 
  calculateSellingPrice, 
  calculateMarkupFromPrices,
  calculateQuoteTotal 
} from '@/lib/types/quotes';

export default function QuoteBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<QuoteItem[]>([]);
  
  // Quote details
  const [quoteDetails, setQuoteDetails] = useState({
    customer_name: '',
    customer_email: '',
    title: '',
    description: '',
    notes: ''
  });

  // Load available items
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await fetch('/api/inventory');
      const data = await response.json();
      if (data.success) {
        setItems(data.data);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addItemToQuote = (item: Item) => {
    const newQuoteItem: QuoteItem = {
      id: `temp-${Date.now()}`, // Temporary ID
      quote_id: '',
      item_id: item.id,
      quantity: 1,
      cost_price: item.cost_price || 0,
      cost_with_pad: calculateCostWithPad(item.cost_price || 0, 10),
      markup_percentage: 50,
      selling_price: calculateSellingPrice(calculateCostWithPad(item.cost_price || 0, 10), 50),
      previous_supplier: item.supplier || '',
      previous_price: item.cost_price || 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      item: item
    };

    setSelectedItems([...selectedItems, newQuoteItem]);
  };

  const updateQuoteItem = (index: number, field: keyof QuoteItem, value: any) => {
    const updatedItems = [...selectedItems];
    const item = updatedItems[index];
    
    if (field === 'quantity' || field === 'cost_price' || field === 'markup_percentage') {
      item[field] = parseFloat(value) || 0;
      
      if (field === 'cost_price') {
        item.cost_with_pad = calculateCostWithPad(item.cost_price, 10);
        item.selling_price = calculateSellingPrice(item.cost_with_pad, item.markup_percentage);
      } else if (field === 'markup_percentage') {
        item.selling_price = calculateSellingPrice(item.cost_with_pad, item.markup_percentage);
      }
    } else {
      item[field] = value;
    }
    
    setSelectedItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = calculateQuoteTotal(selectedItems);
    return {
      subtotal: subtotal,
      total: subtotal // Add tax calculation later if needed
    };
  };

  const saveQuote = async (status: 'draft' | 'sent' = 'draft') => {
    if (!quoteDetails.customer_name || !quoteDetails.customer_email || !quoteDetails.title) {
      alert('Please fill in customer name, email, and quote title');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please add at least one item to the quote');
      return;
    }

    setLoading(true);
    try {
      const quoteRequest: CreateQuoteRequest = {
        ...quoteDetails,
        status,
        items: selectedItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          cost_with_pad: item.cost_with_pad,
          markup_percentage: item.markup_percentage,
          selling_price: item.selling_price,
          previous_supplier: item.previous_supplier,
          previous_price: item.previous_price,
          notes: item.notes
        }))
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteRequest)
      });

      const data = await response.json();
      if (data.success) {
        router.push(`/admin/quotes/${data.data.id}`);
      } else {
        alert('Error saving quote: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      alert('Error saving quote');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quote Builder</h1>
        <p className="text-gray-600">Create a new quote by adding products and setting pricing</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">Customer Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={quoteDetails.customer_name}
                  onChange={(e) => setQuoteDetails({...quoteDetails, customer_name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={quoteDetails.customer_email}
                  onChange={(e) => setQuoteDetails({...quoteDetails, customer_email: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="customer@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Title *
                </label>
                <input
                  type="text"
                  value={quoteDetails.title}
                  onChange={(e) => setQuoteDetails({...quoteDetails, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Enter quote title"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={quoteDetails.description}
                  onChange={(e) => setQuoteDetails({...quoteDetails, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>
            </div>
          </div>

          {/* Selected Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold">Quote Items</h2>
                </div>
                <span className="text-sm text-gray-500">{selectedItems.length} items</span>
              </div>
            </div>
            
            <div className="p-6">
              {selectedItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No items added yet. Search and add products from the panel on the right.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedItems.map((quoteItem, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{quoteItem.item?.name}</h3>
                          <p className="text-sm text-gray-500">SKU: {quoteItem.item?.sku}</p>
                        </div>
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={quoteItem.quantity}
                            onChange={(e) => updateQuoteItem(index, 'quantity', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cost Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={quoteItem.cost_price}
                            onChange={(e) => updateQuoteItem(index, 'cost_price', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Cost + Pad (10%)
                          </label>
                          <div className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-gray-50">
                            ${quoteItem.cost_with_pad.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Markup %
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={quoteItem.markup_percentage}
                            onChange={(e) => updateQuoteItem(index, 'markup_percentage', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Selling Price
                          </label>
                          <div className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-green-50 font-medium">
                            ${quoteItem.selling_price.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Previous Supplier
                          </label>
                          <input
                            type="text"
                            value={quoteItem.previous_supplier || ''}
                            onChange={(e) => updateQuoteItem(index, 'previous_supplier', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="Supplier name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Previous Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={quoteItem.previous_price || ''}
                            onChange={(e) => updateQuoteItem(index, 'previous_price', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            placeholder="0.00"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Line Total
                          </label>
                          <div className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-blue-50 font-medium">
                            ${(quoteItem.selling_price * quoteItem.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={quoteItem.notes || ''}
                          onChange={(e) => updateQuoteItem(index, 'notes', e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          placeholder="Optional notes for this item"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Search & Quote Summary */}
        <div className="space-y-6">
          {/* Product Search */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Add Products</h2>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-sm">{item.name}</h3>
                        <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                        {item.cost_price && (
                          <p className="text-xs text-green-600">Cost: ${item.cost_price}</p>
                        )}
                      </div>
                      <button
                        onClick={() => addItemToQuote(item)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quote Summary */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center">
                <Calculator className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-lg font-semibold">Quote Summary</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => saveQuote('draft')}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={() => saveQuote('sent')}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Save & Send
                </button>
              </div>
            </div>
          </div>

          {/* Quote Notes */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold">Quote Notes</h2>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={quoteDetails.notes}
                onChange={(e) => setQuoteDetails({...quoteDetails, notes: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={4}
                placeholder="Internal notes about this quote..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}