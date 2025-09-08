import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

// This API proxies requests to your existing quote builder
const QUOTE_BUILDER_URL = process.env.QUOTE_BUILDER_INTERNAL_URL || 'http://localhost:3003';
const QUOTE_BUILDER_API_KEY = process.env.QUOTE_BUILDER_API_KEY || 'sk-shureprint-api-2024';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user has production/admin access
  const allowedRoles = ['admin', 'production', 'art_team'];
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    return res.status(403).json({ error: 'Forbidden - Production access required' });
  }

  // Extract the path after /api/admin/quote-builder/proxy
  const { path = [], ...queryParams } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;

  try {
    // Build the target URL
    const targetUrl = new URL(`${QUOTE_BUILDER_URL}/${targetPath}`);
    
    // Add query parameters
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) {
        targetUrl.searchParams.append(key, String(value));
      }
    });

    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-API-Key': QUOTE_BUILDER_API_KEY,
      'X-User-Email': session.user.email || '',
      'X-User-Name': session.user.name || '',
      'X-User-Role': session.user.role || ''
    };

    // Make the request to the quote builder
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();

    // Return the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Quote builder proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to quote builder',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Support larger payloads for images/PDFs
    }
  }
};