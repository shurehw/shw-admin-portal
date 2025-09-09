'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Plus, Trash2, Copy, Package, Users, Palette, 
  Hash, Layers, FileText, ChevronDown, ChevronUp,
  User, UserCheck, Search, Upload, File, X
} from 'lucide-react';

interface Quantity {
  id: string;
  value: number;
  label: string;
}

interface ColorOption {
  id: string;
  colorType: '1' | '2' | '3' | '4' | 'CMYK' | 'Other';
  customColorDescription?: string;
  label: string;
}

interface PantoneColor {
  id: string;
  color: string;
  reference: string;
}

interface PrintedSide {
  id: string;
  sides: '1' | '2';
  label: string;
}

interface ArtFile {
  id: string;
  file: File | null;
  fileName: string;
  preview?: string;
}

interface QuoteItem {
  id: string;
  productService: string;
  additionalDetails: string;
  quantities: Quantity[];
  colorOptions: ColorOption[];
  pantoneColors: PantoneColor[];
  printedSides: PrintedSide[];
  artFiles: ArtFile[];
  isExpanded: boolean;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
}

interface ResponsibleParty {
  customerId: string;
  customerName: string;
  salesRep: string;
  salesRepId: string;
}

export default function EnhancedQuoteForm() {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    {
      id: '1',
      productService: '',
      additionalDetails: '',
      quantities: [{ id: 'q1', value: 100, label: 'Qty 1' }],
      colorOptions: [{ id: 'c1', colorType: '1', label: '# of colors 1' }],
      pantoneColors: [],
      printedSides: [],
      artFiles: [],
      isExpanded: true
    }
  ]);
  
  const [responsibleParty, setResponsibleParty] = useState<ResponsibleParty>({
    customerId: '',
    customerName: '',
    salesRep: 'Current User', // Auto-populate with logged-in user
    salesRepId: 'current-user-id' // TODO: Get from auth context
  });
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [showItemLimit, setShowItemLimit] = useState(10); // Increased item limit

  // Search customers from CRM
  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setCustomers([]);
      return;
    }
    
    setIsSearchingCustomers(true);
    try {
      const response = await fetch(`/api/crm/contacts/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.contacts || []);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setIsSearchingCustomers(false);
    }
  };
  
  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch) {
        searchCustomers(customerSearch);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [customerSearch]);
  
  // Select customer
  const selectCustomer = (customer: Customer) => {
    setResponsibleParty({
      ...responsibleParty,
      customerId: customer.id,
      customerName: customer.name
    });
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
    setCustomers([]);
  };

  // Add new quote item
  const addQuoteItem = () => {
    if (quoteItems.length >= showItemLimit) {
      alert(`Maximum of ${showItemLimit} items allowed. You can increase this limit if needed.`);
      return;
    }
    
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      productService: '',
      additionalDetails: '',
      quantities: [{ id: `q${Date.now()}`, value: 100, label: 'Qty 1' }],
      colorOptions: [{ id: `c${Date.now()}`, colorType: '1', label: '# of colors 1' }],
      pantoneColors: [],
      printedSides: [],
      artFiles: [],
      isExpanded: true
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  // Duplicate existing item
  const duplicateItem = (itemId: string) => {
    if (quoteItems.length >= showItemLimit) {
      alert(`Maximum of ${showItemLimit} items allowed.`);
      return;
    }
    
    const itemToDuplicate = quoteItems.find(item => item.id === itemId);
    if (itemToDuplicate) {
      const newItem: QuoteItem = {
        ...itemToDuplicate,
        id: Date.now().toString(),
        quantities: itemToDuplicate.quantities.map(q => ({
          ...q,
          id: `q${Date.now()}${Math.random()}`
        })),
        colorOptions: itemToDuplicate.colorOptions.map(c => ({
          ...c,
          id: `c${Date.now()}${Math.random()}`
        })),
        pantoneColors: itemToDuplicate.pantoneColors.map(p => ({
          ...p,
          id: `p${Date.now()}${Math.random()}`
        })),
        printedSides: itemToDuplicate.printedSides.map(s => ({
          ...s,
          id: `s${Date.now()}${Math.random()}`
        })),
        artFiles: []
      };
      setQuoteItems([...quoteItems, newItem]);
    }
  };

  // Update quote item
  const updateQuoteItem = (id: string, updates: Partial<QuoteItem>) => {
    setQuoteItems(items => items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  // Delete quote item
  const deleteQuoteItem = (id: string) => {
    if (quoteItems.length > 1) {
      setQuoteItems(items => items.filter(item => item.id !== id));
    }
  };

  // Toggle item expansion
  const toggleExpansion = (id: string) => {
    setQuoteItems(items => items.map(item => 
      item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
    ));
  };

  // Add quantity to item
  const addQuantity = (itemId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        const newQuantity: Quantity = {
          id: `q${Date.now()}`,
          value: 100,
          label: `Qty ${item.quantities.length + 1}`
        };
        return {
          ...item,
          quantities: [...item.quantities, newQuantity]
        };
      }
      return item;
    }));
  };

  // Update quantity
  const updateQuantity = (itemId: string, quantityId: string, value: number) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          quantities: item.quantities.map(q => 
            q.id === quantityId ? { ...q, value } : q
          )
        };
      }
      return item;
    }));
  };

  // Delete quantity
  const deleteQuantity = (itemId: string, quantityId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId && item.quantities.length > 1) {
        return {
          ...item,
          quantities: item.quantities.filter(q => q.id !== quantityId)
        };
      }
      return item;
    }));
  };

  // Add color option
  const addColorOption = (itemId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        const newColor: ColorOption = {
          id: `c${Date.now()}`,
          colorType: '1',
          label: `Option ${item.colorOptions.length + 1}`
        };
        return {
          ...item,
          colorOptions: [...item.colorOptions, newColor]
        };
      }
      return item;
    }));
  };

  // Update color option
  const updateColorOption = (itemId: string, colorId: string, field: 'colorType' | 'customColorDescription', value: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          colorOptions: item.colorOptions.map(c => {
            if (c.id === colorId) {
              if (field === 'colorType') {
                // Clear custom description if not 'Other'
                return { 
                  ...c, 
                  colorType: value as ColorOption['colorType'],
                  customColorDescription: value === 'Other' ? c.customColorDescription : undefined
                };
              } else {
                return { ...c, [field]: value };
              }
            }
            return c;
          })
        };
      }
      return item;
    }));
  };

  // Delete color option
  const deleteColorOption = (itemId: string, colorId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId && item.colorOptions.length > 1) {
        return {
          ...item,
          colorOptions: item.colorOptions.filter(c => c.id !== colorId)
        };
      }
      return item;
    }));
  };

  // Add Pantone color
  const addPantoneColor = (itemId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        const newPantone: PantoneColor = {
          id: `p${Date.now()}`,
          color: '',
          reference: ''
        };
        return {
          ...item,
          pantoneColors: [...item.pantoneColors, newPantone]
        };
      }
      return item;
    }));
  };

  // Update Pantone color
  const updatePantoneColor = (itemId: string, pantoneId: string, field: 'color' | 'reference', value: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          pantoneColors: item.pantoneColors.map(p => 
            p.id === pantoneId ? { ...p, [field]: value } : p
          )
        };
      }
      return item;
    }));
  };

  // Delete Pantone color
  const deletePantoneColor = (itemId: string, pantoneId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          pantoneColors: item.pantoneColors.filter(p => p.id !== pantoneId)
        };
      }
      return item;
    }));
  };

  // Add printed side option
  const addPrintedSide = (itemId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        const newSide: PrintedSide = {
          id: `s${Date.now()}`,
          sides: '1',
          label: `Option ${item.printedSides.length + 1}`
        };
        return {
          ...item,
          printedSides: [...item.printedSides, newSide]
        };
      }
      return item;
    }));
  };

  // Update printed side
  const updatePrintedSide = (itemId: string, sideId: string, sides: '1' | '2') => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          printedSides: item.printedSides.map(s => 
            s.id === sideId ? { ...s, sides } : s
          )
        };
      }
      return item;
    }));
  };

  // Delete printed side
  const deletePrintedSide = (itemId: string, sideId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          printedSides: item.printedSides.filter(s => s.id !== sideId)
        };
      }
      return item;
    }));
  };

  // Handle art file upload
  const handleArtUpload = (itemId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const newArtFiles: ArtFile[] = Array.from(files).map(file => {
      const fileId = `art${Date.now()}${Math.random()}`;
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      
      return {
        id: fileId,
        file: file,
        fileName: file.name,
        preview
      };
    });
    
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          artFiles: [...item.artFiles, ...newArtFiles]
        };
      }
      return item;
    }));
  };
  
  // Remove art file
  const removeArtFile = (itemId: string, fileId: string) => {
    setQuoteItems(items => items.map(item => {
      if (item.id === itemId) {
        const file = item.artFiles.find(f => f.id === fileId);
        if (file?.preview) {
          URL.revokeObjectURL(file.preview);
        }
        return {
          ...item,
          artFiles: item.artFiles.filter(f => f.id !== fileId)
        };
      }
      return item;
    }));
  };

  // Submit form with complete workflow
  const handleSubmit = async () => {
    try {
      // Prepare form data with files
      const formData = new FormData();
      
      // Collect all art files from all items
      const allArtFiles: File[] = [];
      quoteItems.forEach(item => {
        item.artFiles.forEach(artFile => {
          if (artFile.file) {
            allArtFiles.push(artFile.file);
          }
        });
      });
      
      // Add files to FormData
      allArtFiles.forEach(file => {
        formData.append('artFiles', file);
      });
      
      // Prepare quote data (without File objects)
      const quoteData = {
        items: quoteItems.map(item => ({
          ...item,
          artFiles: item.artFiles.map(f => ({
            fileName: f.fileName,
            id: f.id
          }))
        })),
        customer: {
          id: responsibleParty.customerId,
          name: responsibleParty.customerName
        },
        salesRep: {
          id: responsibleParty.salesRepId,
          name: responsibleParty.salesRep
        },
        createdAt: new Date().toISOString()
      };
      
      // Add quote data as JSON string
      formData.append('quoteData', JSON.stringify(quoteData));
      
      // Show loading state
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Submitting...';
        submitButton.setAttribute('disabled', 'true');
      }
      
      // Submit to bundle workflow endpoint with linking support
      const response = await fetch('/api/quotes/submit-bundle', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok) {
        const bundleInfo = result.isBundle ? `\nBundle Color: ${result.bundleColor}\nLinked Cards: Yes` : '';
        alert(`Quote request submitted successfully!\n\nQuote ID: ${result.quoteId}\nTrello Cards Created: ${result.trelloCardsCreated || 0} (one per item)\nFiles Uploaded: ${result.uploadedFiles || 0}${bundleInfo}`);
        
        // Reset form
        setQuoteItems([{
          id: '1',
          productService: '',
          additionalDetails: '',
          quantities: [{ id: 'q1', value: 100, label: 'Qty 1' }],
          colorOptions: [{ id: 'c1', colorType: '1', label: '# of colors 1' }],
          pantoneColors: [],
          printedSides: [],
          artFiles: [],
          isExpanded: true
        }]);
        setCustomerSearch('');
        setResponsibleParty({
          customerId: '',
          customerName: '',
          salesRep: 'Current User',
          salesRepId: 'current-user-id'
        });
      } else {
        alert(`Failed to submit quote request: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('Error submitting quote request. Please try again.');
    } finally {
      // Reset button state
      const submitButton = document.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.textContent = 'Submit Quote Request';
        submitButton.removeAttribute('disabled');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Enhanced Quote Form</h2>
        
        {/* Customer & Sales Rep Section */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Customer & Sales Representative
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="inline h-4 w-4 mr-1" />
                Customer (from CRM)
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                      if (!e.target.value) {
                        setResponsibleParty({ ...responsibleParty, customerId: '', customerName: '' });
                      }
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search for customer..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                {showCustomerDropdown && (customerSearch.length > 0 || customers.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isSearchingCustomers ? (
                      <div className="p-3 text-gray-500">Searching...</div>
                    ) : customers.length > 0 ? (
                      customers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => selectCustomer(customer)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-600">{customer.email}</div>
                          {customer.company && (
                            <div className="text-xs text-gray-500">{customer.company}</div>
                          )}
                        </div>
                      ))
                    ) : customerSearch.length > 2 ? (
                      <div className="p-3 text-gray-500">No customers found</div>
                    ) : (
                      <div className="p-3 text-gray-500">Type to search customers...</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserCheck className="inline h-4 w-4 mr-1" />
                Sales Representative
              </label>
              <input
                type="text"
                value={responsibleParty.salesRep}
                disabled
                placeholder="Auto-populated from logged-in user"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                title="Sales rep is automatically set to the logged-in user"
              />
            </div>
          </div>
        </div>

        {/* Quote Items */}
        <div className="space-y-4">
          {quoteItems.map((item, index) => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-semibold flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Item {index + 1}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleExpansion(item.id)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    {item.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => duplicateItem(item.id)}
                    className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                    title="Duplicate item"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteQuoteItem(item.id)}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                    disabled={quoteItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {item.isExpanded && (
                <div className="space-y-4">
                  {/* Product/Service */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product/Service
                    </label>
                    <input
                      type="text"
                      value={item.productService}
                      onChange={(e) => updateQuoteItem(item.id, { productService: e.target.value })}
                      placeholder="Enter product or service name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Additional Details (moved up) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <FileText className="inline h-4 w-4 mr-1" />
                      Additional Details
                    </label>
                    <textarea
                      value={item.additionalDetails}
                      onChange={(e) => updateQuoteItem(item.id, { additionalDetails: e.target.value })}
                      placeholder="Enter any additional specifications or details"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>

                  {/* Quantities */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Hash className="inline h-4 w-4 mr-1" />
                      Quantities
                    </label>
                    <div className="space-y-2">
                      {item.quantities.map((qty, qIndex) => (
                        <div key={qty.id} className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 w-16">{qty.label}:</span>
                          <input
                            type="number"
                            value={qty.value}
                            onChange={(e) => updateQuantity(item.id, qty.id, parseInt(e.target.value) || 0)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                            min="1"
                          />
                          {item.quantities.length > 1 && (
                            <button
                              onClick={() => deleteQuantity(item.id, qty.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addQuantity(item.id)}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Another Quantity
                      </button>
                    </div>
                  </div>

                  {/* Number of Colors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Palette className="inline h-4 w-4 mr-1" />
                      Number of Colors
                    </label>
                    <div className="space-y-2">
                      {item.colorOptions.map((color, cIndex) => (
                        <div key={color.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 w-20">{color.label}:</span>
                            <select
                              value={color.colorType}
                              onChange={(e) => updateColorOption(item.id, color.id, 'colorType', e.target.value)}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                            >
                              <option value="1">1 Color</option>
                              <option value="2">2 Colors</option>
                              <option value="3">3 Colors</option>
                              <option value="4">4 Colors</option>
                              <option value="CMYK">CMYK (Full Color)</option>
                              <option value="Other">Other</option>
                            </select>
                            {item.colorOptions.length > 1 && (
                              <button
                                onClick={() => deleteColorOption(item.id, color.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          {color.colorType === 'Other' && (
                            <div className="ml-20">
                              <input
                                type="text"
                                value={color.customColorDescription || ''}
                                onChange={(e) => updateColorOption(item.id, color.id, 'customColorDescription', e.target.value)}
                                placeholder="Please describe the color requirements"
                                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addColorOption(item.id)}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex items-center"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Color Option
                      </button>
                    </div>
                  </div>

                  {/* Pantone Colors (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Palette className="inline h-4 w-4 mr-1" />
                      Pantone Colors (Optional)
                    </label>
                    {item.pantoneColors.length > 0 ? (
                      <div className="space-y-2">
                        {item.pantoneColors.map((pantone) => (
                          <div key={pantone.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={pantone.color}
                              onChange={(e) => updatePantoneColor(item.id, pantone.id, 'color', e.target.value)}
                              placeholder="Pantone color"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                            />
                            <input
                              type="text"
                              value={pantone.reference}
                              onChange={(e) => updatePantoneColor(item.id, pantone.id, 'reference', e.target.value)}
                              placeholder="Reference/Note"
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                            />
                            <button
                              onClick={() => deletePantoneColor(item.id, pantone.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">No Pantone colors added</p>
                    )}
                    <button
                      onClick={() => addPantoneColor(item.id)}
                      className="mt-2 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Pantone Color
                    </button>
                  </div>

                  {/* Printed Sides */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Layers className="inline h-4 w-4 mr-1" />
                      Sides Printed
                    </label>
                    {item.printedSides.length > 0 ? (
                      <div className="space-y-2">
                        {item.printedSides.map((side) => (
                          <div key={side.id} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{side.label}:</span>
                            <select
                              value={side.sides}
                              onChange={(e) => updatePrintedSide(item.id, side.id, e.target.value as '1' | '2')}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                            >
                              <option value="1">1 Side</option>
                              <option value="2">2 Sides</option>
                            </select>
                            <button
                              onClick={() => deletePrintedSide(item.id, side.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-2">No printed sides options added</p>
                    )}
                    <button
                      onClick={() => addPrintedSide(item.id)}
                      className="mt-2 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Printed Sides Option
                    </button>
                  </div>

                  {/* Art Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Upload className="inline h-4 w-4 mr-1" />
                      Art Files
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <input
                        type="file"
                        id={`art-upload-${item.id}`}
                        multiple
                        accept="image/*,.pdf,.ai,.eps,.psd"
                        onChange={(e) => handleArtUpload(item.id, e.target.files)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`art-upload-${item.id}`}
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to upload art files</span>
                        <span className="text-xs text-gray-500 mt-1">Supports: Images, PDF, AI, EPS, PSD</span>
                      </label>
                      
                      {item.artFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {item.artFiles.map((artFile) => (
                            <div key={artFile.id} className="flex items-center justify-between bg-gray-50 rounded p-2">
                              <div className="flex items-center gap-2">
                                {artFile.preview ? (
                                  <img 
                                    src={artFile.preview} 
                                    alt={artFile.fileName}
                                    className="h-10 w-10 object-cover rounded"
                                  />
                                ) : (
                                  <File className="h-5 w-5 text-gray-400" />
                                )}
                                <span className="text-sm text-gray-700">{artFile.fileName}</span>
                              </div>
                              <button
                                onClick={() => removeArtFile(item.id, artFile.id)}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Item Button */}
        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={addQuoteItem}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Additional Item
          </button>
          
          <div className="text-sm text-gray-600">
            {quoteItems.length} of {showItemLimit} items
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-lg"
          >
            Submit Quote Request
          </button>
        </div>
      </div>
    </div>
  );
}