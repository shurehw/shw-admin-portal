import type { NextApiRequest, NextApiResponse } from 'next';

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;
const TRELLO_LIST_ID = process.env.TRELLO_QUOTES_LIST_ID;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customer, salesRep, createdAt } = req.body;

    // Format the card description
    const description = formatQuoteDescription(items, customer, salesRep);

    // Create card title
    const title = `Quote Request - ${customer?.name || 'Unknown Customer'} - ${new Date(createdAt).toLocaleDateString()}`;

    // Create Trello card
    const cardResponse = await fetch(
      `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title,
          desc: description,
          idList: TRELLO_LIST_ID,
          pos: 'top',
        }),
      }
    );

    if (!cardResponse.ok) {
      throw new Error('Failed to create Trello card');
    }

    const card = await cardResponse.json();

    // Add members (customer and sales rep) to the card if available
    const memberIds = await getMemberIds(customer, salesRep);
    
    for (const memberId of memberIds) {
      if (memberId) {
        await fetch(
          `https://api.trello.com/1/cards/${card.id}/idMembers?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value: memberId,
            }),
          }
        );
      }
    }

    // Add labels if needed
    await addLabels(card.id, items);

    res.status(200).json({ 
      success: true, 
      cardId: card.id,
      cardUrl: card.url 
    });
  } catch (error) {
    console.error('Error syncing to Trello:', error);
    res.status(500).json({ error: 'Failed to sync to Trello' });
  }
}

function formatQuoteDescription(items: any[], customer: any, salesRep: any): string {
  let description = `**Customer & Sales Information:**\n`;
  description += `- Customer: ${customer?.name || 'Not specified'}\n`;
  description += `- Sales Rep: ${salesRep?.name || 'Not specified'}\n\n`;
  
  description += `**Quote Items:**\n\n`;
  
  items.forEach((item, index) => {
    description += `**Item ${index + 1}: ${item.productService || 'Unnamed Item'}**\n`;
    
    if (item.additionalDetails) {
      description += `Details: ${item.additionalDetails}\n`;
    }
    
    if (item.quantities && item.quantities.length > 0) {
      description += `Quantities: ${item.quantities.map((q: any) => q.value).join(', ')}\n`;
    }
    
    if (item.colorOptions && item.colorOptions.length > 0) {
      description += `Color Options: ${item.colorOptions.map((c: any) => {
        if (c.colorType === 'Other' && c.customColorDescription) {
          return `Other: ${c.customColorDescription}`;
        } else if (c.colorType === 'CMYK') {
          return 'CMYK (Full Color)';
        } else {
          return `${c.colorType} Color${c.colorType !== '1' ? 's' : ''}`;
        }
      }).join(', ')}\n`;
    }
    
    if (item.pantoneColors && item.pantoneColors.length > 0) {
      description += `Pantone Colors: ${item.pantoneColors.map((p: any) => p.color).filter(Boolean).join(', ')}\n`;
    }
    
    if (item.printedSides && item.printedSides.length > 0) {
      description += `Printed Sides: ${item.printedSides.map((s: any) => `${s.sides} side(s)`).join(', ')}\n`;
    }
    
    if (item.artFiles && item.artFiles.length > 0) {
      description += `Art Files: ${item.artFiles.map((f: any) => f.fileName).join(', ')}\n`;
    }
    
    description += '\n';
  });
  
  return description;
}

async function getMemberIds(customer: any, salesRep: any): Promise<string[]> {
  const memberIds: string[] = [];
  
  try {
    // Get board members
    const membersResponse = await fetch(
      `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/members?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
    );
    
    if (membersResponse.ok) {
      const members = await membersResponse.json();
      
      // Find member IDs by matching names
      members.forEach((member: any) => {
        // Match sales rep (more important for Trello assignment)
        if (salesRep?.name && member.fullName.toLowerCase().includes(salesRep.name.toLowerCase())) {
          memberIds.push(member.id);
        }
        // Optionally match customer if they are also a Trello member
        if (customer?.name && member.fullName.toLowerCase().includes(customer.name.toLowerCase())) {
          memberIds.push(member.id);
        }
      });
    }
  } catch (error) {
    console.error('Error getting member IDs:', error);
  }
  
  return memberIds;
}

async function addLabels(cardId: string, items: any[]): Promise<void> {
  try {
    // Get existing labels on the board
    const labelsResponse = await fetch(
      `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/labels?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
    );
    
    if (labelsResponse.ok) {
      const labels = await labelsResponse.json();
      
      // Find or create "Quote" label
      let quoteLabel = labels.find((l: any) => l.name === 'Quote');
      
      if (!quoteLabel) {
        // Create the label if it doesn't exist
        const createLabelResponse = await fetch(
          `https://api.trello.com/1/labels?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Quote',
              color: 'purple',
              idBoard: TRELLO_BOARD_ID,
            }),
          }
        );
        
        if (createLabelResponse.ok) {
          quoteLabel = await createLabelResponse.json();
        }
      }
      
      // Add the label to the card
      if (quoteLabel) {
        await fetch(
          `https://api.trello.com/1/cards/${cardId}/idLabels?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value: quoteLabel.id,
            }),
          }
        );
      }
    }
  } catch (error) {
    console.error('Error adding labels:', error);
  }
}