import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://ifyjjvbqmyyuhzpoxlsl.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// Trello credentials
const TRELLO_API_KEY = process.env.TRELLO_API_KEY || '';
const TRELLO_TOKEN = process.env.TRELLO_TOKEN || '';
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID || '686da04ff3f765a86406b2c0';
const TRELLO_LIST_ID = process.env.TRELLO_QUOTES_LIST_ID || process.env.TRELLO_LIST_ID;

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '50mb'
  },
};

// Available cover colors in Trello
const COVER_COLORS = ['pink', 'yellow', 'lime', 'blue', 'black', 'orange', 'red', 'purple', 'sky', 'green'];

// Save quote request to database
async function saveQuoteToDatabase(quoteData: any) {
  const dataPath = path.join(process.cwd(), 'data');
  const filePath = path.join(dataPath, 'quote-requests.json');
  
  try {
    await fs.mkdir(dataPath, { recursive: true });
    let requests = [];
    
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      requests = JSON.parse(existing);
    } catch {
      // File doesn't exist yet
    }
    
    requests.push(quoteData);
    await fs.writeFile(filePath, JSON.stringify(requests, null, 2));
  } catch (error) {
    console.error('Error saving to database:', error);
  }
}

// Upload file to Supabase Storage
async function uploadToSupabase(file: any, quoteId: string) {
  try {
    const fileData = await fs.readFile(file.filepath);
    const fileName = `quotes/${quoteId}/${Date.now()}-${file.originalFilename}`;
    
    const { data, error } = await supabase.storage
      .from('quote-attachments')
      .upload(fileName, fileData, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('quote-attachments')
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error uploading to Supabase:', error);
    return null;
  }
}

// Get or create "Linked" label
async function getLinkedLabel() {
  try {
    const labelsResponse = await fetch(
      `https://api.trello.com/1/boards/${TRELLO_BOARD_ID}/labels?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`
    );
    
    if (labelsResponse.ok) {
      const labels = await labelsResponse.json();
      let linkedLabel = labels.find((l: any) => 
        l.name?.toLowerCase() === 'linked'
      );
      
      if (!linkedLabel) {
        // Create the "Linked" label with green color
        const createLabelResponse = await fetch(
          `https://api.trello.com/1/labels?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: 'Linked',
              color: 'green',
              idBoard: TRELLO_BOARD_ID,
            }),
          }
        );
        
        if (createLabelResponse.ok) {
          linkedLabel = await createLabelResponse.json();
        }
      }
      
      return linkedLabel;
    }
  } catch (error) {
    console.error('Error getting/creating linked label:', error);
  }
  return null;
}

// Template card ID for creating new cards
const TEMPLATE_CARD_ID = 'YJjK5hDe';

// Create individual Trello card for each item
async function createTrelloCardForItem(
  item: any, 
  quoteData: any, 
  itemIndex: number, 
  fileUrls: string[],
  coverColor: string,
  linkedLabelId?: string
) {
  try {
    // Format description with order details section for quote specs
    let description = `**Customer Information**\n`;
    description += `Customer: ${quoteData.customer?.name || 'Not specified'}\n`;
    description += `Sales Rep: ${quoteData.salesRep?.name || 'Not specified'}\n`;
    description += `Submitted: ${new Date(quoteData.submittedAt).toLocaleString()}\n\n`;
    
    description += `**ORDER DETAILS (To Be Quoted)**\n`;
    description += `_Note: These are preliminary specifications for quote. Final details will be updated in custom fields after confirmation._\n\n`;
    
    if (item.additionalDetails) {
      description += `Product Notes: ${item.additionalDetails}\n\n`;
    }
    
    // Add quantities, colors, and printed sides to description for quoting
    if (item.quantities?.length > 0) {
      description += `**Requested Quantities:** ${item.quantities.map((q: any) => q.value).join(', ')}\n`;
    }
    
    if (item.colorOptions?.length > 0) {
      description += `**Color Options to Quote:** ${item.colorOptions.map((c: any) => {
        if (c.colorType === 'Other' && c.customColorDescription) {
          return `Other: ${c.customColorDescription}`;
        } else if (c.colorType === 'CMYK') {
          return 'CMYK (Full Color)';
        } else {
          return `${c.colorType} Color${c.colorType !== '1' ? 's' : ''}`;
        }
      }).join(', ')}\n`;
    }
    
    if (item.pantoneColors?.length > 0) {
      const pantones = item.pantoneColors.filter((p: any) => p.color).map((p: any) => p.color);
      if (pantones.length > 0) {
        description += `**Pantone Colors:** ${pantones.join(', ')}\n`;
      }
    }
    
    if (item.printedSides?.length > 0) {
      description += `**Printed Sides Options:** ${item.printedSides.map((s: any) => 
        `${s.sides} side${s.sides === '2' ? 's' : ''}`
      ).join(', ')}\n`;
    }
    
    if (fileUrls.length > 0) {
      description += `\n**Art Files:**\n`;
      fileUrls.forEach((url, index) => {
        description += `[Art File ${index + 1}](${url})\n`;
      });
    }
    
    description += `\n---\n`;
    description += `Quote ID: ${quoteData.id}\n`;
    description += `Item: ${itemIndex + 1} of ${quoteData.items.length}`;

    // Create the card from template with item-specific title
    const cardResponse = await fetch(
      `https://api.trello.com/1/cards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${quoteData.customer?.name || 'Unknown'} - ${item.productService || 'Unnamed Product'} - ${new Date().toLocaleDateString()}`,
          desc: description,
          idList: TRELLO_LIST_ID || '686da0500c7d8daf1c8f8b47',
          pos: 'top',
          idCardSource: TEMPLATE_CARD_ID, // Copy from template card
          keepFromSource: 'all', // Keep all elements from template (custom fields, checklists, etc.)
          cover: {
            color: coverColor // Set the cover color
          }
        }),
      }
    );

    if (!cardResponse.ok) {
      throw new Error(`Trello API error: ${cardResponse.status}`);
    }

    const card = await cardResponse.json();

    // Add "Linked" label if provided (for multi-item quotes)
    if (linkedLabelId) {
      try {
        await fetch(
          `https://api.trello.com/1/cards/${card.id}/idLabels?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value: linkedLabelId,
            }),
          }
        );
      } catch (error) {
        console.error('Error adding linked label:', error);
      }
    }

    // Add attachments to the card
    for (const url of fileUrls) {
      try {
        await fetch(
          `https://api.trello.com/1/cards/${card.id}/attachments?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: url,
              name: `Art File - ${new Date().toLocaleDateString()}`
            }),
          }
        );
      } catch (error) {
        console.error('Error adding attachment to Trello:', error);
      }
    }

    return card;
  } catch (error) {
    console.error('Error creating Trello card:', error);
    throw error;
  }
}

