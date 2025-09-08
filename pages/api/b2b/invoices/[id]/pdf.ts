import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const invoiceId = Array.isArray(id) ? id[0] : id;

  try {
    // Mock invoice data - in production, fetch from database
    const invoiceData = {
      invoiceNumber: invoiceId,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: session.user.companyName || 'Company Name',
      customerAddress: '1972 E 20th St, Los Angeles, CA 90058',
      items: [
        { description: 'Product A', quantity: 10, unitPrice: 123.45, total: 1234.50 },
        { description: 'Product B', quantity: 5, unitPrice: 246.91, total: 1234.56 },
      ],
      subtotal: 2469.06,
      tax: 197.52,
      total: 2666.58,
    };

    // Generate HTML for the invoice
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoiceData.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .company-info h1 { margin: 0; color: #333; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { margin: 0; color: #666; }
            .addresses { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .address-block { width: 45%; }
            .address-block h3 { margin: 0 0 10px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f5f5f5; padding: 10px; text-align: left; border: 1px solid #ddd; }
            td { padding: 10px; border: 1px solid #ddd; }
            .totals { text-align: right; }
            .totals table { width: 300px; margin-left: auto; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>Shure Hospitality Wholesale</h1>
              <p>1972 E 20th St<br>Los Angeles, CA 90058<br>Phone: (310) 971-9571<br>Email: cs@shurehw.com</p>
            </div>
            <div class="invoice-details">
              <h2>INVOICE</h2>
              <p><strong>Invoice #:</strong> ${invoiceData.invoiceNumber}</p>
              <p><strong>Date:</strong> ${invoiceData.date}</p>
              <p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
            </div>
          </div>
          
          <div class="addresses">
            <div class="address-block">
              <h3>Bill To:</h3>
              <p>${invoiceData.customerName}<br>${invoiceData.customerAddress}</p>
            </div>
            <div class="address-block">
              <h3>Ship To:</h3>
              <p>${invoiceData.customerName}<br>${invoiceData.customerAddress}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <table>
              <tr>
                <td><strong>Subtotal:</strong></td>
                <td>$${invoiceData.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Tax:</strong></td>
                <td>$${invoiceData.tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td><strong>Total:</strong></td>
                <td><strong>$${invoiceData.total.toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="footer">
            <p>Payment Terms: NET 30</p>
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;

    // For now, return HTML as PDF would require additional library
    // In production, use a library like puppeteer or pdfkit to generate actual PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceId}.pdf"`);
    
    // Mock PDF response - in production, convert HTML to PDF
    // For demo purposes, sending HTML with PDF headers
    res.status(200).send(Buffer.from(html));
    
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    res.status(500).json({ error: 'Failed to generate invoice PDF' });
  }
}