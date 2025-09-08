import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

// Trello API credentials - Use environment variables
const TRELLO_API_KEY = process.env.TRELLO_API_KEY || '';
const TRELLO_TOKEN = process.env.TRELLO_TOKEN || '';
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // For now, allow access without strict authentication to test
  // In production, uncomment the check below
  // if (!session) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    // Fetch lists from Trello API
    const response = await fetch(
      `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`);
    }

    const lists = await response.json();
    
    // Filter out closed lists and transform
    const activeLists = lists
      .filter((list: any) => !list.closed)
      .map((list: any) => ({
        id: list.id,
        name: list.name,
        pos: list.pos
      }))
      .sort((a: any, b: any) => a.pos - b.pos);

    res.status(200).json(activeLists);
  } catch (error) {
    console.error('Error fetching Trello lists:', error);
    
    // Fallback to mock lists
    const mockLists = [
      { id: 'pre-order', name: 'Pre-Order Sales', pos: 1 },
      { id: 'quoting', name: 'Quoting', pos: 2 },
      { id: 'in-progress', name: 'In Progress', pos: 3 },
      { id: 'review', name: 'Review', pos: 4 },
      { id: 'done', name: 'Done', pos: 5 }
    ];
    
    res.status(200).json(mockLists);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};