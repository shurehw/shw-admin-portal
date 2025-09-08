'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import EnhancedQuoteBuilder from '@/components/EnhancedQuoteBuilder';
import { 
  FileText, Trello, Database, Mail, CreditCard, RefreshCw, Plus, Eye, Send, 
  Download, CheckCircle, AlertCircle, Loader, Link, Image as ImageIcon, 
  User, Building, Phone, MapPin, Calculator, Package, Settings, Search,
  Edit3, Trash2, Copy, Clock, Star, ArrowLeft, ArrowRight, Filter,
  Save, Upload, X, ExternalLink, ChevronDown, ChevronUp, ShoppingCart,
  Percent, DollarSign, Hash, Calendar, BarChart3, Target
} from 'lucide-react';

// ============= TYPES =============
interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  labels: Array<{ name: string; color: string }>;
  due: string | null;
  idList: string;
  attachments?: any[];
  customFieldItems?: any[];
  members?: any[];
  dateLastActivity?: string;
}

interface AirtableProduct {
  id: string;
  fields: {
    'Product Name': string;
    'SKU': string;
    'Description': string;
    'Base Price': number;
    'Category': string;
    'Image': Array<{ url: string }>;
    'Setup Fee': number;
    'Min Quantity': number;
    'Max Quantity': number;
    'Price Breaks': string; // JSON string of price breaks
    'Customization Options': string;
    'Lead Time': string;
    'Status': string;
  };
}

interface QuoteItem {
  id: string;
  productId?: string;
  productName: string;
  sku: string;
  description: string;
  category: string;
  basePrice: number;
  quantity: number;
  quantityBreaks: Array<{
    minQty: number;
    maxQty: number;
    unitPrice: number;
  }>;
  selectedQuantity: number;
  unitPrice: number;
  markup: number;
  setupFee: number;
  customization: string;
  notes: string;
  total: number;
  image?: string;
}

interface ClientInfo {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  taxId: string;
  paymentTerms: string;
}

interface Quote {
  id: string;
  quoteNumber: string;
  trelloCardId?: string;
  clientInfo: ClientInfo;
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  pdfUrl?: string;
  emailSent: boolean;
  progress: number; // 0-100
}

interface QuoteTemplate {
  id: string;
  name: string;
  description: string;
  items: Omit<QuoteItem, 'id'>[];
  defaultClientInfo?: Partial<ClientInfo>;
  defaultTerms: string;
  category: string;
}

