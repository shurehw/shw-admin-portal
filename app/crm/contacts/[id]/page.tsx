'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import ContactTicketsCard from '@/components/crm/ContactTicketsCard';
import TicketsTab from '@/components/crm/TicketsTab';
import TimelineEvents from '@/components/crm/TimelineEvents';
import { db } from '@/lib/firebase-client';
import { doc, getDoc } from 'firebase/firestore';
import { 
  User, Mail, Phone, Building2, MapPin, Calendar, 
  Edit, Star, MessageSquare, Clock, FileText
} from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title?: string;
  companyId: string;
  companyName?: string;
  department?: string;
  location?: string;
  timezone?: string;
  notes?: string;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
  };
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lastContactedAt?: Date;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'timeline'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContactData();
  }, [contactId]);

  const loadContactData = async () => {
    try {
      setLoading(true);
      
      // Load contact
      const contactDoc = await getDoc(doc(db, 'crm_contacts', contactId));
      if (contactDoc.exists()) {
        const contactData = { id: contactDoc.id, ...contactDoc.data() } as Contact;
        setContact(contactData);

        // Load associated company
        if (contactData.companyId) {
          const companyDoc = await getDoc(doc(db, 'crm_companies', contactData.companyId));
          if (companyDoc.exists()) {
            setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
          }
        }
      }

    } catch (error) {
      console.error('Error loading contact data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading contact...</div>
        </div>
      </CRMLayout>
    );
  }

  if (!contact) {
    return (
      <CRMLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Contact not found</div>
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
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl font-semibold text-blue-600">
                    {getInitials(contact.firstName, contact.lastName)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </h1>
                    {contact.isPrimary && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        Primary Contact
                      </span>
                    )}
                    {!contact.isActive && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {contact.title && (
                    <p className="text-lg text-gray-600 mt-1">{contact.title}</p>
                  )}
                  
                  {company && (
                    <div className="flex items-center space-x-1 mt-2 text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{company.name}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 mt-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                        {contact.email}
                      </a>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    {contact.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{contact.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                Edit Contact
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
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
                {/* Contact Information */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Personal Details</h4>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm text-gray-500">Email</dt>
                          <dd className="text-sm text-gray-900">
                            <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                              {contact.email}
                            </a>
                          </dd>
                        </div>
                        {contact.phone && (
                          <div>
                            <dt className="text-sm text-gray-500">Phone</dt>
                            <dd className="text-sm text-gray-900">
                              <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                                {contact.phone}
                              </a>
                            </dd>
                          </div>
                        )}
                        {contact.location && (
                          <div>
                            <dt className="text-sm text-gray-500">Location</dt>
                            <dd className="text-sm text-gray-900">{contact.location}</dd>
                          </div>
                        )}
                        {contact.timezone && (
                          <div>
                            <dt className="text-sm text-gray-500">Timezone</dt>
                            <dd className="text-sm text-gray-900">{contact.timezone}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Professional Details</h4>
                      <dl className="space-y-3">
                        {contact.title && (
                          <div>
                            <dt className="text-sm text-gray-500">Title</dt>
                            <dd className="text-sm text-gray-900">{contact.title}</dd>
                          </div>
                        )}
                        {contact.department && (
                          <div>
                            <dt className="text-sm text-gray-500">Department</dt>
                            <dd className="text-sm text-gray-900">{contact.department}</dd>
                          </div>
                        )}
                        {company && (
                          <div>
                            <dt className="text-sm text-gray-500">Company</dt>
                            <dd className="text-sm text-gray-900">
                              <a href={`/crm/companies/${company.id}`} className="text-blue-600 hover:underline">
                                {company.name}
                              </a>
                            </dd>
                          </div>
                        )}
                        {company?.industry && (
                          <div>
                            <dt className="text-sm text-gray-500">Industry</dt>
                            <dd className="text-sm text-gray-900">{company.industry}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                  
                  {/* Social Profiles */}
                  {contact.socialProfiles && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Social Profiles</h4>
                      <div className="flex space-x-4">
                        {contact.socialProfiles.linkedin && (
                          <a
                            href={contact.socialProfiles.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            LinkedIn
                          </a>
                        )}
                        {contact.socialProfiles.twitter && (
                          <a
                            href={contact.socialProfiles.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-600"
                          >
                            Twitter
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {contact.notes && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Notes</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                    </div>
                  )}
                </div>

                {/* Activity Summary */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Activity Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">0</div>
                      <div className="text-sm text-gray-500">Meetings</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">0</div>
                      <div className="text-sm text-gray-500">Emails</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-gray-500">Tasks</div>
                    </div>
                  </div>
                  {contact.lastContactedAt && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500">
                        Last contacted: {new Date(contact.lastContactedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'tickets' && (
              <TicketsTab contactId={contactId} companyId={contact.companyId} />
            )}

            {activeTab === 'timeline' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
                <TimelineEvents entityType="contact" entityId={contactId} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Tickets Card */}
            <ContactTicketsCard 
              contactId={contactId} 
              companyId={contact.companyId}
              contactInfo={{
                email: contact.email,
                phone: contact.phone
              }}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Contact
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Task
                </button>
              </div>
            </div>

            {/* Contact Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-500">Member Since</dt>
                  <dd className="text-sm text-gray-900">
                    {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Last Updated</dt>
                  <dd className="text-sm text-gray-900">
                    {contact.updatedAt ? new Date(contact.updatedAt).toLocaleDateString() : 'Unknown'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd className="text-sm">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      contact.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {contact.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}