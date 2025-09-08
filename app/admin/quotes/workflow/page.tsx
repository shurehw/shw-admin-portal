'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import AdminLayout from '@/components/AdminLayout';
import { 
  FileText, UserCheck, DollarSign, CreditCard, CheckCircle, 
  ArrowRight, Clock, Mail, Globe, AlertCircle, User,
  Send, Eye, Printer, Package, Truck, UserPlus,
  ChevronRight, Building, Phone, MapPin, Calendar
} from 'lucide-react';

export default function WorkflowVisualizationPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<'SHUREPRINT' | 'SHW'>('SHUREPRINT');
  
  const workflowSteps = [
    {
      id: 1,
      title: 'Quote Creation & Sending',
      status: 'active',
      icon: FileText,
      color: 'blue',
      description: 'Create and send quote to customer',
      actions: ['Create Quote', 'Add Items', 'Set Terms', 'Send Email'],
      emailType: 'New Quote Email'
    },
    {
      id: 2,
      title: 'Customer Review & Approval',
      status: 'pending',
      icon: UserCheck,
      color: 'yellow',
      description: 'Customer reviews and approves quote',
      actions: ['View Quote', 'Request Changes', 'Approve', 'Delegate Approval'],
      emailType: 'Approval Request Email'
    },
    {
      id: 3,
      title: 'Invoice Generation',
      status: 'pending',
      icon: DollarSign,
      color: 'green',
      description: 'Generate invoice after approval',
      actions: ['Generate Invoice', 'Apply Deposit', 'Set Payment Terms', 'Send Invoice'],
      emailType: 'Invoice Email'
    },
    {
      id: 4,
      title: 'Payment Processing',
      status: 'pending',
      icon: CreditCard,
      color: 'purple',
      description: 'Process customer payment',
      actions: ['Accept Payment', 'Delegate Payment', 'Process Card', 'Confirm Receipt'],
      emailType: 'Payment Request Email'
    },
    {
      id: 5,
      title: 'Production & Delivery',
      status: 'pending',
      icon: Package,
      color: 'green',
      description: 'Begin production and deliver',
      actions: ['Start Production', 'Upload Proof', 'Get Approval', 'Ship Order'],
      emailType: 'Production Updates'
    }
  ];

  const sampleQuoteData = {
    quoteNumber: 'QT-2024-123456',
    customer: {
      name: 'John Smith',
      company: 'ABC Company',
      email: 'john@abccompany.com',
      phone: '(555) 123-4567',
      hasPortal: true
    },
    items: [
      { name: 'Business Cards', qty: 1000, price: 250.00 },
      { name: 'Letterheads', qty: 500, price: 450.00 },
      { name: 'Envelopes', qty: 500, price: 350.00 }
    ],
    total: 1250.00,
    deposit: 625.00,
    terms: 'Net 30',
    delivery: '2-3 weeks'
  };

  const renderStepDetail = (step: number) => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Quote Form Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold mb-3">Quote Form</h4>
              
              {/* Brand Selection */}
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <label className="text-sm font-medium mb-2 block">Select Brand</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('SHUREPRINT')}
                    className={`flex-1 p-2 rounded border-2 transition-all ${
                      selectedBrand === 'SHUREPRINT' 
                        ? 'border-blue-600 bg-blue-100' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold">SHUREPRINT</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedBrand('SHW')}
                    className={`flex-1 p-2 rounded border-2 transition-all ${
                      selectedBrand === 'SHW' 
                        ? 'border-blue-600 bg-blue-100' 
                        : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold">SHW</div>
                  </button>
                </div>
              </div>
              
              {/* Customer Selector */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <label className="text-sm font-medium">Select Customer</label>
                <select className="w-full mt-1 px-3 py-2 border rounded-lg">
                  <option>ABC Company - John Smith 🌐</option>
                  <option>XYZ Corp - Jane Doe</option>
                  <option>+ New Customer</option>
                </select>
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <Globe className="h-4 w-4 mr-1" />
                  This customer has an active portal
                </div>
              </div>

              {/* Quote Items Table */}
              <div className="mb-4">
                <h5 className="text-sm font-medium mb-2">Quote Items</h5>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Product</th>
                      <th className="px-2 py-1">Qty</th>
                      <th className="px-2 py-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleQuoteData.items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="px-2 py-1">{item.name}</td>
                        <td className="px-2 py-1 text-center">{item.qty}</td>
                        <td className="px-2 py-1 text-right">${item.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Quote Settings */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-xs text-gray-600">Deposit %</label>
                  <input type="text" value="50%" className="w-full px-2 py-1 border rounded text-sm" readOnly />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Payment Terms</label>
                  <input type="text" value="Net 30" className="w-full px-2 py-1 border rounded text-sm" readOnly />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Delivery Time</label>
                  <input type="text" value="2-3 weeks" className="w-full px-2 py-1 border rounded text-sm" readOnly />
                </div>
                <div>
                  <label className="text-xs text-gray-600">Valid Days</label>
                  <input type="text" value="30" className="w-full px-2 py-1 border rounded text-sm" readOnly />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 bg-gray-600 text-white rounded text-sm">
                  Save Draft
                </button>
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm">
                  Send Quote
                </button>
              </div>
            </div>

            {/* Email Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Email Sent to Customer
              </h4>
              <div className="bg-white border rounded text-sm" style={{maxWidth: '500px'}}>
                {/* Email Header with Logo */}
                <div style={{backgroundColor: selectedBrand === 'SHUREPRINT' ? '#FFF9F0' : '#f8f9fa', padding: '20px', textAlign: 'center', borderBottom: '2px solid #E2DFDA', borderTopLeftRadius: '8px', borderTopRightRadius: '8px'}}>
                  <Image 
                    src={selectedBrand === 'SHUREPRINT' ? '/shureprint-logo.png' : '/shw-logo.png'} 
                    alt={`${selectedBrand} Logo`} 
                    width={120} 
                    height={40} 
                    style={{margin: '0 auto', objectFit: 'contain'}}
                  />
                  <p style={{color: '#666666', margin: '10px 0 5px', fontSize: '14px'}}>New Quote Available</p>
                </div>
                <div className="p-4">
                  <div className="font-medium mb-2">Subject: New Quote #{sampleQuoteData.quoteNumber}</div>
                  <div className="text-gray-600">
                    <p>Dear {sampleQuoteData.customer.name},</p>
                    <p className="mt-2">A new quote has been added to your portal.</p>
                    <div className="bg-green-50 border border-green-200 p-2 rounded mt-2">
                      <p className="text-green-800">✓ Portal Access Available</p>
                      <p className="text-green-600 text-xs">View and manage this quote in your dashboard</p>
                    </div>
                    <div className="text-center mt-4">
                      <button className="px-6 py-2 text-black font-bold rounded" style={{
                        backgroundColor: selectedBrand === 'SHUREPRINT' ? '#E3FF33' : '#007bff',
                        color: selectedBrand === 'SHUREPRINT' ? '#111111' : '#ffffff',
                        border: selectedBrand === 'SHUREPRINT' ? '2px solid #111111' : '2px solid #0056b3'
                      }}>
                        View in Portal →
                      </button>
                    </div>
                  </div>
                </div>
                {/* Email Footer */}
                <div style={{backgroundColor: '#FAF9F7', padding: '15px', textAlign: 'center', borderTop: '2px solid #E2DFDA', fontSize: '11px', color: '#666666', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px'}}>
                  <div style={{marginBottom: '5px', fontSize: '12px', fontWeight: 600}}>
                    {selectedBrand}
                  </div>
                  © {new Date().getFullYear()} {selectedBrand}. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Customer Portal View */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold mb-3">Customer Portal View</h4>
              
              <div className="bg-gray-50 rounded p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Quote #{sampleQuoteData.quoteNumber}</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Pending Approval</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Total: ${sampleQuoteData.total.toFixed(2)}</p>
                  <p>Deposit Required: ${sampleQuoteData.deposit.toFixed(2)}</p>
                </div>
              </div>

              {/* Approval Options */}
              <div className="space-y-2">
                <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm">
                  ✓ Approve Quote
                </button>
                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm">
                  <UserPlus className="h-4 w-4 inline mr-1" />
                  Delegate Approval to Another Person
                </button>
                <button className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  Request Changes
                </button>
              </div>
            </div>

            {/* Delegation Flow */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Approval Delegation</h4>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between p-2 bg-white rounded">
                  <span className="text-sm">Send approval request to:</span>
                  <input type="email" placeholder="manager@company.com" className="px-2 py-1 border rounded text-sm" />
                </div>
                <div className="text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  The designated person will receive an email to approve this quote
                </div>
              </div>
              
              {/* Delegation Email Preview */}
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Email Preview:</p>
                <div className="bg-white border rounded text-xs" style={{maxWidth: '400px'}}>
                  <div style={{backgroundColor: '#FFF9F0', padding: '15px', textAlign: 'center', borderBottom: '2px solid #E2DFDA', borderTopLeftRadius: '6px', borderTopRightRadius: '6px'}}>
                    <h2 style={{color: '#111111', margin: 0, fontWeight: 800, letterSpacing: '0.08em', fontSize: '18px'}}>SHUREPRINT</h2>
                    <p style={{color: '#666666', margin: '3px 0', fontSize: '12px'}}>Payment Delegation Request</p>
                  </div>
                  <div className="p-3">
                    <p className="text-gray-600">Quote #{sampleQuoteData.quoteNumber} has been approved and requires payment.</p>
                    <p className="mt-2 font-medium">Amount: ${sampleQuoteData.deposit.toFixed(2)}</p>
                    <div className="text-center mt-3">
                      <button className="px-4 py-1 text-black font-semibold rounded text-xs" style={{backgroundColor: '#E3FF33', border: '1px solid #111111'}}>
                        Pay Now →
                      </button>
                    </div>
                  </div>
                  <div style={{backgroundColor: '#FAF9F7', padding: '10px', textAlign: 'center', borderTop: '1px solid #E2DFDA', fontSize: '10px', color: '#666666', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px'}}>
                    © SHUREPRINT
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Invoice Generation */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold mb-3">Invoice Generation</h4>
              
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 inline mr-2" />
                <span className="font-medium">Quote Approved!</span>
                <p className="text-sm text-green-700 mt-1">Approved by: John Smith at 2:30 PM</p>
              </div>

              {/* Invoice Preview */}
              <div className="border rounded p-3">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-bold">INVOICE</h5>
                    <p className="text-sm text-gray-600">INV-{sampleQuoteData.quoteNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600">Due: Upon Receipt</p>
                  </div>
                </div>

                <table className="w-full text-sm mb-3">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Subtotal</td>
                      <td className="py-2 text-right">${sampleQuoteData.total.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Deposit (50%)</td>
                      <td className="py-2 text-right font-bold">${sampleQuoteData.deposit.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <button className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm">
                  Send Invoice to Customer
                </button>
              </div>
            </div>
            
            {/* Invoice Email Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Invoice Email to Customer
              </h4>
              <div className="bg-white border rounded text-sm" style={{maxWidth: '500px'}}>
                {/* Email Header with Logo */}
                <div style={{backgroundColor: selectedBrand === 'SHUREPRINT' ? '#FFF9F0' : '#f8f9fa', padding: '20px', textAlign: 'center', borderBottom: '2px solid #E2DFDA', borderTopLeftRadius: '8px', borderTopRightRadius: '8px'}}>
                  <Image 
                    src={selectedBrand === 'SHUREPRINT' ? '/shureprint-logo.png' : '/shw-logo.png'} 
                    alt={`${selectedBrand} Logo`} 
                    width={120} 
                    height={40} 
                    style={{margin: '0 auto', objectFit: 'contain'}}
                  />
                  <p style={{color: '#666666', margin: '10px 0 5px', fontSize: '14px'}}>Invoice #{sampleQuoteData.quoteNumber}</p>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <p className="font-medium mb-2">Invoice Details</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Invoice Number:</span>
                        <span className="font-medium">INV-{sampleQuoteData.quoteNumber}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Amount Due:</span>
                        <span className="font-bold text-lg">${sampleQuoteData.deposit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Due Date:</span>
                        <span>Upon Receipt</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Terms:</span>
                        <span>{sampleQuoteData.terms}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Dear {sampleQuoteData.customer.name},</p>
                    <p className="text-sm text-gray-600">Your approved quote has been converted to an invoice. A deposit of <strong>${sampleQuoteData.deposit.toFixed(2)}</strong> (50%) is required to begin production.</p>
                  </div>
                  
                  <div className="text-center">
                    <button className="px-6 py-2 font-bold rounded" style={{
                      backgroundColor: selectedBrand === 'SHUREPRINT' ? '#E3FF33' : '#007bff',
                      color: selectedBrand === 'SHUREPRINT' ? '#111111' : '#ffffff',
                      border: selectedBrand === 'SHUREPRINT' ? '2px solid #111111' : '2px solid #0056b3'
                    }}>
                      Pay Invoice Online →
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Or reply to this email for alternative payment methods</p>
                  </div>
                </div>
                {/* Email Footer */}
                <div style={{backgroundColor: '#FAF9F7', padding: '15px', borderTop: '2px solid #E2DFDA', fontSize: '11px', color: '#666666', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px'}}>
                  <div style={{marginBottom: '5px'}}>
                    <strong>Payment Methods Accepted:</strong> Credit Card • ACH Transfer • Check
                  </div>
                  <div style={{marginBottom: '5px', fontSize: '12px', fontWeight: 600}}>
                    {selectedBrand}
                  </div>
                  <div>Questions? Contact billing@{selectedBrand.toLowerCase()}.com</div>
                  <div style={{marginTop: '5px'}}>© {new Date().getFullYear()} {selectedBrand}. All rights reserved.</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {/* Payment Options */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold mb-3">Payment Processing</h4>
              
              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                <DollarSign className="h-5 w-5 text-blue-600 inline mr-2" />
                <span className="font-medium">Amount Due: ${sampleQuoteData.deposit.toFixed(2)}</span>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2 mb-3">
                <button className="w-full p-3 border rounded hover:bg-gray-50 text-left">
                  <CreditCard className="h-5 w-5 inline mr-2" />
                  Pay with Credit Card
                </button>
                <button className="w-full p-3 border rounded hover:bg-gray-50 text-left">
                  <Building className="h-5 w-5 inline mr-2" />
                  ACH Transfer
                </button>
                <button className="w-full p-3 border rounded hover:bg-gray-50 text-left">
                  <FileText className="h-5 w-5 inline mr-2" />
                  Pay by Check
                </button>
              </div>

              {/* Delegate Payment */}
              <div className="border-t pt-3">
                <h5 className="text-sm font-medium mb-2">Or Delegate Payment</h5>
                <div className="flex gap-2">
                  <input type="email" placeholder="accounting@company.com" className="flex-1 px-2 py-1 border rounded text-sm" />
                  <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm">
                    Delegate
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  The designated person will receive payment instructions
                </p>
              </div>
            </div>

            {/* Payment Confirmation */}
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">After Payment</h4>
              <div className="text-sm text-green-700">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                Payment confirmed - Production will begin immediately
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {/* Production Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold mb-3">Production & Delivery</h4>
              
              {/* Production Timeline */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-sm">Production Started</p>
                    <p className="text-xs text-gray-600">Order sent to production floor</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Eye className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-sm">Proof Ready</p>
                    <p className="text-xs text-gray-600">Digital proof sent for approval</p>
                    <button className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                      View Proof
                    </button>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Printer className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-sm">Printing</p>
                    <p className="text-xs text-gray-600">In production - 70% complete</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-sm">Quality Check</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>

                <div className="flex items-center opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-sm">Shipped</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-sm font-medium mb-1">Estimated Delivery</p>
                <p className="text-sm text-gray-600">{sampleQuoteData.delivery}</p>
              </div>
            </div>

            {/* Customer Notifications */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Customer Updates</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <Mail className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium">Email notifications sent at each stage:</p>
                    <ul className="text-xs text-gray-600 mt-1">
                      <li>• Production started</li>
                      <li>• Proof ready for review</li>
                      <li>• Order shipped with tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Image 
              src="/shureprint-logo.png" 
              alt="SHUREPRINT Logo" 
              width={150} 
              height={50} 
              className="object-contain"
              priority
            />
            <div className="h-12 w-px bg-gray-300" />
            <h1 className="text-3xl font-bold text-gray-900">Quote-to-Production Workflow</h1>
          </div>
          <p className="text-gray-600 mt-2">Complete visual workflow showing each step from quote to delivery</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Steps */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-4">Workflow Steps</h2>
              <div className="space-y-3">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isComplete = currentStep > step.id;
                  
                  return (
                    <div key={step.id}>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(step.id)}
                        className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer hover:shadow-md ${
                          isActive 
                            ? 'bg-blue-50 border-2 border-blue-500' 
                            : isComplete
                            ? 'bg-green-50 border border-green-300'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isActive 
                              ? 'bg-blue-500 text-white' 
                              : isComplete
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {isComplete ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Icon className="h-5 w-5" />
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="font-medium text-sm">{step.title}</p>
                            <p className="text-xs text-gray-600">{step.description}</p>
                          </div>
                          <ChevronRight className={`h-4 w-4 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
                        </div>
                      </button>
                      {index < workflowSteps.length - 1 && (
                        <div className="ml-5 h-8 border-l-2 border-gray-200"></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Overall Progress</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(currentStep / workflowSteps.length) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Step {currentStep} of {workflowSteps.length}
                </p>
              </div>
            </div>
          </div>

          {/* Step Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">
                    Step {currentStep}: {workflowSteps[currentStep - 1]?.title}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                      disabled={currentStep === 1}
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setCurrentStep(Math.min(workflowSteps.length, currentStep + 1))}
                      disabled={currentStep === workflowSteps.length}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {/* Step Actions */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Available Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    {workflowSteps[currentStep - 1]?.actions.map((action, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Step Visualization */}
                <div key={currentStep}>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Step Details</h3>
                  {renderStepDetail(currentStep)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Timeline */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Complete Timeline View</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200"></div>
            <div 
              className="absolute top-6 left-0 h-1 bg-blue-600 transition-all"
              style={{ width: `${(currentStep / workflowSteps.length) * 100}%` }}
            ></div>
            {workflowSteps.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              
              return (
                <button
                  type="button"
                  key={step.id} 
                  className="relative z-10 flex flex-col items-center cursor-pointer bg-transparent border-none p-0"
                  onClick={() => setCurrentStep(step.id)}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isActive 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-200' 
                      : isComplete
                      ? 'bg-green-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-400'
                  }`}>
                    {isComplete ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <p className="text-xs text-center mt-2 max-w-[100px]">{step.title}</p>
                  {step.emailType && (
                    <p className="text-xs text-gray-500 mt-1">
                      <Mail className="h-3 w-3 inline" />
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}