'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Building2, User, MapPin, Globe } from 'lucide-react';
import Link from 'next/link';

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    legalName: '',
    brandName: '',
    segment: 'restaurant',
    subSegment: '',
    website: '',
    phone: '',
    locationCount: 1,
    location: {
      address: '',
      city: '',
      state: '',
      postalCode: ''
    },
    contacts: [] as any[],
    source: 'manual',
    notes: ''
  });

  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: ''
  });

  const segments = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Café' },
    { value: 'bakery', label: 'Bakery' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'catering', label: 'Catering' },
    { value: 'other', label: 'Other' }
  ];

  const subSegments: Record<string, string[]> = {
    restaurant: ['Fine Dining', 'Casual Dining', 'Fast Casual', 'QSR', 'Food Truck', 'Ghost Kitchen'],
    cafe: ['Coffee Shop', 'Tea House', 'Juice Bar', 'Smoothie Bar'],
    bakery: ['Artisan Bakery', 'Commercial Bakery', 'Patisserie', 'Donut Shop'],
    hotel: ['Luxury', 'Business', 'Boutique', 'Resort', 'Extended Stay'],
    catering: ['Corporate', 'Wedding', 'Event', 'Institutional'],
    other: []
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/crm/leads/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/crm/leads');
      } else {
        console.error('Failed to create lead');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContact = () => {
    if (newContact.firstName && newContact.email) {
      setFormData(prev => ({
        ...prev,
        contacts: [...prev.contacts, { ...newContact }]
      }));
      setNewContact({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        title: ''
      });
    }
  };

  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/crm/leads" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Smart Leads
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manually add a new lead to the intake queue for review and approval
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Building2 className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Legal Name
                </label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData(prev => ({ ...prev, legalName: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Segment *
                </label>
                <select
                  required
                  value={formData.segment}
                  onChange={(e) => setFormData(prev => ({ ...prev, segment: e.target.value, subSegment: '' }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  {segments.map(seg => (
                    <option key={seg.value} value={seg.value}>{seg.label}</option>
                  ))}
                </select>
              </div>

              {subSegments[formData.segment]?.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sub-Segment
                  </label>
                  <select
                    value={formData.subSegment}
                    onChange={(e) => setFormData(prev => ({ ...prev, subSegment: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select...</option>
                    {subSegments[formData.segment].map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="https://"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Number of Locations
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.locationCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationCount: parseInt(e.target.value) || 1 }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Primary Location</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  value={formData.location.state}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, state: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={formData.location.postalCode}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, postalCode: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-gray-400 mr-2" />
              <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={newContact.firstName}
                onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              
              <input
                type="text"
                placeholder="Last Name"
                value={newContact.lastName}
                onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              
              <input
                type="email"
                placeholder="Email"
                value={newContact.email}
                onChange={(e) => setNewContact(prev => ({ ...prev, email: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              
              <input
                type="tel"
                placeholder="Phone"
                value={newContact.phone}
                onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              
              <input
                type="text"
                placeholder="Title"
                value={newContact.title}
                onChange={(e) => setNewContact(prev => ({ ...prev, title: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              
              <button
                type="button"
                onClick={addContact}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Add Contact
              </button>
            </div>

            {formData.contacts.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Added Contacts:</h3>
                <div className="space-y-2">
                  {formData.contacts.map((contact, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {contact.firstName} {contact.lastName} - {contact.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          contacts: prev.contacts.filter((_, i) => i !== idx)
                        }))}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white shadow rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Add any additional notes about this lead..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/crm/leads"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
  );
}