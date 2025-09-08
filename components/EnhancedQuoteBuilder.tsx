'use client';

import React, { useState, useCallback } from 'react';
import { 
  Plus, Trash2, ChevronDown, ChevronUp, Package, 
  Calculator, DollarSign, Percent, Grid3X3, Eye, EyeOff
} from 'lucide-react';

interface QuantityTier {
  id: string;
  quantity: number;
  costPerUnit: number;
  markup: number;
  unitPrice: number;
  total: number;
}

interface QuoteItem {
  id: string;
  productService: string;
  specifications: string;
  primaryQty: number;
  cost: number;
  markup: number;
  unitPrice: number;
  setupFee: number;
  total: number;
  isExpanded: boolean;
  quantityTiers: QuantityTier[];
}

export default function EnhancedQuoteBuilder() {
  // Initialize with one empty item
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    {
      id: '1',
      productService: '',
      specifications: '',
      primaryQty: 1,
      cost: 0,
      markup: 50,
      unitPrice: 0,
      setupFee: 0,
      total: 0,
      isExpanded: false,
      quantityTiers: []
    }
  ]);
  const [showCostColumn, setShowCostColumn] = useState(false); // Default to hidden

  // Calculate unit price based on cost and markup
  const calculateUnitPrice = (cost: number, markup: number): number => {
    return cost * (1 + markup / 100);
  };

  // Calculate total for item
  const calculateItemTotal = (qty: number, unitPrice: number, setupFee: number): number => {
    return (qty * unitPrice) + setupFee;
  };

  // Add new quote item
  const addQuoteItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      productService: '',
      specifications: '',
      primaryQty: 1,
      cost: 0,
      markup: 50,
      unitPrice: 0,
      setupFee: 0,
      total: 0,
      isExpanded: false,
      quantityTiers: []
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  // Update quote item
  const updateQuoteItem = (id: string, updates: Partial<QuoteItem>) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        
        // Recalculate unit price if cost or markup changed
        if ('cost' in updates || 'markup' in updates) {
          updated.unitPrice = calculateUnitPrice(updated.cost, updated.markup);
        }
        
        // Recalculate total
        updated.total = calculateItemTotal(updated.primaryQty, updated.unitPrice, updated.setupFee);
        
        return updated;
      }
      return item;
    }));
  };

  // Delete quote item
  const deleteQuoteItem = (id: string) => {
    // Don't delete if it's the only item
    if (quoteItems.length > 1) {
      setQuoteItems(items => items.filter(item => item.id !== id));
    }
  };

  // Toggle quantity tiers expansion
  const toggleExpansion = (id: string) => {
    setQuoteItems(items => items.map(item => 
      item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  };

  // Add quantity tier
  const addQuantityTier = (itemId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        const newTier: QuantityTier = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          quantity: 0,
          costPerUnit: item.cost,
          markup: item.markup,
          unitPrice: calculateUnitPrice(item.cost, item.markup),
          total: 0
        };
        return {
          ...item,
          quantityTiers: [...item.quantityTiers, newTier],
          isExpanded: true // Auto-expand when adding a tier
        };
      }
      return item;
    }));
  };

  // Update quantity tier
  const updateQuantityTier = (itemId: string, tierId: string, updates: Partial<QuantityTier>) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        const updatedTiers = item.quantityTiers.map(tier => {
          if (tier.id === tierId) {
            const updated = { ...tier, ...updates };
            
            // Recalculate unit price if cost or markup changed
            if ('costPerUnit' in updates || 'markup' in updates) {
              updated.unitPrice = calculateUnitPrice(updated.costPerUnit, updated.markup);
            }
            
            // Recalculate total
            updated.total = updated.quantity * updated.unitPrice;
            
            return updated;
          }
          return tier;
        });
        return { ...item, quantityTiers: updatedTiers };
      }
      return item;
    }));
  };

  // Delete quantity tier
  const deleteQuantityTier = (itemId: string, tierId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantityTiers: item.quantityTiers.filter(tier => tier.id !== tierId)
        };
      }
      return item;
    }));
  };

  // Calculate grand total
  const grandTotal = quoteItems.reduce((sum, item) => {
    const itemTotal = item.total;
    const tiersTotal = item.quantityTiers.reduce((tierSum, tier) => tierSum + tier.total, 0);
    return sum + itemTotal + tiersTotal;
  }, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Quote Items
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCostColumn(!showCostColumn)}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center text-sm"
            title={showCostColumn ? "Hide cost columns" : "Show cost columns"}
          >
            {showCostColumn ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={addQuoteItem}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </button>
        </div>
      </div>
      
      {/* Responsive Table */}
      <div className="w-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '25%'}}>Product</th>
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase" style={{width: '20%'}}>Specs</th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase" style={{width: '8%'}}>Qty</th>
              {showCostColumn && (
                <>
                  <th className="px-1 py-2 text-right text-xs font-medium text-gray-500 uppercase" style={{width: '10%'}}>Cost</th>
                  <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase" style={{width: '8%'}}>Markup%</th>
                </>
              )}
              <th className="px-1 py-2 text-right text-xs font-medium text-gray-500 uppercase" style={{width: showCostColumn ? '10%' : '15%'}}>Unit $</th>
              <th className="px-1 py-2 text-right text-xs font-medium text-gray-500 uppercase" style={{width: showCostColumn ? '10%' : '15%'}}>Setup</th>
              <th className="px-1 py-2 text-right text-xs font-medium text-gray-500 uppercase" style={{width: showCostColumn ? '10%' : '15%'}}>Total</th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase" style={{width: '7%'}}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {quoteItems.map((item) => (
              <React.Fragment key={item.id}>
                {/* Main Item Row */}
                <tr>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.productService}
                      onChange={(e) => updateQuoteItem(item.id, { productService: e.target.value })}
                      placeholder="Product name"
                      className="w-full px-1 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      type="text"
                      value={item.specifications}
                      onChange={(e) => updateQuoteItem(item.id, { specifications: e.target.value })}
                      placeholder="Description"
                      className="w-full px-1 py-1 border border-gray-300 rounded text-sm"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <div className="flex items-center justify-center">
                      {item.quantityTiers.length > 0 && (
                        <button
                          onClick={() => toggleExpansion(item.id)}
                          className="mr-1 p-0.5 hover:bg-gray-100 rounded"
                        >
                          {item.isExpanded ? (
                            <ChevronUp className="h-3 w-3 text-gray-500" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-gray-500" />
                          )}
                        </button>
                      )}
                      <input
                        type="number"
                        value={item.primaryQty}
                        onChange={(e) => updateQuoteItem(item.id, { primaryQty: parseInt(e.target.value) || 0 })}
                        className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-sm"
                        min="1"
                      />
                    </div>
                  </td>
                  {showCostColumn && (
                    <>
                      <td className="px-1 py-2">
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => updateQuoteItem(item.id, { cost: parseFloat(e.target.value) || 0 })}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-right text-sm"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-1 py-2">
                        <input
                          type="number"
                          value={item.markup}
                          onChange={(e) => updateQuoteItem(item.id, { markup: parseFloat(e.target.value) || 0 })}
                          className="w-full px-1 py-1 border border-gray-300 rounded text-center text-sm"
                          step="1"
                        />
                      </td>
                    </>
                  )}
                  <td className="px-1 py-2">
                    <input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateQuoteItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-right text-sm"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-1 py-2">
                    <input
                      type="number"
                      value={item.setupFee}
                      onChange={(e) => updateQuoteItem(item.id, { setupFee: parseFloat(e.target.value) || 0 })}
                      className="w-full px-1 py-1 border border-gray-300 rounded text-right text-sm"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-1 py-2 text-right font-medium text-sm">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="px-1 py-2">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => addQuantityTier(item.id)}
                        className="text-blue-600 hover:text-blue-800 p-0.5"
                        title="Add quantity tier"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteQuoteItem(item.id)}
                        className="text-red-600 hover:text-red-800 p-0.5"
                        disabled={quoteItems.length === 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Quantity Tiers (Expandable) */}
                {item.isExpanded && (
                  <>
                    {item.quantityTiers.map((tier) => (
                      <tr key={tier.id} className="bg-gray-50">
                        <td className="px-2 py-1 pl-8" colSpan={2}>
                          <span className="text-xs text-gray-600">Quantity Tier</span>
                        </td>
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            value={tier.quantity}
                            onChange={(e) => updateQuantityTier(item.id, tier.id, { quantity: parseInt(e.target.value) || 0 })}
                            className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center text-xs"
                            min="0"
                          />
                        </td>
                        {showCostColumn && (
                          <>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                value={tier.costPerUnit}
                                onChange={(e) => updateQuantityTier(item.id, tier.id, { costPerUnit: parseFloat(e.target.value) || 0 })}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-right text-xs"
                                step="0.01"
                                placeholder="0.00"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                type="number"
                                value={tier.markup}
                                onChange={(e) => updateQuantityTier(item.id, tier.id, { markup: parseFloat(e.target.value) || 0 })}
                                className="w-full px-1 py-0.5 border border-gray-300 rounded text-center text-xs"
                                step="1"
                              />
                            </td>
                          </>
                        )}
                        <td className="px-1 py-1">
                          <input
                            type="number"
                            value={tier.unitPrice}
                            onChange={(e) => updateQuantityTier(item.id, tier.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-1 py-0.5 border border-gray-300 rounded text-right text-xs"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="px-1 py-1">
                          <span className="text-xs text-gray-400">-</span>
                        </td>
                        <td className="px-1 py-1 text-right font-medium text-xs">
                          ${tier.total.toFixed(2)}
                        </td>
                        <td className="px-1 py-1 text-center">
                          <button
                            onClick={() => deleteQuantityTier(item.id, tier.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete tier"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}