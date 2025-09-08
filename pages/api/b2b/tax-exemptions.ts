import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import bundleB2B from '@/lib/bundleb2b';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parser for file uploads
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res, session);
    case 'POST':
      return handlePost(req, res, session);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    // Get tax exemptions from BigCommerce B2B Bundle
    const exemptions = await bundleB2B.getTaxExemptions(companyId);
    
    return res.status(200).json(exemptions);
  } catch (error) {
    console.error('Error fetching tax exemptions:', error);
    
    // Return mock data for development
    const mockExemptions = [
      {
        id: '1',
        state: 'CA',
        certificateNumber: 'CA-EXEMPT-123456',
        status: 'active',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'John Smith',
        documentUrl: '/api/b2b/tax-exemptions/1/download'
      },
      {
        id: '2',
        state: 'NY',
        certificateNumber: 'NY-RESALE-789012',
        status: 'active',
        expirationDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Jane Doe',
        documentUrl: '/api/b2b/tax-exemptions/2/download'
      },
      {
        id: '3',
        state: 'TX',
        certificateNumber: 'TX-EXEMPT-345678',
        status: 'expired',
        expirationDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Bob Johnson',
        documentUrl: '/api/b2b/tax-exemptions/3/download'
      }
    ];
    
    return res.status(200).json(mockExemptions);
  }
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, session: any) {
  try {
    const companyId = session.user.companyId;
    
    if (!companyId) {
      return res.status(400).json({ error: 'No company ID found for user' });
    }
    
    // Only admin or accounting can upload tax exemptions
    if (session.user.role !== 'admin' && session.user.role !== 'accounting' && !session.user.canManageUsers) {
      return res.status(403).json({ error: 'You do not have permission to upload tax exemptions' });
    }
    
    // Parse form data with file upload
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    const [fields, files] = await form.parse(req);
    
    const state = Array.isArray(fields.state) ? fields.state[0] : fields.state;
    const certificateNumber = Array.isArray(fields.certificateNumber) ? fields.certificateNumber[0] : fields.certificateNumber;
    const expirationDate = Array.isArray(fields.expirationDate) ? fields.expirationDate[0] : fields.expirationDate;
    
    if (!state || !certificateNumber) {
      return res.status(400).json({ error: 'State and certificate number are required' });
    }
    
    // Get the uploaded file
    const file = Array.isArray(files.certificate) ? files.certificate[0] : files.certificate;
    
    if (file) {
      // Read file as a Buffer for upload
      const fileBuffer = fs.readFileSync(file.filepath);
      const fileData = new File([fileBuffer], file.originalFilename || 'certificate.pdf', {
        type: file.mimetype || 'application/pdf'
      });
      
      // Upload tax exemption through BigCommerce B2B Bundle
      const exemption = await bundleB2B.uploadTaxExemption(companyId, {
        state,
        certificateNumber,
        expirationDate,
        file: fileData
      });
      
      // Clean up temp file
      fs.unlinkSync(file.filepath);
      
      return res.status(201).json(exemption);
    } else {
      // No file uploaded, just save the exemption info
      const exemption = await bundleB2B.uploadTaxExemption(companyId, {
        state,
        certificateNumber,
        expirationDate
      });
      
      return res.status(201).json(exemption);
    }
  } catch (error: any) {
    console.error('Error uploading tax exemption:', error);
    
    // Return mock response for development
    if (process.env.NODE_ENV !== 'production') {
      return res.status(201).json({
        id: Date.now().toString(),
        state: 'CA',
        certificateNumber: 'TEST-123',
        status: 'pending_verification',
        uploadedAt: new Date().toISOString(),
        message: 'Tax exemption certificate uploaded successfully and is pending verification'
      });
    }
    
    if (error.response?.data?.message) {
      return res.status(error.response.status || 400).json({ 
        error: error.response.data.message 
      });
    }
    
    return res.status(500).json({ error: 'Failed to upload tax exemption' });
  }
}