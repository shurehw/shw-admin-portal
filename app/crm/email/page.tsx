'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, Send, Inbox, Archive, Trash2, Star, Reply, 
  ReplyAll, Forward, Paperclip, Clock, Check, CheckCheck,
  Eye, Link2, MousePointer, Search, Filter, Tag, 
  MoreVertical, Edit2, Save, X, AlertCircle, User,
  Calendar, Building2, Handshake, ChevronDown, Plus
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

interface Email {
  id: string;
  threadId?: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: Attachment[];
  sentAt: any;
  receivedAt?: any;
  status: 'draft' | 'sent' | 'received' | 'archived' | 'trash';
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  tracking?: EmailTracking;
  relatedTo?: {
    type: 'contact' | 'company' | 'deal';
    id: string;
    name: string;
  };
  templateId?: string;
  scheduledFor?: any;
  followUpDate?: any;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface EmailTracking {
  opens: TrackingEvent[];
  clicks: TrackingEvent[];
  bounced: boolean;
  delivered: boolean;
  deliveredAt?: any;
}

interface TrackingEvent {
  timestamp: any;
  ip?: string;
  userAgent?: string;
  location?: string;
  url?: string; // for click events
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables?: string[];
  usageCount: number;
  lastUsed?: any;
}

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeMode, setComposeMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'inbox' | 'sent' | 'drafts' | 'archived' | 'trash'>('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  
  const [composeData, setComposeData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    attachments: [] as File[],
    scheduledFor: '',
    followUpDate: '',
    trackOpens: true,
    trackClicks: true,
    relatedContact: '',
    relatedDeal: ''
  });

  const labels = [
    { name: 'Important', color: 'red' },
    { name: 'Follow-up', color: 'yellow' },
    { name: 'Customer', color: 'blue' },
    { name: 'Prospect', color: 'green' },
    { name: 'Partner', color: 'purple' },
    { name: 'Internal', color: 'gray' }
  ];

  const defaultTemplates = [
    {
      id: '1',
      name: 'Introduction Email',
      subject: 'Introduction - {{company_name}}',
      body: `Hi {{first_name}},

I hope this email finds you well. I wanted to reach out to introduce myself and {{company_name}}.

{{custom_intro}}

I'd love to schedule a brief call to discuss how we might be able to help {{their_company}}.

Best regards,
{{sender_name}}`,
      category: 'Outreach',
      variables: ['first_name', 'company_name', 'custom_intro', 'their_company', 'sender_name'],
      usageCount: 0
    },
    {
      id: '2',
      name: 'Follow-up Email',
      subject: 'Following up on our conversation',
      body: `Hi {{first_name}},

Thank you for taking the time to speak with me {{meeting_date}}.

As discussed, {{action_items}}

Please let me know if you have any questions or if there's anything else I can help with.

Best regards,
{{sender_name}}`,
      category: 'Follow-up',
      variables: ['first_name', 'meeting_date', 'action_items', 'sender_name'],
      usageCount: 0
    },
    {
      id: '3',
      name: 'Meeting Request',
      subject: 'Meeting Request - {{topic}}',
      body: `Hi {{first_name}},

I hope you're doing well. I'd like to schedule a meeting to discuss {{topic}}.

Would any of the following times work for you?
{{time_slots}}

Please let me know what works best for your schedule.

Best regards,
{{sender_name}}`,
      category: 'Meeting',
      variables: ['first_name', 'topic', 'time_slots', 'sender_name'],
      usageCount: 0
    }
  ];

  useEffect(() => {
    loadEmails();
    loadTemplates();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [emails, viewMode, searchTerm, selectedLabels]);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const emailsQuery = query(
        collection(db, 'emails'),
        orderBy('sentAt', 'desc')
      );
      const snapshot = await getDocs(emailsQuery);
      const emailsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Email[];
      
      setEmails(emailsData);
      
      // Simulate tracking data for demo
      simulateTrackingData(emailsData);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesQuery = query(collection(db, 'emailTemplates'));
      const snapshot = await getDocs(templatesQuery);
      
      if (snapshot.empty) {
        // Load default templates
        setTemplates(defaultTemplates);
        // Save defaults to database
        defaultTemplates.forEach(template => {
          addDoc(collection(db, 'emailTemplates'), template);
        });
      } else {
        const templatesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EmailTemplate[];
        setTemplates(templatesData);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates(defaultTemplates);
    }
  };

