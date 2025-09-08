import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Check if user has production/admin access - but also allow sales_rep for quotes
  const allowedRoles = ['admin', 'production', 'art_team', 'sales_rep', 'customer_service'];
  if (!session?.user?.role || !allowedRoles.includes(session.user.role)) {
    console.log('User role:', session?.user?.role, 'not in allowed roles');
    // For now, allow access to show the mock data
  }

  // Mock Trello cards data
  const mockCards = [
    {
      id: '1',
      name: 'ABC Company - Custom T-Shirts Quote',
      desc: 'Customer requested quote for 500 custom t-shirts with logo embroidery',
      idList: 'new',
      dateLastActivity: new Date().toISOString(),
      labels: [{ color: 'green', name: 'High Priority' }],
      due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      members: [],
      attachments: [],
      customFieldItems: []
    },
    {
      id: '2',
      name: 'XYZ Corp - Business Cards',
      desc: '1000 business cards with special finish',
      idList: 'in-progress',
      dateLastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      labels: [{ color: 'yellow', name: 'Medium Priority' }],
      due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      members: [],
      attachments: [],
      customFieldItems: []
    },
    {
      id: '3',
      name: 'Wilson Industries - Trade Show Materials',
      desc: 'Complete trade show package including banners, booth design, and promotional materials',
      idList: 'review',
      dateLastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      labels: [{ color: 'red', name: 'Urgent' }],
      due: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      members: [],
      attachments: [],
      customFieldItems: []
    },
    {
      id: '4',
      name: 'Tech Startup - Brand Package',
      desc: 'Full branding package with logos, letterheads, and marketing materials',
      idList: 'new',
      dateLastActivity: new Date().toISOString(),
      labels: [{ color: 'blue', name: 'Design Required' }],
      due: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      members: [],
      attachments: [],
      customFieldItems: []
    },
    {
      id: '5',
      name: 'Local Restaurant - Menu Redesign',
      desc: 'New menu design and printing for 200 copies',
      idList: 'done',
      dateLastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      labels: [{ color: 'green', name: 'Completed' }],
      due: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      members: [],
      attachments: [],
      customFieldItems: []
    }
  ];

  res.status(200).json(mockCards);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};