// Add checklist with links to other cards
async function addLinkedCardsChecklist(card: any, allCards: any[]) {
  try {
    // Create a checklist called "Linked Cards"
    const checklistResponse = await fetch(
      `https://api.trello.com/1/checklists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idCard: card.id,
          name: 'Linked Cards',
          pos: 'bottom'
        }),
      }
    );

    if (checklistResponse.ok) {
      const checklist = await checklistResponse.json();
      
      // Add each other card as a checklist item
      for (const otherCard of allCards) {
        if (otherCard.id !== card.id) {
          await fetch(
            `https://api.trello.com/1/checklists/${checklist.id}/checkItems?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: `${otherCard.name} - ${otherCard.url}`,
                checked: false,
                pos: 'bottom'
              }),
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error adding linked cards checklist:', error);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    // Parse quote data from fields
    const quoteData = JSON.parse(fields.quoteData?.[0] || '{}');
    quoteData.id = Date.now().toString();
    quoteData.submittedAt = new Date().toISOString();
    quoteData.status = 'pending';

    // Upload files to Supabase
    const uploadedUrls: string[] = [];
    
    if (files.artFiles) {
      const fileArray = Array.isArray(files.artFiles) ? files.artFiles : [files.artFiles];
      
      for (const file of fileArray) {
        if (file) {
          const url = await uploadToSupabase(file, quoteData.id);
          if (url) {
            uploadedUrls.push(url);
          }
        }
      }
    }

    // Add uploaded URLs to quote data
    if (uploadedUrls.length > 0 && quoteData.items) {
      // Distribute files across items or add to first item
      quoteData.items[0].uploadedArtFiles = uploadedUrls;
    }

    // Save to database
    await saveQuoteToDatabase(quoteData);

    // Determine if this is a multi-item quote (bundle)
    const isBundle = quoteData.items.length > 1;
    let linkedLabelId = null;
    let coverColor = COVER_COLORS[Math.floor(Math.random() * COVER_COLORS.length)]; // Random color for bundle

    // Get or create "Linked" label if this is a bundle
    if (isBundle) {
      const linkedLabel = await getLinkedLabel();
      linkedLabelId = linkedLabel?.id;
    }

    // Create individual Trello cards for each item
    const trelloCards = [];
    for (let i = 0; i < quoteData.items.length; i++) {
      const item = quoteData.items[i];
      // Get art files for this specific item if they exist
      const itemFileUrls = item.uploadedArtFiles || [];
      
      try {
        const card = await createTrelloCardForItem(
          item, 
          quoteData, 
          i, 
          itemFileUrls.length > 0 ? itemFileUrls : uploadedUrls,
          isBundle ? coverColor : null, // Only set cover color for bundles
          isBundle ? linkedLabelId : null // Only add linked label for bundles
        );
        trelloCards.push(card);
        console.log(`Trello card created for item ${i + 1}:`, card.id);
      } catch (error) {
        console.error(`Failed to create Trello card for item ${i + 1}:`, error);
      }
    }

    // If bundle, add checklists with links to other cards
    if (isBundle && trelloCards.length > 1) {
      for (const card of trelloCards) {
        await addLinkedCardsChecklist(card, trelloCards);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Quote request submitted successfully',
      quoteId: quoteData.id,
      trelloCardsCreated: trelloCards.length,
      trelloCardIds: trelloCards.map(c => c.id),
      trelloCardUrls: trelloCards.map(c => c.url),
      uploadedFiles: uploadedUrls.length,
      isBundle: isBundle,
      bundleColor: isBundle ? coverColor : null
    });

  } catch (error) {
    console.error('Error processing quote submission:', error);
    res.status(500).json({ 
      error: 'Failed to process quote request',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}