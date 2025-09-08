'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-mock';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import EnhancedQuoteBuilder from '@/components/EnhancedQuoteBuilder';
import { 
  FileText, Plus, Trash2, Save, Send, ArrowLeft,
  Package, Calculator, DollarSign, Percent, AlertCircle,
  User, Building, Mail, Phone, MapPin, Calendar, Trello,
  RefreshCw, CheckCircle, Clock, Tag, ChevronDown, ChevronUp,
  Globe, UserCheck
} from 'lucide-react';

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  labels: Array<{ name: string; color: string }>;
  due: string | null;
  idList: string;
  dateLastActivity?: string;
}

interface QuoteItem {
  id: string;
  product: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  trelloCardId?: string;
}

export default function NewQuotePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('');
  
  // Trello Integration
  const [trelloCards, setTrelloCards] = useState<TrelloCard[]>([]);
  const [trelloLists, setTrelloLists] = useState<Array<{id: string, name: string}>>([]);
  const [selectedList, setSelectedList] = useState<string>('all');
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [loadingTrello, setLoadingTrello] = useState(false);
  const [showTrelloSection, setShowTrelloSection] = useState(true);
  
  // Customer Information
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('new');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerHasPortal, setCustomerHasPortal] = useState(false);
  const [customerPortalId, setCustomerPortalId] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [salesRepName, setSalesRepName] = useState(session?.user?.name || '');
  const [salesRepEmail, setSalesRepEmail] = useState(session?.user?.email || '');
  
  // Quote Details
  const [items, setItems] = useState<QuoteItem[]>([
    { id: '1', product: '', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ]);
  const [subtotal, setSubtotal] = useState(0);
  const [taxRate, setTaxRate] = useState(8.875); // NYC tax rate
  const [taxAmount, setTaxAmount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [total, setTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [validDays, setValidDays] = useState(30);
  const [depositPercent, setDepositPercent] = useState(50);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [deliveryTime, setDeliveryTime] = useState('2-3 weeks');
  const [selectedBrand, setSelectedBrand] = useState<'SHUREPRINT' | 'SHW'>('SHUREPRINT');

  // List of sales reps from the system
  const salesReps = [
    { name: 'Admin User', email: 'admin@shurehw.com' },
    { name: 'Sales Rep', email: 'sales@shurehw.com' },
    { name: 'Customer Service', email: 'cs@shurehw.com' },
  ];

  // List of existing customers (in production, this would come from API)
  const existingCustomers = [
    { 
      id: 'cust1', 
      company: 'ABC Company', 
      name: 'John Smith', 
      email: 'john@abc.com', 
      phone: '(555) 123-4567',
      address: '123 Main St, New York, NY 10001',
      hasPortal: true,
      portalId: 'portal-abc-123'
    },
    { 
      id: 'cust2', 
      company: 'XYZ Corporation', 
      name: 'Jane Doe', 
      email: 'jane@xyz.com', 
      phone: '(555) 987-6543',
      address: '456 Business Ave, Los Angeles, CA 90001',
      hasPortal: false
    },
    { 
      id: 'cust3', 
      company: 'Wilson Industries', 
      name: 'Bob Wilson', 
      email: 'bob@wilson.com', 
      phone: '(555) 456-7890',
      address: '789 Industrial Blvd, Chicago, IL 60601',
      hasPortal: true,
      portalId: 'portal-wilson-456'
    },
    { 
      id: 'cust4', 
      company: 'Tech Startup Inc', 
      name: 'Sarah Johnson', 
      email: 'sarah@techstartup.io', 
      phone: '(555) 321-9876',
      address: '321 Innovation Way, San Francisco, CA 94105',
      hasPortal: true,
      portalId: 'portal-tech-789'
    },
    { 
      id: 'cust5', 
      company: 'Shureprint', 
      name: 'Anne Alvarez', 
      email: 'laura@shurehw.com', 
      phone: '(555) 111-2222',
      address: '9 Island Av, Miami Beach, FL 33139',
      hasPortal: false
    }
  ];

  // Generate quote number on mount and load Trello data
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const timestamp = now.getTime().toString().slice(-6);
    setQuoteNumber(`QT-${year}-${timestamp}`);
    
    // Set default valid until date (30 days from now)
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    setValidUntil(validDate.toISOString().split('T')[0]);
    
    // Set sales rep from session
    if (session?.user) {
      setSalesRepName(session.user.name || '');
      setSalesRepEmail(session.user.email || '');
    }
    
    // Load Trello lists and cards on mount
    loadTrelloLists();
    loadTrelloCards();
  }, [session]);

  // Load Trello lists
  const loadTrelloLists = async () => {
    try {
      const response = await fetch('/api/admin/quote-builder/trello/lists');
      if (response.ok) {
        const data = await response.json();
        setTrelloLists(Array.isArray(data) ? data : []);
        console.log('Loaded Trello lists:', data);
      }
    } catch (error) {
      console.error('Error loading Trello lists:', error);
    }
  };

  // Load Trello cards
  const loadTrelloCards = async () => {
    setLoadingTrello(true);
    try {
      // Try live cards first, fallback to mock cards
      const response = await fetch('/api/admin/quote-builder/trello/live-cards');
      if (response.ok) {
        const data = await response.json();
        setTrelloCards(Array.isArray(data) ? data : []);
        console.log('Loaded Trello cards:', data.length);
      } else {
        // Fallback to mock cards endpoint
        const fallbackResponse = await fetch('/api/admin/quote-builder/trello/cards');
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setTrelloCards(Array.isArray(data) ? data : []);
        }
      }
    } catch (error) {
      console.error('Error loading Trello cards:', error);
      // Try mock cards as last resort
      try {
        const fallbackResponse = await fetch('/api/admin/quote-builder/trello/cards');
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json();
          setTrelloCards(Array.isArray(data) ? data : []);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setLoadingTrello(false);
    }
  };

  // Handle Trello card selection
  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      if (prev.includes(cardId)) {
        return prev.filter(id => id !== cardId);
      }
      return [...prev, cardId];
    });
  };

  // Add items from selected Trello cards
  const addItemsFromTrelloCards = () => {
    const newItems: QuoteItem[] = [];
    
    selectedCards.forEach(cardId => {
      const card = trelloCards.find(c => c.id === cardId);
      if (card) {
        // Parse card details to create quote items
        // Extract product info from card name and description
        const productName = card.name;
        const description = card.desc || '';
        
        // Try to extract quantity from description (look for patterns like "Qty: 100" or "100 units")
        const qtyMatch = description.match(/(?:qty|quantity|units?)[\s:]*(\d+)/i);
        const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
        
        // Create a quote item from the card
        newItems.push({
          id: `trello-${cardId}-${Date.now()}`,
          product: productName,
          description: description,
          quantity: quantity,
          unitPrice: 0, // User will need to set price
          total: 0,
          trelloCardId: cardId
        });
        
        // If card has customer info in description, try to extract it
        const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch && !customerEmail) {
          setCustomerEmail(emailMatch[1]);
        }
        
        // Extract company name if present
        const companyMatch = description.match(/(?:company|client|customer)[\s:]*([^,\n]+)/i);
        if (companyMatch && !customerCompany) {
          setCustomerCompany(companyMatch[1].trim());
        }
      }
    });
    
    // Add new items to existing items (remove default empty item if it exists)
    setItems(prev => {
      const filtered = prev.filter(item => item.product || item.description);
      return filtered.length > 0 ? [...filtered, ...newItems] : newItems;
    });
    
    // Clear selection after adding
    setSelectedCards([]);
    
    // Show success message
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = `Added ${newItems.length} item(s) from Trello cards`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  };

  // Calculate totals whenever items or other values change
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.total, 0);
    setSubtotal(newSubtotal);
    
    const newTaxAmount = (newSubtotal - discount) * (taxRate / 100);
    setTaxAmount(newTaxAmount);
    
    const newTotal = newSubtotal - discount + newTaxAmount + shipping;
    setTotal(newTotal);
  }, [items, taxRate, shipping, discount]);

  const addItem = () => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      product: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate total if quantity or price changed
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = updated.quantity * updated.unitPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const quoteData = {
        quoteNumber,
        projectName,
        brand: selectedBrand,
        customer: {
          id: selectedCustomerId,
          company: customerCompany,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
          hasPortal: customerHasPortal,
          portalId: customerPortalId
        },
        salesRep: {
          name: salesRepName,
          email: salesRepEmail
        },
        items,
        subtotal,
        taxRate,
        taxAmount,
        shipping,
        discount,
        total,
        notes,
        validUntil,
        validDays,
        depositPercent,
        paymentTerms,
        deliveryTime,
        status: 'draft',
        createdAt: new Date().toISOString()
      };

      // Save to API
      const response = await fetch('/api/admin/quote-builder/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      if (response.ok) {
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        notification.textContent = 'Quote saved as draft!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
        
        // Redirect to quotes list
        setTimeout(() => router.push('/admin/quotes'), 1000);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSendQuote = async () => {
    if (!customerEmail) {
      alert('Please enter customer email address');
      return;
    }
    
    if (!customerCompany || !customerName || !projectName) {
      alert('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      const quoteData = {
        quoteNumber,
        projectName,
        brand: selectedBrand,
        customer: {
          id: selectedCustomerId,
          company: customerCompany,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: customerAddress,
          hasPortal: customerHasPortal,
          portalId: customerPortalId
        },
        salesRep: {
          name: salesRepName,
          email: salesRepEmail
        },
        items,
        subtotal,
        taxRate,
        taxAmount,
        shipping,
        discount,
        total,
        notes,
        validUntil,
        validDays,
        depositPercent,
        paymentTerms,
        deliveryTime,
        status: 'sent',
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString()
      };

      // Determine delivery method based on portal status
      const deliveryMethod = customerHasPortal ? 'portal_and_email' : 'email_only';
      
      // Save and send quote
      const response = await fetch('/api/admin/quote-builder/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...quoteData, 
          sendEmail: true,
          deliveryMethod,
          portalNotification: customerHasPortal
        })
      });

      if (response.ok) {
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        const deliveryText = customerHasPortal 
          ? 'Quote sent! Customer will receive email with portal link.'
          : 'Quote sent successfully via email!';
        notification.textContent = deliveryText;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
        
        // Redirect to quotes list
        setTimeout(() => router.push('/admin/quotes'), 1000);
      }
    } catch (error) {
      console.error('Error sending quote:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/quotes')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Quote</h1>
                <p className="text-gray-600 mt-1">Quote #{quoteNumber}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </button>
              <button
                onClick={handleSendQuote}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Quote
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trello Integration Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center">
                  <Trello className="h-5 w-5 mr-2" />
                  Import from Trello
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadTrelloCards}
                    disabled={loadingTrello}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center text-sm"
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loadingTrello ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowTrelloSection(!showTrelloSection)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {showTrelloSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {showTrelloSection && (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                      Select Trello cards to automatically import project details
                    </p>
                    <select
                      value={selectedList}
                      onChange={(e) => setSelectedList(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Lists</option>
                      {trelloLists.map(list => (
                        <option key={list.id} value={list.id}>{list.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {loadingTrello ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading Trello cards...</p>
                    </div>
                  ) : trelloCards.length > 0 ? (
                    <>
                      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                        {(() => {
                          const filteredCards = trelloCards.filter(
                            card => selectedList === 'all' || card.idList === selectedList
                          );
                          
                          if (filteredCards.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <p>No cards in this list</p>
                                <p className="text-xs mt-1">Try selecting a different list</p>
                              </div>
                            );
                          }
                          
                          return filteredCards.map((card) => (
                          <div
                            key={card.id}
                            onClick={() => toggleCardSelection(card.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedCards.includes(card.id) 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {selectedCards.includes(card.id) && (
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                  )}
                                  <h4 className="font-medium text-sm">{card.name}</h4>
                                </div>
                                {card.desc && (
                                  <p className="text-xs text-gray-600 line-clamp-2">{card.desc}</p>
                                )}
                                <div className="flex gap-2 mt-2">
                                  {card.labels.map((label, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-0.5 rounded text-xs text-white"
                                      style={{ backgroundColor: label.color || '#666' }}
                                    >
                                      {label.name}
                                    </span>
                                  ))}
                                  {card.due && (
                                    <span className="text-xs text-gray-500 flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Due: {new Date(card.due).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ));
                        })()}
                      </div>
                      
                      {selectedCards.length > 0 && (
                        <div className="mt-4 flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {selectedCards.length} card(s) selected
                          </span>
                          <button
                            onClick={addItemsFromTrelloCards}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Quote
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Trello className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No Trello cards available</p>
                      <p className="text-xs mt-1">Check your Trello board configuration</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Customer & Quote Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer & Quote Information
              </h2>
              
              {/* Brand Selection */}
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Brand
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('SHUREPRINT')}
                    className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                      selectedBrand === 'SHUREPRINT'
                        ? 'border-blue-600 bg-blue-100 text-blue-900'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    SHUREPRINT
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('SHW')}
                    className={`p-3 rounded-lg border-2 transition-all font-semibold ${
                      selectedBrand === 'SHW'
                        ? 'border-blue-600 bg-blue-100 text-blue-900'
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    SHW
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  This will determine the branding and email templates used for this quote
                </p>
              </div>
              
              {/* Customer Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    setSelectedCustomerId(customerId);
                    
                    if (customerId !== 'new') {
                      const customer = existingCustomers.find(c => c.id === customerId);
                      if (customer) {
                        setCustomerCompany(customer.company);
                        setCustomerName(customer.name);
                        setCustomerEmail(customer.email);
                        setCustomerPhone(customer.phone);
                        setCustomerAddress(customer.address);
                        setCustomerHasPortal(customer.hasPortal || false);
                        setCustomerPortalId(customer.portalId || '');
                      }
                    } else {
                      // Clear fields for new customer
                      setCustomerCompany('');
                      setCustomerName('');
                      setCustomerEmail('');
                      setCustomerPhone('');
                      setCustomerAddress('');
                      setCustomerHasPortal(false);
                      setCustomerPortalId('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new">+ New Customer</option>
                  <optgroup label="Existing Customers">
                    {existingCustomers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.company} - {customer.name}
                        {customer.hasPortal ? ' 🌐' : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {customerHasPortal && (
                  <div className="mt-2 flex items-center text-sm text-green-600">
                    <Globe className="h-4 w-4 mr-1" />
                    This customer has an active portal - Quote will appear in their dashboard
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter contact name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@company.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the printing project"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quote Valid Until
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sales Rep
                  </label>
                  <select
                    value={salesRepEmail}
                    onChange={(e) => {
                      setSalesRepEmail(e.target.value);
                      const rep = salesReps.find(r => r.email === e.target.value);
                      if (rep) setSalesRepName(rep.name);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {salesReps.map(rep => (
                      <option key={rep.email} value={rep.email}>
                        {rep.name} ({rep.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="123 Main St, New York, NY 10001"
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Quote Builder */}
            <EnhancedQuoteBuilder />

            {/* Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Notes</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Add any additional notes or terms..."
              />
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quote Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Quote Summary
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Discount</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tax ({taxRate}%)</span>
                  <span className="font-medium text-sm">${taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quote Settings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Quote Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid for (days)
                  </label>
                  <input
                    type="number"
                    value={validDays}
                    onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    step="0.001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit (%)
                  </label>
                  <input
                    type="number"
                    value={depositPercent}
                    onChange={(e) => setDepositPercent(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="0"
                    max="100"
                    step="5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                    <option value="2/10 Net 30">2/10 Net 30</option>
                    <option value="50% Deposit, 50% on Delivery">50% Deposit, 50% on Delivery</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delivery Time
                  </label>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="1-2 days">1-2 days</option>
                    <option value="3-5 days">3-5 days</option>
                    <option value="1 week">1 week</option>
                    <option value="1-2 weeks">1-2 weeks</option>
                    <option value="2-3 weeks">2-3 weeks</option>
                    <option value="3-4 weeks">3-4 weeks</option>
                    <option value="4-6 weeks">4-6 weeks</option>
                    <option value="6-8 weeks">6-8 weeks</option>
                    <option value="Custom">Custom (specify in notes)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 mb-1">Pro Tips</p>
                  <ul className="text-yellow-700 space-y-1">
                    <li>• Save as draft to continue later</li>
                    <li>• Quote will be valid for {validDays} days</li>
                    <li>• Customer will receive email notification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}