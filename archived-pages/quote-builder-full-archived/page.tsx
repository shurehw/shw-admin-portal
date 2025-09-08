'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { 
  FileText, Trello, Database, Mail, CreditCard,
  RefreshCw, Plus, Eye, Send, Download, CheckCircle,
  AlertCircle, Loader, Link, Image as ImageIcon
} from 'lucide-react';

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  labels: Array<{ name: string; color: string }>;
  due: string | null;
  idList: string;
  attachments?: any[];
}

interface Quote {
  id: string;
  trelloCardId?: string;
  customerName: string;
  customerEmail: string;
  items: any[];
  total: number;
  status: string;
  createdAt: string;
  pdfUrl?: string;
  sentAt?: string;
}

export default function QuoteBuilderFull() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [trelloCards, setTrelloCards] = useState<TrelloCard[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedCard, setSelectedCard] = useState<TrelloCard | null>(null);
  const [activeTab, setActiveTab] = useState<'trello' | 'quotes' | 'create'>('trello');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user has production access
  useEffect(() => {
    if (session?.user) {
      const allowedRoles = ['admin', 'production', 'art_team'];
      if (!allowedRoles.includes(session.user.role)) {
        router.push('/admin/dashboard');
      }
    }
  }, [session, router]);

  // Load Trello cards
  const loadTrelloCards = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/trello/cards');
      if (response.ok) {
        const data = await response.json();
        setTrelloCards(Array.isArray(data) ? data : data.cards || []);
      } else {
        setError('Failed to load Trello cards');
      }
    } catch (error) {
      console.error('Error loading Trello cards:', error);
      setError('Failed to connect to quote builder');
    } finally {
      setLoading(false);
    }
  };

  // Load quotes
  const loadQuotes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(Array.isArray(data) ? data : data.quotes || []);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrelloCards();
    loadQuotes();
  }, []);

  // Generate quote from Trello card
  const generateQuoteFromCard = async (card: TrelloCard) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const response = await fetch('/api/admin/quote-builder/proxy?path=api/quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          trelloCardId: card.id,
          cardName: card.name,
          cardDescription: card.desc
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(`Quote generated successfully! Quote ID: ${data.quoteId}`);
        loadQuotes(); // Reload quotes
      } else {
        setError(data.error || 'Failed to generate quote');
      }
    } catch (error) {
      console.error('Error generating quote:', error);
      setError('Failed to generate quote');
    } finally {
      setLoading(false);
    }
  };

  // Send quote to customer
  const sendQuote = async (quote: Quote) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/quote-builder/proxy?path=api/quotes/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote.id })
      });

      if (response.ok) {
        setSuccessMessage(`Quote sent to ${quote.customerEmail}`);
        loadQuotes();
      } else {
        setError('Failed to send quote');
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      setError('Failed to send quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quote Builder Pro</h1>
          <p className="text-gray-600 mt-1">
            Full-featured quote system with Trello, PDF generation, and email automation
          </p>
        </div>

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Trello className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Trello</p>
                <p className="font-semibold text-green-600">Connected</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Supabase</p>
                <p className="font-semibold text-green-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-green-600">Ready</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Stripe</p>
                <p className="font-semibold text-green-600">Live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('trello')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'trello'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Trello className="inline h-4 w-4 mr-2" />
                Trello Cards
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'quotes'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="inline h-4 w-4 mr-2" />
                Quotes
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Plus className="inline h-4 w-4 mr-2" />
                Create New
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                {/* Trello Cards Tab */}
                {activeTab === 'trello' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Trello Quote Requests</h2>
                      <button
                        onClick={loadTrelloCards}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {trelloCards.map(card => (
                        <div key={card.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <h3 className="font-semibold mb-2">{card.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-3">{card.desc}</p>
                          
                          {card.labels && card.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {card.labels.map((label, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs rounded"
                                  style={{ backgroundColor: label.color || '#gray' }}
                                >
                                  {label.name}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {card.due && (
                            <p className="text-xs text-gray-500 mb-3">
                              Due: {new Date(card.due).toLocaleDateString()}
                            </p>
                          )}
                          
                          <button
                            onClick={() => generateQuoteFromCard(card)}
                            className="w-full px-3 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 text-sm"
                          >
                            Generate Quote
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {trelloCards.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No Trello cards found. Check your Trello board configuration.
                      </p>
                    )}
                  </div>
                )}

                {/* Quotes Tab */}
                {activeTab === 'quotes' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Generated Quotes</h2>
                      <button
                        onClick={loadQuotes}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {quotes.map(quote => (
                            <tr key={quote.id}>
                              <td className="px-6 py-4 text-sm">{quote.id}</td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium">{quote.customerName}</div>
                                  <div className="text-xs text-gray-500">{quote.customerEmail}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium">${quote.total.toFixed(2)}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  quote.status === 'sent' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {quote.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(quote.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    className="text-blue-600 hover:text-blue-800"
                                    title="View"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  {quote.status !== 'sent' && (
                                    <button
                                      onClick={() => sendQuote(quote)}
                                      className="text-green-600 hover:text-green-800"
                                      title="Send"
                                    >
                                      <Send className="h-4 w-4" />
                                    </button>
                                  )}
                                  {quote.pdfUrl && (
                                    <a
                                      href={quote.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-gray-600 hover:text-gray-800"
                                      title="Download PDF"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {quotes.length === 0 && (
                      <p className="text-center text-gray-500 py-8">
                        No quotes generated yet. Create quotes from Trello cards.
                      </p>
                    )}
                  </div>
                )}

                {/* Create New Tab */}
                {activeTab === 'create' && (
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-lg font-semibold mb-4">Create New Quote</h2>
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">
                        To create a new quote, use the integrated quote builder or connect through Trello.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => router.push('/admin/production/quote-builder-integrated')}
                          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                        >
                          Open Quote Builder
                        </button>
                        <a
                          href="https://trello.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-white flex items-center"
                        >
                          <Trello className="h-4 w-4 mr-2" />
                          Open Trello
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Feature List */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Full Integration Features:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Trello workflow management</li>
            <li>✓ Supabase database storage</li>
            <li>✓ PDF generation and storage</li>
            <li>✓ Email automation with templates</li>
            <li>✓ Stripe payment processing</li>
            <li>✓ Art proof management</li>
            <li>✓ Customer portal integration</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}