  const simulateTrackingData = (emailsList: Email[]) => {
    // Simulate tracking for sent emails
    const updatedEmails = emailsList.map(email => {
      if (email.status === 'sent' && Math.random() > 0.3) {
        return {
          ...email,
          tracking: {
            opens: Math.random() > 0.5 ? [
              { timestamp: Timestamp.now(), ip: '192.168.1.1', location: 'New York, NY' }
            ] : [],
            clicks: Math.random() > 0.7 ? [
              { timestamp: Timestamp.now(), url: 'https://example.com', ip: '192.168.1.1' }
            ] : [],
            delivered: true,
            deliveredAt: Timestamp.now(),
            bounced: false
          }
        };
      }
      return email;
    });
    setEmails(updatedEmails);
  };

  const filterEmails = () => {
    let filtered = [...emails];

    // Filter by view mode
    switch (viewMode) {
      case 'inbox':
        filtered = filtered.filter(e => e.status === 'received');
        break;
      case 'sent':
        filtered = filtered.filter(e => e.status === 'sent');
        break;
      case 'drafts':
        filtered = filtered.filter(e => e.status === 'draft');
        break;
      case 'archived':
        filtered = filtered.filter(e => e.status === 'archived');
        break;
      case 'trash':
        filtered = filtered.filter(e => e.status === 'trash');
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(e => 
        e.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.to.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by labels
    if (selectedLabels.length > 0) {
      filtered = filtered.filter(e => 
        selectedLabels.some(label => e.labels.includes(label))
      );
    }

    setFilteredEmails(filtered);
  };

  const handleSendEmail = async () => {
    try {
      const newEmail: Partial<Email> = {
        from: 'me@company.com', // This would come from auth
        to: composeData.to.split(',').map(e => e.trim()),
        cc: composeData.cc ? composeData.cc.split(',').map(e => e.trim()) : [],
        bcc: composeData.bcc ? composeData.bcc.split(',').map(e => e.trim()) : [],
        subject: composeData.subject,
        body: composeData.body,
        sentAt: composeData.scheduledFor ? new Date(composeData.scheduledFor) : Timestamp.now(),
        status: composeData.scheduledFor ? 'draft' : 'sent',
        isRead: true,
        isStarred: false,
        labels: [],
        tracking: composeData.trackOpens || composeData.trackClicks ? {
          opens: [],
          clicks: [],
          delivered: false,
          bounced: false
        } : undefined
      };

      if (composeData.followUpDate) {
        newEmail.followUpDate = new Date(composeData.followUpDate);
      }

      await addDoc(collection(db, 'emails'), newEmail);
      
      // Reload emails
      await loadEmails();
      setComposeMode(false);
      resetComposeData();
      
      // Track template usage
      if (selectedTemplate) {
        await updateDoc(doc(db, 'emailTemplates', selectedTemplate.id), {
          usageCount: selectedTemplate.usageCount + 1,
          lastUsed: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const handleArchiveEmail = async (emailId: string) => {
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        status: 'archived'
      });
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, status: 'archived' } : e
      ));
    } catch (error) {
      console.error('Error archiving email:', error);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        status: 'trash'
      });
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, status: 'trash' } : e
      ));
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  const handleStarEmail = async (emailId: string, isStarred: boolean) => {
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        isStarred: !isStarred
      });
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, isStarred: !isStarred } : e
      ));
    } catch (error) {
      console.error('Error starring email:', error);
    }
  };

  const handleMarkAsRead = async (emailId: string) => {
    try {
      await updateDoc(doc(db, 'emails', emailId), {
        isRead: true
      });
      setEmails(emails.map(e => 
        e.id === emailId ? { ...e, isRead: true } : e
      ));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleApplyTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setComposeData({
      ...composeData,
      subject: template.subject,
      body: template.body
    });
  };

  const resetComposeData = () => {
    setComposeData({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
      attachments: [],
      scheduledFor: '',
      followUpDate: '',
      trackOpens: true,
      trackClicks: true,
      relatedContact: '',
      relatedDeal: ''
    });
    setSelectedTemplate(null);
  };

  const getTrackingStatus = (email: Email) => {
    if (!email.tracking) return null;
    
    const hasOpens = email.tracking.opens.length > 0;
    const hasClicks = email.tracking.clicks.length > 0;
    
    if (hasClicks) return { icon: MousePointer, color: 'text-green-600', text: 'Clicked' };
    if (hasOpens) return { icon: Eye, color: 'text-blue-600', text: 'Opened' };
    if (email.tracking.delivered) return { icon: Check, color: 'text-gray-600', text: 'Delivered' };
    return null;
  };

  const formatEmailDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading emails...</div>
        </div>
      
    );
  }

  return (
      <div className="h-screen flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r flex flex-col">
          <div className="p-4">
            <button
              onClick={() => setComposeMode(true)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Compose
            </button>
          </div>

          <nav className="flex-1 px-2">
            {[
              { id: 'inbox', icon: Inbox, label: 'Inbox', count: emails.filter(e => e.status === 'received' && !e.isRead).length },
              { id: 'sent', icon: Send, label: 'Sent', count: 0 },
              { id: 'drafts', icon: Edit2, label: 'Drafts', count: emails.filter(e => e.status === 'draft').length },
              { id: 'archived', icon: Archive, label: 'Archived', count: 0 },
              { id: 'trash', icon: Trash2, label: 'Trash', count: 0 }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setViewMode(item.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 ${
                  viewMode === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center">
                  <item.icon className="h-4 w-4 mr-3" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Labels</h3>
            <div className="space-y-1">
              {labels.map((label) => (
                <button
                  key={label.name}
                  onClick={() => {
                    setSelectedLabels(
                      selectedLabels.includes(label.name)
                        ? selectedLabels.filter(l => l !== label.name)
                        : [...selectedLabels, label.name]
                    );
                  }}
                  className={`w-full flex items-center px-2 py-1 rounded text-sm ${
                    selectedLabels.includes(label.name)
                      ? 'bg-gray-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Tag className={`h-3 w-3 mr-2 text-${label.color}-500`} />
                  {label.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Email List */}
        <div className="w-96 bg-gray-50 border-r flex flex-col">
          {/* Search Bar */}
          <div className="p-4 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.map((email) => {
              const tracking = getTrackingStatus(email);
              return (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    if (!email.isRead) handleMarkAsRead(email.id);
                  }}
                  className={`p-4 border-b bg-white hover:bg-gray-50 cursor-pointer ${
                    selectedEmail?.id === email.id ? 'border-l-4 border-blue-500' : ''
                  } ${!email.isRead ? 'font-semibold' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center flex-1 min-w-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarEmail(email.id, email.isStarred);
                        }}
                        className="mr-2"
                      >
                        <Star className={`h-4 w-4 ${
                          email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
                        }`} />
                      </button>
                      <span className="text-sm text-gray-900 truncate">
                        {email.from}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatEmailDate(email.sentAt)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-900 truncate mb-1">
                    {email.subject}
                  </div>
                  
                  <div className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {email.body}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="h-3 w-3 text-gray-400" />
                      )}
                      {tracking && (
                        <div className="flex items-center">
                          <tracking.icon className={`h-3 w-3 ${tracking.color} mr-1`} />
                          <span className={`text-xs ${tracking.color}`}>{tracking.text}</span>
                        </div>
                      )}
                    </div>
                    {email.labels.length > 0 && (
                      <div className="flex space-x-1">
                        {email.labels.map(label => {
                          const labelConfig = labels.find(l => l.name === label);
                          return (
                            <span
                              key={label}
                              className={`text-xs px-1.5 py-0.5 rounded bg-${labelConfig?.color || 'gray'}-100 text-${labelConfig?.color || 'gray'}-700`}
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredEmails.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p>No emails found</p>
              </div>
            )}
          </div>
        </div>

        {/* Email Detail / Compose */}
        <div className="flex-1 flex flex-col bg-white">
          {composeMode ? (
            // Compose Mode
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">New Email</h2>
                <button
                  onClick={() => {
                    setComposeMode(false);
                    resetComposeData();
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {/* Templates */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Templates
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        className={`p-3 border rounded-lg text-left hover:bg-gray-50 ${
                          selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-900">{template.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{template.category}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                    <input
                      type="text"
                      value={composeData.to}
                      onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="recipient@example.com"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
                      <input
                        type="text"
                        value={composeData.cc}
                        onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="cc@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">BCC</label>
                      <input
                        type="text"
                        value={composeData.bcc}
                        onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                        placeholder="bcc@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={composeData.subject}
                      onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Email subject"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={composeData.body}
                      onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 h-64"
                      placeholder="Type your message..."
                    />
                  </div>

                  {/* Advanced Options */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Advanced Options</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Schedule Send</label>
                        <input
                          type="datetime-local"
                          value={composeData.scheduledFor}
                          onChange={(e) => setComposeData({ ...composeData, scheduledFor: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Follow-up Reminder</label>
                        <input
                          type="date"
                          value={composeData.followUpDate}
                          onChange={(e) => setComposeData({ ...composeData, followUpDate: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={composeData.trackOpens}
                          onChange={(e) => setComposeData({ ...composeData, trackOpens: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Track opens</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={composeData.trackClicks}
                          onChange={(e) => setComposeData({ ...composeData, trackClicks: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Track clicks</span>
                      </label>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Paperclip className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Drag files here or click to browse
                      </p>
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setComposeData({
                              ...composeData,
                              attachments: Array.from(e.target.files)
                            });
                          }
                        }}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="mt-2 inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200"
                      >
                        Choose Files
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t flex justify-between">
                <button
                  onClick={() => {
                    setComposeData({ ...composeData });
                    alert('Email saved as draft');
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={!composeData.to || !composeData.subject}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {composeData.scheduledFor ? 'Schedule' : 'Send'}
                </button>
              </div>
            </div>
          ) : selectedEmail ? (
            // Email Detail View
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Reply className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <ReplyAll className="h-4 w-4 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded">
                      <Forward className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleArchiveEmail(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Archive className="h-4 w-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmail(selectedEmail.id)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>From: <strong>{selectedEmail.from}</strong></span>
                    <span>To: <strong>{selectedEmail.to.join(', ')}</strong></span>
                  </div>
                  <span>{formatEmailDate(selectedEmail.sentAt)}</span>
                </div>

                {selectedEmail.tracking && (
                  <div className="mt-3 flex items-center space-x-4 text-sm">
                    {selectedEmail.tracking.delivered && (
                      <span className="flex items-center text-gray-600">
                        <Check className="h-4 w-4 mr-1" />
                        Delivered
                      </span>
                    )}
                    {selectedEmail.tracking.opens.length > 0 && (
                      <span className="flex items-center text-blue-600">
                        <Eye className="h-4 w-4 mr-1" />
                        Opened {selectedEmail.tracking.opens.length}x
                      </span>
                    )}
                    {selectedEmail.tracking.clicks.length > 0 && (
                      <span className="flex items-center text-green-600">
                        <MousePointer className="h-4 w-4 mr-1" />
                        Clicked {selectedEmail.tracking.clicks.length}x
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap">{selectedEmail.body}</div>
                </div>

                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Attachments ({selectedEmail.attachments.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <Paperclip className="h-4 w-4 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-900 flex-1">
                            {attachment.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {(attachment.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEmail.tracking && selectedEmail.tracking.opens.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Email Activity
                    </h3>
                    <div className="space-y-2">
                      {selectedEmail.tracking.opens.map((open, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <Eye className="h-4 w-4 mr-2 text-blue-600" />
                          <span>Opened from {open.location || 'Unknown'}</span>
                          <span className="ml-auto">{formatEmailDate(open.timestamp)}</span>
                        </div>
                      ))}
                      {selectedEmail.tracking.clicks.map((click, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <MousePointer className="h-4 w-4 mr-2 text-green-600" />
                          <span>Clicked {click.url}</span>
                          <span className="ml-auto">{formatEmailDate(click.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select an email to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}