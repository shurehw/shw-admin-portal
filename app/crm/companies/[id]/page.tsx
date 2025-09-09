'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import CompanyTicketsCard from '@/components/crm/CompanyTicketsCard';
import TicketsTab from '@/components/crm/TicketsTab';
import TimelineEvents from '@/components/crm/TimelineEvents';
import { db } from '@/lib/firebase-client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Building2, Mail, Phone, Globe, MapPin, Calendar, 
  Users, DollarSign, Tag, Edit, Star, BarChart3,
  MessageSquare, Clock, FileText, Package, Calculator
} from 'lucide-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  revenue?: number;
  status: 'prospect' | 'customer' | 'partner' | 'inactive';
  source: string;
  tags: string[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  companyId: string;
  isPrimary?: boolean;
}

interface Deal {
  id: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  companyId: string;
  expectedCloseDate?: Date;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'tickets' | 'timeline'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      
      // Try to load from Firebase, fallback to mock data
      try {
        // Load company
        const companyDoc = await getDoc(doc(db, 'crm_companies', companyId));
      if (companyDoc.exists()) {
        setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
      }

      // Load contacts
      const contactsQuery = query(
        collection(db, 'crm_contacts'), 
        where('companyId', '==', companyId)
      );
      const contactsSnapshot = await getDocs(contactsQuery);
      const loadedContacts: Contact[] = [];
      contactsSnapshot.forEach((doc) => {
        loadedContacts.push({ id: doc.id, ...doc.data() } as Contact);
      });
      setContacts(loadedContacts);

      // Load deals
      const dealsQuery = query(
        collection(db, 'crm_deals'),
        where('companyId', '==', companyId)
      );
      const dealsSnapshot = await getDocs(dealsQuery);
      const loadedDeals: Deal[] = [];
      dealsSnapshot.forEach((doc) => {
        loadedDeals.push({ id: doc.id, ...doc.data() } as Deal);
      });
      setDeals(loadedDeals);

      } catch (firebaseError) {
        // Fallback to mock data if Firebase fails
        console.log('Using mock data for company');
        const mockCompanies = [
          {
            id: '1',
            name: 'Acme Corporation',
            email: 'purchasing@acme.com',
            phone: '(313) 555-0100',
            industry: 'Manufacturing',
            size: 'large',
            revenue: 5000000,
            status: 'customer',
            source: 'Referral',
            tags: ['Enterprise', 'Manufacturing', 'VIP'],
            address: {
              street: '123 Industrial Way',
              city: 'Detroit',
              state: 'MI',
              zip: '48201',
              country: 'USA'
            },
            notes: 'Key enterprise account with custom pricing agreements.'
          },
          {
            id: '2',
            name: 'TechStart Solutions',
            email: 'procurement@techstart.com',
            phone: '(415) 555-0200',
            industry: 'Technology',
            size: 'small',
            revenue: 2500000,
            status: 'customer',
            source: 'Website',
            tags: ['Technology', 'Startup'],
            address: {
              street: '456 Innovation Blvd',
              city: 'San Francisco',
              state: 'CA',
              zip: '94105',
              country: 'USA'
            }
          }
        ];
        
        const mockCompany = mockCompanies.find(c => c.id === companyId) || mockCompanies[0];
        setCompany(mockCompany as Company);
        setContacts([]);
        setDeals([]);
      }
    } catch (error) {
      console.error('Error loading company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'prospect': 'bg-yellow-100 text-yellow-800',
      'customer': 'bg-green-100 text-green-800',
      'partner': 'bg-blue-100 text-blue-800',
      'inactive': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getSizeColor = (size: string) => {
    const colors: Record<string, string> = {
      'startup': 'bg-purple-100 text-purple-800',
      'small': 'bg-blue-100 text-blue-800',
      'medium': 'bg-orange-100 text-orange-800',
      'large': 'bg-red-100 text-red-800',
      'enterprise': 'bg-indigo-100 text-indigo-800'
    };
    return colors[size] || 'bg-gray-100 text-gray-800';
  };

  const primaryContact = contacts.find(c => c.isPrimary) || contacts[0];

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading company...</div>
        </div>
      </CRMLayout>
    );
  }

  if (!company) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Company not found</div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(company.status)}`}>
                      {company.status}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSizeColor(company.size)}`}>
                      {company.size}
                    </span>
                    <span className="text-sm text-gray-500">{company.industry}</span>
                  </div>
                  <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                    {company.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <a href={`mailto:${company.email}`} className="hover:text-blue-600">
                          {company.email}
                        </a>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4" />
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Link 
                  href={`/crm/pricing?company=${companyId}`}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Manage Pricing
                </Link>
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Company
                </button>
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'contacts', label: 'Contacts', icon: Users, count: contacts.length },
                { id: 'deals', label: 'Deals', icon: DollarSign, count: deals.length },
                { id: 'tickets', label: 'Tickets', icon: MessageSquare },
                { id: 'timeline', label: 'Timeline', icon: Clock }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Contacts</p>
                        <p className="text-2xl font-bold">{contacts.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Deals</p>
                        <p className="text-2xl font-bold">{deals.length}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Value</p>
                        <p className="text-2xl font-bold">
                          ${deals.reduce((sum, deal) => sum + deal.value, 0).toLocaleString()}
                        </p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Company Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                      <dl className="space-y-2">
                        <div>
                          <dt className="text-sm text-gray-500">Industry</dt>
                          <dd className="text-sm text-gray-900">{company.industry}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Company Size</dt>
                          <dd className="text-sm text-gray-900 capitalize">{company.size}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Revenue</dt>
                          <dd className="text-sm text-gray-900">
                            {company.revenue ? `$${(company.revenue / 1000000).toFixed(1)}M` : 'Not specified'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm text-gray-500">Source</dt>
                          <dd className="text-sm text-gray-900">{company.source || 'Not specified'}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                      {company.address ? (
                        <div className="text-sm text-gray-900">
                          {company.address.street && <div>{company.address.street}</div>}
                          <div>
                            {company.address.city && `${company.address.city}, `}
                            {company.address.state && `${company.address.state} `}
                            {company.address.zip}
                          </div>
                          {company.address.country && <div>{company.address.country}</div>}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No address on file</p>
                      )}
                    </div>
                  </div>
                  {company.notes && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-700">{company.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Contacts</h3>
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="font-medium text-gray-600">
                              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{contact.firstName} {contact.lastName}</span>
                              {contact.isPrimary && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Primary</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.title && <span>{contact.title} • </span>}
                              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                                {contact.email}
                              </a>
                              {contact.phone && <span> • {contact.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {contacts.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No contacts found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Deals</h3>
                  <div className="space-y-4">
                    {deals.map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{deal.title}</div>
                          <div className="text-sm text-gray-500">
                            {deal.stage} • {deal.probability}% probability
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">${deal.value.toLocaleString()}</div>
                          {deal.expectedCloseDate && (
                            <div className="text-sm text-gray-500">
                              Expected: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {deals.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No deals found</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <TicketsTab companyId={companyId} />
            )}

            {activeTab === 'timeline' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
                <TimelineEvents entityType="company" entityId={companyId} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Tickets Card */}
            <CompanyTicketsCard 
              companyId={companyId} 
              primaryContactId={primaryContact?.id}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Phone className="h-4 w-4 mr-2" />
                  Schedule Call
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Proposal
                </button>
                <Link 
                  href={`/crm/pricing?company=${companyId}`}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  View Price List
                </Link>
              </div>
            </div>

            {/* Tags */}
            {company.tags && company.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}