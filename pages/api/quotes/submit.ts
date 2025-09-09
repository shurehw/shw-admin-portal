import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs/promises';
import path from 'path';

// In production, this would save to a database
// For now, we'll save to a JSON file
const QUOTES_DB_PATH = path.join(process.cwd(), 'data', 'quote-requests.json');

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function getQuoteRequests() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(QUOTES_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveQuoteRequests(requests: any[]) {
  await ensureDataDir();
  await fs.writeFile(QUOTES_DB_PATH, JSON.stringify(requests, null, 2));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const quoteRequest = {
        id: Date.now().toString(),
        ...req.body,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      };

      const requests = await getQuoteRequests();
      requests.push(quoteRequest);
      await saveQuoteRequests(requests);

      // Also sync to Trello if configured
      if (process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN) {
        try {
          await fetch(`${req.headers.origin}/api/integrations/trello/sync-quote`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
          });
        } catch (error) {
          console.error('Failed to sync to Trello:', error);
        }
      }

      res.status(200).json({ 
        success: true, 
        message: 'Quote request submitted successfully',
        id: quoteRequest.id 
      });
    } catch (error) {
      console.error('Error saving quote request:', error);
      res.status(500).json({ error: 'Failed to save quote request' });
    }
  } else if (req.method === 'GET') {
    try {
      const requests = await getQuoteRequests();
      res.status(200).json({ success: true, requests });
    } catch (error) {
      console.error('Error fetching quote requests:', error);
      res.status(500).json({ error: 'Failed to fetch quote requests' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}