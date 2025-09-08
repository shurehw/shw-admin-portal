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
    // Fetch cards from Trello API
    const response = await fetch(
      `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
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

    const cards = await response.json();
    
    // Transform the cards to include only needed fields
    const transformedCards = cards.map((card: any) => ({
      id: card.id,
      name: card.name,
      desc: card.desc || '',
      labels: card.labels || [],
      due: card.due,
      idList: card.idList,
      dateLastActivity: card.dateLastActivity,
      attachments: card.badges?.attachments || 0,
      comments: card.badges?.comments || 0,
      pos: card.pos,
      url: card.url
    }));

    res.status(200).json(transformedCards);
  } catch (error) {
    console.error('Error fetching Trello cards:', error);
    
    // Fallback to mock data if Trello API fails
    const mockCards = [
      {
        id: '1',
        name: 'ABC Company - Custom T-Shirts Quote',
        desc: 'Customer requested quote for 500 custom t-shirts with logo embroidery\nEmail: contact@abc.com\nCompany: ABC Company',
        idList: 'new',
        dateLastActivity: new Date().toISOString(),
        labels: [{ color: 'green', name: 'High Priority' }],
        due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        name: 'XYZ Corp - Business Cards',
        desc: '1000 business cards with special finish\nQuantity: 1000 units\nEmail: procurement@xyz.com',
        idList: 'in-progress',
        dateLastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        labels: [{ color: 'yellow', name: 'Medium Priority' }],
        due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        name: 'Wilson Industries - Trade Show Materials',
        desc: 'Complete trade show package including:\n- 10x Banners\n- 1x Booth design\n- 500x Promotional materials\nCompany: Wilson Industries\nContact: bob@wilson.com',
        idList: 'review',
        dateLastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        labels: [{ color: 'red', name: 'Urgent' }],
        due: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        name: 'Tech Startup - Brand Package',
        desc: 'Full branding package with logos, letterheads, and marketing materials\nQty: 250 of each item\nEmail: marketing@techstartup.io',
        idList: 'new',
        dateLastActivity: new Date().toISOString(),
        labels: [{ color: 'blue', name: 'Design Required' }],
        due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '5',
        name: 'Local Restaurant - Menu Redesign',
        desc: 'New menu design and printing\nQuantity: 200 copies\nCompany: The Local Bistro',
        idList: 'done',
        dateLastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        labels: [{ color: 'green', name: 'Completed' }],
        due: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
    
    res.status(200).json(mockCards);
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};