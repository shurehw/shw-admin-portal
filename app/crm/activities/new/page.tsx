'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import { ArrowLeft, Save, Calendar, Clock, User, FileText, Building2, Search } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
}

export default function NewActivityPage() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [associationType, setAssociationType] = useState<'contact' | 'company'>('contact');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    type: 'call',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    duration: '30',
    contactId: '',
    companyId: '',
    dealId: '',
    notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    fetchContactsAndCompanies();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchContactsAndCompanies = async () => {
    try {
      // Fetch contacts
      const contactsSnapshot = await getDocs(collection(db, 'contacts'));
      const contactsData = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Contact));
      setContacts(contactsData);

      // Fetch companies
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      const companiesData = companiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Company));
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Only include the relevant association ID
      const dataToSave = {
        ...formData,
        contactId: associationType === 'contact' ? formData.contactId : '',
        companyId: associationType === 'company' ? formData.companyId : '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      await addDoc(collection(db, 'activities'), dataToSave);
      router.push('/crm/activities');
    } catch (error) {
      console.error('Error creating activity:', error);
      alert('Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const email = contact.email.toLowerCase();
    const company = (contact.company || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || email.includes(search) || company.includes(search);
  });

  // Filter companies based on search term
  const filteredCompanies = companies.filter(company => {
    const name = company.name.toLowerCase();
    const industry = (company.industry || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || industry.includes(search);
  });

  const getSelectedContactName = () => {
    const contact = contacts.find(c => c.id === formData.contactId);
    return contact ? `${contact.first_name} ${contact.last_name}` : '';
  };

  const getSelectedCompanyName = () => {
    const company = companies.find(c => c.id === formData.companyId);
    return company ? company.name : '';
  };

  return (
    <CRMLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New Activity</h1>
          <p className="text-gray-600 mt-1">Schedule a new activity</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="task">Task</option>
                <option value="note">Note</option>
                <option value="demo">Demo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min="15"
                step="15"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Associate With
              </label>
              
              {/* Toggle between Contact and Company */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    setAssociationType('contact');
                    setFormData(prev => ({ ...prev, companyId: '' }));
                    setSearchTerm('');
                    setShowDropdown(false);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    associationType === 'contact' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <User className="inline h-4 w-4 mr-2" />
                  Contact
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAssociationType('company');
                    setFormData(prev => ({ ...prev, contactId: '' }));
                    setSearchTerm('');
                    setShowDropdown(false);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border ${
                    associationType === 'company' 
                      ? 'bg-blue-600 text-white border-blue-600' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="inline h-4 w-4 mr-2" />
                  Company
                </button>
              </div>

              {/* Searchable Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={
                      showDropdown 
                        ? searchTerm 
                        : associationType === 'contact' 
                          ? getSelectedContactName() 
                          : getSelectedCompanyName()
                    }
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      setShowDropdown(true);
                      setSearchTerm('');
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Search and select a ${associationType}...`}
                  />
                </div>

                {/* Dropdown Results */}
                {showDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {associationType === 'contact' ? (
                      filteredContacts.length > 0 ? (
                        filteredContacts.map(contact => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, contactId: contact.id }));
                              setShowDropdown(false);
                              setSearchTerm('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                            <div className="text-sm text-gray-500">{contact.email}</div>
                            {contact.company && (
                              <div className="text-sm text-gray-400">{contact.company}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">No contacts found</div>
                      )
                    ) : (
                      filteredCompanies.length > 0 ? (
                        filteredCompanies.map(company => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, companyId: company.id }));
                              setShowDropdown(false);
                              setSearchTerm('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                          >
                            <div className="font-medium">{company.name}</div>
                            {company.industry && (
                              <div className="text-sm text-gray-500">{company.industry}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">No companies found</div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Add any additional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}