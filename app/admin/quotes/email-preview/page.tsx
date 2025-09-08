'use client';

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Mail, Eye, Send, FileText, CheckCircle, DollarSign, UserCheck, CreditCard, AlertCircle } from 'lucide-react';

// Email template types
const emailTypes = {
  quote: 'New Quote',
  quote_portal: 'New Quote (Portal Customer)',
  approval_request: 'Approval Request',
  quote_approved: 'Quote Approved',
  invoice: 'Invoice',
  payment_request: 'Payment Request',
  payment_delegated: 'Payment Delegated',
  proof_ready: 'Proof Ready for Review',
  proof_approved: 'Proof Approved',
  production_complete: 'Production Complete'
};

export default function EmailPreviewPage() {
  const [selectedType, setSelectedType] = useState('quote');
  const [showRawHtml, setShowRawHtml] = useState(false);
  
  // Sample data for templates
  const sampleData = {
    quoteNumber: 'QT-2024-123456',
    customerName: 'John Smith',
    companyName: 'ABC Company',
    customerEmail: 'john@abccompany.com',
    projectName: 'Business Cards - Premium',
    total: 1250.00,
    deposit: 625.00,
    validUntil: '2024-12-31',
    portalUrl: 'https://portal.shurehw.com/quotes/QT-2024-123456',
    approverName: 'Sarah Johnson',
    approverEmail: 'sarah@abccompany.com',
    payerName: 'Mike Wilson',
    payerEmail: 'mike@abccompany.com',
    items: [
      { name: 'Business Cards', quantity: 1000, price: 250.00 },
      { name: 'Letterheads', quantity: 500, price: 450.00 },
      { name: 'Envelopes', quantity: 500, price: 350.00 }
    ]
  };

  // Email templates
  const getEmailTemplate = (type: string) => {
    const baseStyles = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .email-container { max-width: 600px; margin: 0 auto; background: #FFF9F0; }
        .header { background: #111; color: #E3FF33; padding: 20px; text-align: center; }
        .content { padding: 30px; background: white; }
        .footer { background: #FAF9F7; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .btn { display: inline-block; padding: 12px 30px; background: #E3FF33; color: #111; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .btn-secondary { background: white; border: 2px solid #111; }
        .info-box { background: #FAF9F7; border: 1px solid #E2DFDA; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .warning-box { background: #fff8e1; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .success-box { background: #f0f8f0; border: 1px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E2DFDA; }
        th { background: #FAF9F7; font-weight: bold; }
      </style>
    `;

    const header = `
      <div class="header">
        <h1 style="margin: 0; letter-spacing: 2px;">SHUREPRINT</h1>
        <p style="margin: 5px 0; font-size: 14px;">${emailTypes[type]}</p>
      </div>
    `;

    const footer = `
      <div class="footer">
        <p>© 2024 ShurePrint. All rights reserved.</p>
        <p>This email is confidential and intended solely for the addressee.</p>
        <p>
          ShurePrint | 123 Business Ave, New York, NY 10001<br>
          Phone: (555) 123-4567 | Email: info@shurehw.com
        </p>
      </div>
    `;

    let content = '';
    
    switch(type) {
      case 'quote':
        content = `
          <div class="content">
            <h2>New Quote: ${sampleData.quoteNumber}</h2>
            <p>Dear ${sampleData.customerName},</p>
            <p>Thank you for your interest in ShurePrint services. We're pleased to provide you with a quote for your project: <strong>${sampleData.projectName}</strong>.</p>
            
            <div class="info-box">
              <h3>Quote Details:</h3>
              <table>
                <tr><td><strong>Quote Number:</strong></td><td>${sampleData.quoteNumber}</td></tr>
                <tr><td><strong>Project:</strong></td><td>${sampleData.projectName}</td></tr>
                <tr><td><strong>Total Amount:</strong></td><td>$${sampleData.total.toFixed(2)}</td></tr>
                <tr><td><strong>Deposit Required:</strong></td><td>$${sampleData.deposit.toFixed(2)}</td></tr>
                <tr><td><strong>Valid Until:</strong></td><td>${sampleData.validUntil}</td></tr>
              </table>
            </div>

            <h3>Items:</h3>
            <table>
              <thead>
                <tr><th>Item</th><th>Quantity</th><th>Price</th></tr>
              </thead>
              <tbody>
                ${sampleData.items.map(item => `
                  <tr><td>${item.name}</td><td>${item.quantity}</td><td>$${item.price.toFixed(2)}</td></tr>
                `).join('')}
              </tbody>
            </table>

            <div style="text-align: center;">
              <a href="#" class="btn">View & Accept Quote</a>
            </div>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The ShurePrint Team</p>
          </div>
        `;
        break;

      case 'quote_portal':
        content = `
          <div class="content">
            <h2>New Quote Available in Your Portal</h2>
            <p>Dear ${sampleData.customerName},</p>
            <p>A new quote has been added to your ShurePrint customer portal.</p>
            
            <div class="success-box">
              <p><strong>🌐 Portal Access Available</strong></p>
              <p>As a portal customer, you can view, manage, and approve quotes directly from your dashboard.</p>
            </div>

            <div class="info-box">
              <h3>Quote Summary:</h3>
              <table>
                <tr><td><strong>Quote Number:</strong></td><td>${sampleData.quoteNumber}</td></tr>
                <tr><td><strong>Project:</strong></td><td>${sampleData.projectName}</td></tr>
                <tr><td><strong>Total Amount:</strong></td><td>$${sampleData.total.toFixed(2)}</td></tr>
              </table>
            </div>

            <div style="text-align: center;">
              <a href="${sampleData.portalUrl}" class="btn">View in Portal</a>
            </div>
            
            <p>You can also:</p>
            <ul>
              <li>Track quote status in real-time</li>
              <li>Approve or request changes</li>
              <li>Delegate payment to another team member</li>
              <li>View all past quotes and invoices</li>
            </ul>
          </div>
        `;
        break;

      case 'approval_request':
        content = `
          <div class="content">
            <h2>Quote Approval Required</h2>
            <p>Dear ${sampleData.approverName},</p>
            <p>${sampleData.customerName} has requested your approval for the following quote:</p>
            
            <div class="warning-box">
              <p><strong>⚠️ Action Required</strong></p>
              <p>This quote requires your approval before proceeding to production.</p>
            </div>

            <div class="info-box">
              <h3>Quote Details:</h3>
              <table>
                <tr><td><strong>Quote Number:</strong></td><td>${sampleData.quoteNumber}</td></tr>
                <tr><td><strong>Requested By:</strong></td><td>${sampleData.customerName}</td></tr>
                <tr><td><strong>Project:</strong></td><td>${sampleData.projectName}</td></tr>
                <tr><td><strong>Total Amount:</strong></td><td>$${sampleData.total.toFixed(2)}</td></tr>
              </table>
            </div>

            <div style="text-align: center;">
              <a href="#" class="btn">Review & Approve</a>
              <a href="#" class="btn btn-secondary">Decline</a>
            </div>
          </div>
        `;
        break;

      case 'invoice':
        content = `
          <div class="content">
            <h2>Invoice: ${sampleData.quoteNumber}</h2>
            <p>Dear ${sampleData.customerName},</p>
            <p>Your quote has been approved. Please find the invoice details below:</p>
            
            <div class="info-box">
              <h3>Invoice Summary:</h3>
              <table>
                <tr><td><strong>Invoice Number:</strong></td><td>INV-${sampleData.quoteNumber}</td></tr>
                <tr><td><strong>Due Date:</strong></td><td>Upon Receipt</td></tr>
                <tr><td><strong>Total Amount:</strong></td><td>$${sampleData.total.toFixed(2)}</td></tr>
                <tr><td><strong>Deposit Due:</strong></td><td>$${sampleData.deposit.toFixed(2)}</td></tr>
              </table>
            </div>

            <h3>Payment Options:</h3>
            <ul>
              <li>Credit Card (Visa, MasterCard, AmEx)</li>
              <li>ACH Transfer</li>
              <li>Check (payable to ShurePrint)</li>
            </ul>

            <div style="text-align: center;">
              <a href="#" class="btn">Pay Now</a>
              <a href="#" class="btn btn-secondary">Delegate Payment</a>
            </div>
          </div>
        `;
        break;

      case 'payment_delegated':
        content = `
          <div class="content">
            <h2>Payment Request Delegated to You</h2>
            <p>Dear ${sampleData.payerName},</p>
            <p>${sampleData.customerName} has delegated the following payment to you:</p>
            
            <div class="warning-box">
              <p><strong>💳 Payment Required</strong></p>
              <p>You have been authorized to complete this payment on behalf of ${sampleData.companyName}.</p>
            </div>

            <div class="info-box">
              <h3>Payment Details:</h3>
              <table>
                <tr><td><strong>Invoice Number:</strong></td><td>INV-${sampleData.quoteNumber}</td></tr>
                <tr><td><strong>Amount Due:</strong></td><td>$${sampleData.deposit.toFixed(2)}</td></tr>
                <tr><td><strong>Project:</strong></td><td>${sampleData.projectName}</td></tr>
                <tr><td><strong>Delegated By:</strong></td><td>${sampleData.customerName}</td></tr>
              </table>
            </div>

            <div style="text-align: center;">
              <a href="#" class="btn">Complete Payment</a>
            </div>
          </div>
        `;
        break;

      default:
        content = `
          <div class="content">
            <h2>${emailTypes[type]}</h2>
            <p>Email template for ${emailTypes[type]} is being developed.</p>
          </div>
        `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${emailTypes[type]}</title>
        ${baseStyles}
      </head>
      <body>
        <div class="email-container">
          ${header}
          ${content}
          ${footer}
        </div>
      </body>
      </html>
    `;
  };

  const currentTemplate = getEmailTemplate(selectedType);

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Mail className="h-8 w-8 mr-3" />
            Email Templates Preview
          </h1>
          <p className="text-gray-600 mt-2">Preview and test email templates for quotes, approvals, and invoices</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold mb-4">Email Types</h2>
              <div className="space-y-2">
                {Object.entries(emailTypes).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedType === key 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {key.includes('quote') && <FileText className="h-4 w-4 mr-2" />}
                      {key.includes('approval') && <UserCheck className="h-4 w-4 mr-2" />}
                      {key.includes('invoice') && <DollarSign className="h-4 w-4 mr-2" />}
                      {key.includes('payment') && <CreditCard className="h-4 w-4 mr-2" />}
                      {key.includes('proof') && <CheckCircle className="h-4 w-4 mr-2" />}
                      <span className="text-sm">{label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  <strong>Environment Variables:</strong>
                </p>
                <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                  <li>• Quotes: {process.env.COMPANY_QUOTES_EMAIL || 'Not configured'}</li>
                  <li>• Proofs: {process.env.COMPANY_PROOFS_EMAIL || 'Not configured'}</li>
                  <li>• Billing: {process.env.COMPANY_BILLING_EMAIL || 'Not configured'}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="border-b px-6 py-4 flex justify-between items-center">
                <h2 className="font-semibold">Preview: {emailTypes[selectedType]}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowRawHtml(!showRawHtml)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    {showRawHtml ? 'Visual' : 'HTML'} View
                  </button>
                  <button
                    className="px-3 py-1 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Send Test
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {showRawHtml ? (
                  <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto max-h-[600px]">
                    <code>{currentTemplate}</code>
                  </pre>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={currentTemplate}
                      className="w-full h-[600px]"
                      title="Email Preview"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Information */}
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quote Workflow Sequence</h2>
          <div className="flex items-center justify-between">
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm font-medium">Quote Sent</p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <UserCheck className="h-6 w-6 text-yellow-600" />
              </div>
              <p className="text-sm font-medium">Approval</p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">Invoice</p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-sm font-medium">Payment</p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">Production</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}