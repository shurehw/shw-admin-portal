import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const statementData = req.body;

    if (!statementData || !statementData.customer) {
      return res.status(400).json({ error: 'Statement data required' });
    }

    // Generate HTML version of the statement that can be converted to PDF on client side
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-info { text-align: right; margin-bottom: 20px; }
          .customer-info { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .summary { margin-top: 30px; }
          .aging { margin-top: 20px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>STATEMENT OF ACCOUNT</h1>
        </div>
        
        <div class="company-info">
          <strong>ShurePrint / Hwood Group</strong><br>
          123 Business Ave<br>
          Los Angeles, CA 90001<br>
          Phone: (555) 123-4567
        </div>
        
        <div class="statement-info">
          <p>Statement Date: ${new Date().toLocaleDateString()}</p>
          <p>Statement #: ${statementData.statement_id}</p>
          <p>Period: ${new Date(statementData.period.start).toLocaleDateString()} - ${new Date(statementData.period.end).toLocaleDateString()}</p>
        </div>
        
        <div class="customer-info">
          <h3>Account Information:</h3>
          <p>${statementData.customer.name}</p>
          ${statementData.customer.company ? `<p>${statementData.customer.company}</p>` : ''}
          <p>${statementData.customer.email}</p>
          ${statementData.customer.phone ? `<p>${statementData.customer.phone}</p>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            ${statementData.transactions.map((t: any) => `
              <tr>
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td>${t.description}</td>
                <td>${t.reference}</td>
                <td>${t.debit > 0 ? '$' + t.debit.toFixed(2) : ''}</td>
                <td>${t.credit > 0 ? '$' + t.credit.toFixed(2) : ''}</td>
                <td>$${t.balance.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="summary">
          <h3>Account Summary</h3>
          <table style="width: 50%; margin-left: auto;">
            <tr>
              <td>Opening Balance:</td>
              <td style="text-align: right;">$${statementData.summary.opening_balance.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Charges:</td>
              <td style="text-align: right;">$${statementData.summary.total_debits.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Total Payments:</td>
              <td style="text-align: right;">$${statementData.summary.total_credits.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold;">
              <td>Ending Balance:</td>
              <td style="text-align: right;">$${statementData.summary.ending_balance.toFixed(2)}</td>
            </tr>
          </table>
        </div>
        
        ${statementData.aging ? `
          <div class="aging">
            <h3>Aging Summary</h3>
            <table style="width: 100%;">
              <tr>
                <td>Current: $${statementData.aging.current.toFixed(2)}</td>
                <td>31-60 Days: $${statementData.aging.days_30.toFixed(2)}</td>
                <td>61-90 Days: $${statementData.aging.days_60.toFixed(2)}</td>
              </tr>
              <tr>
                <td>91-120 Days: $${statementData.aging.days_90.toFixed(2)}</td>
                <td>Over 120 Days: $${statementData.aging.over_90.toFixed(2)}</td>
                <td></td>
              </tr>
            </table>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Please remit payment to the address above. Thank you for your business!</p>
        </div>
      </body>
      </html>
    `;

    // Return HTML content that can be used for PDF generation on client side
    res.status(200).json({ 
      html: htmlContent,
      statement: statementData 
    });

  } catch (error) {
    console.error('Error generating statement:', error);
    res.status(500).json({ 
      error: 'Failed to generate statement',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}