import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }
  
  const events = await store.listEvents(id);
  res.status(200).json({ events });
}