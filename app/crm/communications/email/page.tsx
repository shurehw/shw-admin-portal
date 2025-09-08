'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '@/components/CRMLayout';
import { ArrowLeft, Send, Mail, Paperclip, User } from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export default function EmailCommunicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    contactId: '',
    dealId: '',
    attachments: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'communications'), {
        ...formData,
        type: 'email',
        status: 'sent',
        sentAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      router.push('/crm/communications');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
          <h1 className="text-2xl font-bold text-gray-900">New Email</h1>
          <p className="text-gray-600 mt-1">Compose and send a new email</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <input
                type="email"
                name="to"
                value={formData.to}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="recipient@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CC
                </label>
                <input
                  type="email"
                  name="cc"
                  value={formData.cc}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="cc@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BCC
                </label>
                <input
                  type="email"
                  name="bcc"
                  value={formData.bcc}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="bcc@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Email subject"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Contact ID (Optional)
                </label>
                <input
                  type="text"
                  name="contactId"
                  value={formData.contactId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Link to contact"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal ID (Optional)
                </label>
                <input
                  type="text"
                  name="dealId"
                  value={formData.dealId}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Link to deal"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleChange}
                rows={12}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Type your message here..."
                required
              />
            </div>

            <div className="flex items-center space-x-4 pt-4 border-t">
              <button
                type="button"
                className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Paperclip className="h-4 w-4 mr-1" />
                Attach File
              </button>
              <span className="text-sm text-gray-500">No attachments</span>
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
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </CRMLayout>
  );
}