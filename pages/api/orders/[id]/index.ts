import type { NextApiRequest, NextApiResponse } from 'next';
import { store } from '@/lib/store';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }
  
  const order = await store.getOrder(id);
  if (!order) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.status(200).json(order);
}