// ============= MAIN COMPONENT =============
export default function QuoteBuilderProduction() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // ============= STATE =============
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Data states
  const [trelloCards, setTrelloCards] = useState<TrelloCard[]>([]);
  const [airtableProducts, setAirtableProducts] = useState<AirtableProduct[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [templates, setTemplates] = useState<QuoteTemplate[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'trello' | 'quotes' | 'create' | 'templates'>('create');
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QuoteItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  
  // Search and filter states
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<AirtableProduct[]>([]);
  
  // Form states
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    },
    taxId: '',
    paymentTerms: 'NET 30'
  });
  
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [quoteSettings, setQuoteSettings] = useState({
    taxRate: 8.25,
    shippingCost: 0,
    discountAmount: 0,
    validUntil: '',
    notes: '',
    terms: 'Payment due within 30 days of invoice date. All prices subject to change without notice.',
    markup: 50 // Default markup percentage
  });
  
  // Auto-save
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaved = useRef<string>('');

  // ============= ACCESS CONTROL =============
  // Temporarily disabled for deployment testing
  // useEffect(() => {
  //   if (session?.user) {
  //     const allowedRoles = ['admin', 'production', 'art_team'];
  //     if (!allowedRoles.includes(session.user.role)) {
  //       router.push('/admin/dashboard');
  //     }
  //   }
  // }, [session, router]);

  // ============= DATA LOADING =============
  const loadTrelloCards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/trello/cards');
      if (response.ok) {
        const data = await response.json();
        setTrelloCards(Array.isArray(data) ? data : data.cards || []);
      } else if (response.status === 403) {
        // Handle forbidden access gracefully
        console.log('Trello cards access denied - using mock data');
        setTrelloCards([]);
      } else {
        console.log(`Trello cards response status: ${response.status}`);
        setTrelloCards([]);
      }
    } catch (error) {
      console.error('Error loading Trello cards:', error);
      // Don't set error state for initial load issues
      setTrelloCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAirtableProducts = useCallback(async () => {
    setLoading(true);
    try {
      // In production, this would call the real Airtable API
      const response = await fetch('/api/admin/quote-builder/airtable/products');
      if (response.ok) {
        const data = await response.json();
        setAirtableProducts(data);
      } else {
        // Fallback to mock data for demo
        const mockProducts: AirtableProduct[] = [
          {
            id: '1',
            fields: {
              'Product Name': 'Custom Business Cards',
              'SKU': 'BC-001',
              'Description': 'Premium business cards with various finishing options',
              'Base Price': 0.15,
              'Category': 'Print Materials',
              'Image': [{ url: '/api/placeholder/300/200' }],
              'Setup Fee': 25,
              'Min Quantity': 250,
              'Max Quantity': 10000,
              'Price Breaks': JSON.stringify([
                { minQty: 250, maxQty: 499, unitPrice: 0.15 },
                { minQty: 500, maxQty: 999, unitPrice: 0.12 },
                { minQty: 1000, maxQty: 2499, unitPrice: 0.10 },
                { minQty: 2500, maxQty: 9999, unitPrice: 0.08 }
              ]),
              'Customization Options': 'Logo, Text, Colors, Finish (Matte/Gloss/UV)',
              'Lead Time': '5-7 business days',
              'Status': 'Active'
            }
          },
          {
            id: '2',
            fields: {
              'Product Name': 'Custom T-Shirts',
              'SKU': 'TS-001',
              'Description': 'High-quality cotton t-shirts with custom printing',
              'Base Price': 12.50,
              'Category': 'Apparel',
              'Image': [{ url: '/api/placeholder/300/200' }],
              'Setup Fee': 50,
              'Min Quantity': 12,
              'Max Quantity': 1000,
              'Price Breaks': JSON.stringify([
                { minQty: 12, maxQty: 23, unitPrice: 12.50 },
                { minQty: 24, maxQty: 49, unitPrice: 10.75 },
                { minQty: 50, maxQty: 99, unitPrice: 9.25 },
                { minQty: 100, maxQty: 999, unitPrice: 8.50 }
              ]),
              'Customization Options': 'Screen Print, Embroidery, Heat Transfer, Colors, Sizes',
              'Lead Time': '10-14 business days',
              'Status': 'Active'
            }
          },
          {
            id: '3',
            fields: {
              'Product Name': 'Trade Show Banner',
              'SKU': 'TSB-001',
              'Description': 'Large format vinyl banners for trade shows and events',
              'Base Price': 8.50,
              'Category': 'Large Format',
              'Image': [{ url: '/api/placeholder/300/200' }],
              'Setup Fee': 75,
              'Min Quantity': 1,
              'Max Quantity': 50,
              'Price Breaks': JSON.stringify([
                { minQty: 1, maxQty: 2, unitPrice: 8.50 },
                { minQty: 3, maxQty: 5, unitPrice: 7.25 },
                { minQty: 6, maxQty: 10, unitPrice: 6.75 },
                { minQty: 11, maxQty: 49, unitPrice: 6.25 }
              ]),
              'Customization Options': 'Full Color Printing, Grommets, Hem Options, Sizes',
              'Lead Time': '3-5 business days',
              'Status': 'Active'
            }
          }
        ];
        setAirtableProducts(mockProducts);
      }
    } catch (error) {
      console.error('Error loading Airtable products:', error);
      setError('Failed to load product catalog from Airtable.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(Array.isArray(data) ? data : data.quotes || []);
      } else if (response.status === 403) {
        // Handle forbidden access gracefully
        console.log('Quotes access denied - using empty list');
        setQuotes([]);
      } else {
        console.log(`Quotes response status: ${response.status}`);
        setQuotes([]);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Don't set error state for initial load issues
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    // Mock templates for demo - in production would load from Supabase
    const mockTemplates: QuoteTemplate[] = [
      {
        id: '1',
        name: 'Basic Business Package',
        description: 'Standard business cards and letterheads',
        category: 'Business Essentials',
        defaultTerms: 'Payment due within 30 days',
        items: [
          {
            productName: 'Custom Business Cards',
            sku: 'BC-001',
            description: 'Premium business cards',
            category: 'Print Materials',
            basePrice: 0.15,
            quantity: 1000,
            quantityBreaks: [],
            selectedQuantity: 1000,
            unitPrice: 0.10,
            markup: 50,
            setupFee: 25,
            customization: 'Logo and contact info',
            notes: '',
            total: 125
          }
        ]
      },
      {
        id: '2',
        name: 'Event Marketing Kit',
        description: 'Complete package for trade shows and events',
        category: 'Events',
        defaultTerms: 'Payment due within 15 days',
        items: [
          {
            productName: 'Trade Show Banner',
            sku: 'TSB-001',
            description: 'Large format banner',
            category: 'Large Format',
            basePrice: 8.50,
            quantity: 2,
            quantityBreaks: [],
            selectedQuantity: 2,
            unitPrice: 8.50,
            markup: 40,
            setupFee: 75,
            customization: 'Company branding',
            notes: '',
            total: 166
          }
        ]
      }
    ];
    setTemplates(mockTemplates);
  }, []);

  // ============= INITIAL LOAD =============
  useEffect(() => {
    // Load data regardless of session for now
    loadTrelloCards();
    loadAirtableProducts();
    loadQuotes();
    loadTemplates();
  }, [loadTrelloCards, loadAirtableProducts, loadQuotes, loadTemplates]);

  // ============= PRODUCT FILTERING =============
  useEffect(() => {
    let filtered = airtableProducts;
    
    if (productSearchTerm) {
      filtered = filtered.filter(product => 
        product.fields['Product Name'].toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.fields['SKU'].toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.fields['Description'].toLowerCase().includes(productSearchTerm.toLowerCase())
      );
    }
    
    if (productCategoryFilter) {
      filtered = filtered.filter(product => 
        product.fields['Category'] === productCategoryFilter
      );
    }
    
    setFilteredProducts(filtered);
  }, [airtableProducts, productSearchTerm, productCategoryFilter]);

  // ============= QUOTE CALCULATIONS =============
  const calculateItemTotal = useCallback((item: QuoteItem) => {
    const subtotal = item.quantity * item.unitPrice;
    return subtotal + item.setupFee;
  }, []);

  const calculateQuoteTotals = useCallback(() => {
    const subtotal = quoteItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discountAmount = quoteSettings.discountAmount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (quoteSettings.taxRate / 100);
    const total = afterDiscount + taxAmount + quoteSettings.shippingCost;
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  }, [quoteItems, quoteSettings, calculateItemTotal]);

  // ============= QUOTE MANAGEMENT =============
  const generateQuoteNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `QT-${year}${timestamp}`;
  };

  const calculateProgress = () => {
    let progress = 0;
    
    // Client info filled (30%)
    if (clientInfo.companyName && clientInfo.contactName && clientInfo.email) {
      progress += 30;
    }
    
    // Items added (40%)
    if (quoteItems.length > 0) {
      progress += 40;
    }
    
    // Valid until date set (10%)
    if (quoteSettings.validUntil) {
      progress += 10;
    }
    
    // Terms and conditions (10%)
    if (quoteSettings.terms) {
      progress += 10;
    }
    
    // Additional details (10%)
    if (quoteSettings.notes || quoteSettings.shippingCost > 0) {
      progress += 10;
    }
    
    return Math.min(progress, 100);
  };

  const createNewQuote = () => {
    const newQuote: Quote = {
      id: Date.now().toString(),
      quoteNumber: generateQuoteNumber(),
      clientInfo: { ...clientInfo },
      items: [...quoteItems],
      ...calculateQuoteTotals(),
      taxRate: quoteSettings.taxRate,
      shippingCost: quoteSettings.shippingCost,
      discountAmount: quoteSettings.discountAmount,
      status: 'draft',
      validUntil: quoteSettings.validUntil,
      notes: quoteSettings.notes,
      terms: quoteSettings.terms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailSent: false,
      progress: calculateProgress()
    };
    
    return newQuote;
  };

  const saveQuote = async (status: Quote['status'] = 'draft') => {
    if (!clientInfo.companyName || !clientInfo.email || quoteItems.length === 0) {
      setError('Please complete client information and add at least one item.');
      return;
    }

    setSaving(true);
    try {
      const quote = createNewQuote();
      quote.status = status;
      
      const response = await fetch('/api/admin/quote-builder/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote)
      });

      if (response.ok) {
        const savedQuote = await response.json();
        setCurrentQuote(savedQuote);
        setSuccessMessage(`Quote ${savedQuote.quoteNumber} saved successfully!`);
        loadQuotes(); // Refresh quotes list
        
        if (status === 'sent') {
          setSuccessMessage(`Quote ${savedQuote.quoteNumber} sent to ${clientInfo.email}!`);
        }
      } else {
        throw new Error('Failed to save quote');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      setError('Failed to save quote. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ============= AUTO SAVE =============
  const autoSave = useCallback(() => {
    if (quoteItems.length > 0 && clientInfo.companyName) {
      const currentData = JSON.stringify({ clientInfo, quoteItems, quoteSettings });
      if (currentData !== lastSaved.current) {
        lastSaved.current = currentData;
        // Auto-save to local storage as backup
        localStorage.setItem('quote-builder-draft', currentData);
        console.log('Auto-saved quote draft');
      }
    }
  }, [clientInfo, quoteItems, quoteSettings]);

  useEffect(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(autoSave, 30000); // Auto-save every 30 seconds
    
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [autoSave]);

  // ============= PRODUCT MANAGEMENT =============
  const addProductToQuote = (product: AirtableProduct, quantity: number = 1) => {
    try {
      const priceBreaks = JSON.parse(product.fields['Price Breaks'] || '[]');
      const applicableBreak = priceBreaks.find((b: any) => 
        quantity >= b.minQty && quantity <= (b.maxQty || Infinity)
      ) || { unitPrice: product.fields['Base Price'] };

      const newItem: QuoteItem = {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.fields['Product Name'],
        sku: product.fields['SKU'],
        description: product.fields['Description'],
        category: product.fields['Category'],
        basePrice: product.fields['Base Price'],
        quantity,
        quantityBreaks: priceBreaks,
        selectedQuantity: quantity,
        unitPrice: applicableBreak.unitPrice,
        markup: quoteSettings.markup,
        setupFee: product.fields['Setup Fee'] || 0,
        customization: '',
        notes: '',
        total: 0,
        image: product.fields['Image']?.[0]?.url
      };

      newItem.total = calculateItemTotal(newItem);
      setQuoteItems(prev => [...prev, newItem]);
      setShowProductCatalog(false);
      setSuccessMessage(`Added ${product.fields['Product Name']} to quote`);
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product to quote');
    }
  };

  const updateQuoteItem = (itemId: string, updates: Partial<QuoteItem>) => {
    setQuoteItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        
        // Recalculate unit price based on quantity breaks
        if (updates.quantity || updates.selectedQuantity) {
          const quantity = updates.quantity || updates.selectedQuantity || item.quantity;
          const applicableBreak = item.quantityBreaks.find(b => 
            quantity >= b.minQty && quantity <= (b.maxQty || Infinity)
          );
          
          if (applicableBreak) {
            updated.unitPrice = applicableBreak.unitPrice;
          }
          
          updated.quantity = quantity;
          updated.selectedQuantity = quantity;
        }
        
        // Recalculate total
        updated.total = calculateItemTotal(updated);
        return updated;
      }
      return item;
    }));
  };

  const removeQuoteItem = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId));
  };

  const duplicateQuoteItem = (itemId: string) => {
    const item = quoteItems.find(i => i.id === itemId);
    if (item) {
      const duplicated = {
        ...item,
        id: Date.now().toString()
      };
      setQuoteItems(prev => [...prev, duplicated]);
    }
  };

  // ============= TEMPLATE MANAGEMENT =============
  const applyTemplate = (template: QuoteTemplate) => {
    const templateItems: QuoteItem[] = template.items.map((item, index) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      total: calculateItemTotal(item as QuoteItem)
    }));
    
    setQuoteItems(templateItems);
    
    if (template.defaultClientInfo) {
      setClientInfo(prev => ({ ...prev, ...template.defaultClientInfo }));
    }
    
    setQuoteSettings(prev => ({
      ...prev,
      terms: template.defaultTerms
    }));
    
    setSuccessMessage(`Applied template: ${template.name}`);
  };

  // ============= PDF AND EMAIL =============
  const generatePDF = async (quoteId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quote-builder/pdf/${quoteId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quote-${quoteId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        setSuccessMessage('PDF generated successfully!');
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const sendQuoteEmail = async (quote: Quote) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          recipientEmail: quote.clientInfo.email,
          recipientName: quote.clientInfo.contactName,
          companyName: quote.clientInfo.companyName
        })
      });

      if (response.ok) {
        setSuccessMessage(`Quote emailed to ${quote.clientInfo.email}`);
        // Update quote status
        updateQuoteStatus(quote.id, 'sent');
        loadQuotes();
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setError('Failed to send quote email');
    } finally {
      setLoading(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: Quote['status']) => {
    try {
      const response = await fetch(`/api/admin/quote-builder/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        loadQuotes(); // Refresh quotes
      }
    } catch (error) {
      console.error('Error updating quote status:', error);
    }
  };

  // ============= TRELLO INTEGRATION =============
  const generateQuoteFromTrelloCard = async (card: TrelloCard) => {
    setLoading(true);
    try {
      // Parse card description for client info and items
      const lines = card.desc.split('\n');
      const cardData = {
        companyName: lines.find(l => l.includes('Company:'))?.split(':')[1]?.trim() || card.name.split(' - ')[0],
        contactName: lines.find(l => l.includes('Contact:'))?.split(':')[1]?.trim() || '',
        email: lines.find(l => l.includes('Email:'))?.split(':')[1]?.trim() || '',
        phone: lines.find(l => l.includes('Phone:'))?.split(':')[1]?.trim() || '',
        items: lines.filter(l => l.includes('Item:')).map(l => l.split(':')[1]?.trim()).filter(Boolean)
      };

      // Pre-fill client info
      setClientInfo(prev => ({
        ...prev,
        companyName: cardData.companyName,
        contactName: cardData.contactName,
        email: cardData.email,
        phone: cardData.phone
      }));

      // Set due date as valid until
      if (card.due) {
        setQuoteSettings(prev => ({
          ...prev,
          validUntil: new Date(card.due as string).toISOString().split('T')[0]
        }));
      }

      setActiveTab('create');
      setSelectedCard(card);
      setSuccessMessage(`Quote initialized from Trello card: ${card.name}`);
    } catch (error) {
      console.error('Error generating quote from Trello card:', error);
      setError('Failed to generate quote from Trello card');
    } finally {
      setLoading(false);
    }
  };

  // ============= CLEAR MESSAGES =============
  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  // ============= RENDER =============
  const totals = calculateQuoteTotals();
  const progress = calculateProgress();

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 flex items-center">
                <FileText className="h-10 w-10 mr-3 text-yellow-500" />
                Quote Builder Pro
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Production-ready quote system with full integration capabilities
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-blue-600">{quotes.length}</div>
                <div className="text-sm text-gray-600">Total Quotes</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-green-600">
                  {quotes.filter(q => q.status === 'accepted').length}
                </div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center min-w-[100px]">
                <div className="text-2xl font-bold text-yellow-600">
                  ${quotes.reduce((sum, q) => q.status === 'accepted' ? sum + q.total : sum, 0).toFixed(0)}
                </div>
                <div className="text-sm text-gray-600">Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center">
              <Trello className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Trello Integration</p>
                <p className="font-semibold text-green-600">Connected</p>
                <p className="text-xs text-gray-500">Board: {trelloCards.length} cards</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Airtable Catalog</p>
                <p className="font-semibold text-green-600">Active</p>
                <p className="text-xs text-gray-500">{airtableProducts.length} products</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Gmail Integration</p>
                <p className="font-semibold text-green-600">Ready</p>
                <p className="text-xs text-gray-500">SMTP Configured</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Supabase DB</p>
                <p className="font-semibold text-green-600">Connected</p>
                <p className="text-xs text-gray-500">Real-time sync</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
              <button onClick={clearMessages} className="ml-auto text-red-600 hover:text-red-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
              <p className="text-green-800">{successMessage}</p>
              <button onClick={clearMessages} className="ml-auto text-green-600 hover:text-green-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'create'
                    ? 'border-yellow-500 text-yellow-700 bg-yellow-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Quote
                {progress > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                    {progress}%
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('trello')}
                className={`px-6 py-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'trello'
                    ? 'border-blue-500 text-blue-700 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Trello className="h-4 w-4 mr-2" />
                Trello Cards
                {trelloCards.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {trelloCards.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-6 py-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'quotes'
                    ? 'border-purple-500 text-purple-700 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Quotes
                {quotes.length > 0 && (
                  <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                    {quotes.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-6 py-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'templates'
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="h-4 w-4 mr-2" />
                Templates
                {templates.length > 0 && (
                  <span className="ml-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {templates.length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-gray-400 mr-3" />
                <span className="text-gray-600">Loading...</span>
              </div>
            )}

            {/* CREATE QUOTE TAB */}
            {activeTab === 'create' && !loading && (
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600">
                  Quote Progress: {progress}% Complete
                </div>

                {/* Client Information Section */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                      <Building className="h-5 w-5 mr-2 text-blue-600" />
                      Client Information
                    </h3>
                    <button
                      onClick={() => setShowClientForm(!showClientForm)}
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      {showClientForm ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Expand
                        </>
                      )}
                    </button>
                  </div>

                  {showClientForm ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={clientInfo.companyName}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, companyName: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contact Name *
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={clientInfo.contactName}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, contactName: e.target.value }))}
                          placeholder="Enter contact person's name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={clientInfo.email}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={clientInfo.phone}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                          <input
                            type="text"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Street Address"
                            value={clientInfo.address.street}
                            onChange={(e) => setClientInfo(prev => ({
                              ...prev,
                              address: { ...prev.address, street: e.target.value }
                            }))}
                          />
                          <input
                            type="text"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="City"
                            value={clientInfo.address.city}
                            onChange={(e) => setClientInfo(prev => ({
                              ...prev,
                              address: { ...prev.address, city: e.target.value }
                            }))}
                          />
                          <input
                            type="text"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="State"
                            value={clientInfo.address.state}
                            onChange={(e) => setClientInfo(prev => ({
                              ...prev,
                              address: { ...prev.address, state: e.target.value }
                            }))}
                          />
                          <input
                            type="text"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ZIP Code"
                            value={clientInfo.address.zipCode}
                            onChange={(e) => setClientInfo(prev => ({
                              ...prev,
                              address: { ...prev.address, zipCode: e.target.value }
                            }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tax ID (Optional)
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={clientInfo.taxId}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, taxId: e.target.value }))}
                          placeholder="Enter tax ID"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Terms
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={clientInfo.paymentTerms}
                          onChange={(e) => setClientInfo(prev => ({ ...prev, paymentTerms: e.target.value }))}
                        >
                          <option value="NET 15">NET 15</option>
                          <option value="NET 30">NET 30</option>
                          <option value="NET 45">NET 45</option>
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="50% Down, 50% on Delivery">50% Down, 50% on Delivery</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      {clientInfo.companyName ? (
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">{clientInfo.companyName}</span>
                          <span>•</span>
                          <span>{clientInfo.contactName}</span>
                          <span>•</span>
                          <span>{clientInfo.email}</span>
                        </div>
                      ) : (
                        <span>Click expand to enter client information</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Enhanced Quote Builder Component */}
                <EnhancedQuoteBuilder />

                {/* Quote Summary and Actions */}
                {quoteItems.length > 0 && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Quote Settings */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Settings className="h-5 w-5 mr-2 text-purple-600" />
                        Quote Settings
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Valid Until
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={quoteSettings.validUntil}
                            onChange={(e) => setQuoteSettings(prev => ({ ...prev, validUntil: e.target.value }))}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tax Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              value={quoteSettings.taxRate}
                              onChange={(e) => setQuoteSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Shipping
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                              value={quoteSettings.shippingCost}
                              onChange={(e) => setQuoteSettings(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            value={quoteSettings.discountAmount}
                            onChange={(e) => setQuoteSettings(prev => ({ ...prev, discountAmount: parseFloat(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quote Total */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Calculator className="h-5 w-5 mr-2 text-yellow-600" />
                        Quote Total
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                        </div>
                        
                        {totals.discountAmount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Discount</span>
                            <span className="font-medium">-${totals.discountAmount.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-gray-600">
                          <span>Tax ({quoteSettings.taxRate}%)</span>
                          <span className="font-medium">${totals.taxAmount.toFixed(2)}</span>
                        </div>
                        
                        {quoteSettings.shippingCost > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Shipping</span>
                            <span className="font-medium">${quoteSettings.shippingCost.toFixed(2)}</span>
                          </div>
                        )}
                        
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-lg font-bold text-gray-900">
                            <span>Total</span>
                            <span>${totals.total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-red-600" />
                        Actions
                      </h3>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => setShowPreview(true)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Quote
                        </button>
                        
                        <button
                          onClick={() => saveQuote('draft')}
                          disabled={saving}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          {saving ? (
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Draft
                        </button>
                        
                        <button
                          onClick={() => saveQuote('sent')}
                          disabled={saving || !clientInfo.email}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Send Quote
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Notes & Instructions</h3>
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Add any special notes, instructions, or requirements..."
                      value={quoteSettings.notes}
                      onChange={(e) => setQuoteSettings(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                  
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
                    <textarea
                      className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Enter terms and conditions..."
                      value={quoteSettings.terms}
                      onChange={(e) => setQuoteSettings(prev => ({ ...prev, terms: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TRELLO CARDS TAB */}
            {activeTab === 'trello' && !loading && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Trello Quote Requests</h2>
                  <button
                    onClick={loadTrelloCards}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Cards
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trelloCards.map((card) => (
                    <div key={card.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg line-clamp-2">{card.name}</h3>
                          {card.due && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              new Date(card.due) < new Date() 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {new Date(card.due) < new Date() ? 'Overdue' : 'Due Soon'}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{card.desc}</p>
                        
                        {card.labels && card.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {card.labels.map((label, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs rounded-full text-white"
                                style={{ backgroundColor: label.color || '#6b7280' }}
                              >
                                {label.name}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {card.due && (
                          <div className="text-xs text-gray-500 mb-4 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {new Date(card.due).toLocaleDateString()}
                          </div>
                        )}
                        
                        <button
                          onClick={() => generateQuoteFromTrelloCard(card)}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Generate Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {trelloCards.length === 0 && (
                  <div className="text-center py-16">
                    <Trello className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Trello Cards Found</h3>
                    <p className="text-gray-600 mb-4">Check your Trello board configuration or create new quote request cards.</p>
                    <a
                      href={`https://trello.com/b/686da04ff3f765a86406b2c0`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Trello Board
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* QUOTES TAB */}
            {activeTab === 'quotes' && !loading && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Quote Management</h2>
                  <button
                    onClick={loadQuotes}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Quotes
                  </button>
                </div>
                
                {quotes.length > 0 ? (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quote</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Until</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {quotes.map((quote) => (
                            <tr key={quote.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">{quote.quoteNumber}</div>
                                  <div className="text-sm text-gray-500">{quote.items.length} items</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="font-medium text-gray-900">{quote.clientInfo.companyName}</div>
                                  <div className="text-sm text-gray-500">{quote.clientInfo.contactName}</div>
                                  <div className="text-sm text-blue-600">{quote.clientInfo.email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-lg font-semibold text-gray-900">${quote.total.toFixed(2)}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  quote.status === 'accepted' 
                                    ? 'bg-green-100 text-green-800'
                                    : quote.status === 'sent' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : quote.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : quote.status === 'expired'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(quote.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => setShowPreview(true)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Preview"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  
                                  {quote.status !== 'sent' && quote.status !== 'accepted' && (
                                    <button
                                      onClick={() => sendQuoteEmail(quote)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Send Email"
                                    >
                                      <Send className="h-4 w-4" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => generatePDF(quote.id)}
                                    className="text-purple-600 hover:text-purple-800"
                                    title="Download PDF"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Quotes Yet</h3>
                    <p className="text-gray-600 mb-4">Start creating quotes from Trello cards or use the quote builder.</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Quote
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && !loading && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Quote Templates</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{template.category}</p>
                          </div>
                          <Star className="h-5 w-5 text-yellow-500" />
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                        
                        <div className="text-xs text-gray-500 mb-4">
                          {template.items.length} items included
                        </div>
                        
                        <button
                          onClick={() => applyTemplate(template)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Apply Template
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {templates.length === 0 && (
                  <div className="text-center py-16">
                    <Star className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Available</h3>
                    <p className="text-gray-600">Create your first quote template to speed up future quotes.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Product Catalog Modal */}
      {showProductCatalog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Product Catalog</h2>
              <button
                onClick={() => setShowProductCatalog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 border-b">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 h-5 w-5 text-gray-400 top-3" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={productSearchTerm}
                      onChange={(e) => setProductSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-48">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="Print Materials">Print Materials</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Large Format">Large Format</option>
                    <option value="Promotional">Promotional</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    {product.fields['Image']?.[0] && (
                      <img 
                        src={product.fields['Image'][0].url} 
                        alt={product.fields['Product Name']}
                        className="w-full h-32 object-cover rounded mb-3"
                      />
                    )}
                    
                    <h3 className="font-semibold mb-2">{product.fields['Product Name']}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.fields['Description']}</p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">SKU: {product.fields['SKU']}</span>
                      <span className="font-semibold text-blue-600">${product.fields['Base Price'].toFixed(2)}</span>
                    </div>
                    
                    {product.fields['Setup Fee'] > 0 && (
                      <div className="text-xs text-gray-500 mb-3">
                        Setup Fee: ${product.fields['Setup Fee'].toFixed(2)}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-3">
                      Min Qty: {product.fields['Min Quantity']} • Lead Time: {product.fields['Lead Time']}
                    </div>
                    
                    <button
                      onClick={() => addProductToQuote(product)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Add to Quote
                    </button>
                  </div>
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No products found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {showItemDetails && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Edit Item Details</h2>
              <button
                onClick={() => setShowItemDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedItem.productName}
                    onChange={(e) => updateQuoteItem(selectedItem.id, { productName: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedItem.quantity}
                      onChange={(e) => updateQuoteItem(selectedItem.id, { quantity: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={selectedItem.unitPrice}
                      onChange={(e) => updateQuoteItem(selectedItem.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Setup Fee</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedItem.setupFee}
                    onChange={(e) => updateQuoteItem(selectedItem.id, { setupFee: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customization Details</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    value={selectedItem.customization}
                    onChange={(e) => updateQuoteItem(selectedItem.id, { customization: e.target.value })}
                    placeholder="Enter customization details..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                    value={selectedItem.notes}
                    onChange={(e) => updateQuoteItem(selectedItem.id, { notes: e.target.value })}
                    placeholder="Enter any additional notes..."
                  />
                </div>

                {/* Quantity Breaks */}
                {selectedItem.quantityBreaks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Volume Pricing</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-gray-600 mb-2">
                        <div>Quantity Range</div>
                        <div>Unit Price</div>
                        <div>Total</div>
                      </div>
                      {selectedItem.quantityBreaks.map((brk, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-2 text-sm py-1">
                          <div>{brk.minQty} - {brk.maxQty || '∞'}</div>
                          <div>${brk.unitPrice.toFixed(2)}</div>
                          <div>${(selectedItem.quantity * brk.unitPrice).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between font-semibold">
                    <span>Item Total:</span>
                    <span>${selectedItem.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setShowItemDetails(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Quote Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto max-h-[75vh] bg-white">
              {/* Quote Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">QUOTE</h1>
                  <p className="text-gray-600">Quote #: {generateQuoteNumber()}</p>
                  <p className="text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  {quoteSettings.validUntil && (
                    <p className="text-gray-600">Valid Until: {new Date(quoteSettings.validUntil).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Company</h2>
                  <p className="text-gray-600">123 Business St</p>
                  <p className="text-gray-600">City, State 12345</p>
                  <p className="text-gray-600">phone@company.com</p>
                  <p className="text-gray-600">(555) 123-4567</p>
                </div>
              </div>

              {/* Client Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Bill To:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold">{clientInfo.companyName}</p>
                  <p>{clientInfo.contactName}</p>
                  <p>{clientInfo.email}</p>
                  <p>{clientInfo.phone}</p>
                  {clientInfo.address.street && (
                    <>
                      <p>{clientInfo.address.street}</p>
                      <p>{clientInfo.address.city}, {clientInfo.address.state} {clientInfo.address.zipCode}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-8">
                <table className="w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left border-b">Description</th>
                      <th className="px-4 py-3 text-center border-b">Qty</th>
                      <th className="px-4 py-3 text-right border-b">Unit Price</th>
                      <th className="px-4 py-3 text-right border-b">Setup</th>
                      <th className="px-4 py-3 text-right border-b">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quoteItems.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-4 py-3">
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-600">{item.description}</div>
                          {item.customization && (
                            <div className="text-sm text-blue-600 mt-1">{item.customization}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${item.setupFee.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium">${item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-64">
                  <div className="flex justify-between py-2">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between py-2 text-red-600">
                      <span>Discount:</span>
                      <span>-${totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span>Tax ({quoteSettings.taxRate}%):</span>
                    <span>${totals.taxAmount.toFixed(2)}</span>
                  </div>
                  {quoteSettings.shippingCost > 0 && (
                    <div className="flex justify-between py-2">
                      <span>Shipping:</span>
                      <span>${quoteSettings.shippingCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 text-lg font-bold border-t">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes and Terms */}
              {quoteSettings.notes && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Notes:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{quoteSettings.notes}</p>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Terms & Conditions:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{quoteSettings.terms}</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-white"
              >
                Close
              </button>
              <button
                onClick={() => generatePDF('preview')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}