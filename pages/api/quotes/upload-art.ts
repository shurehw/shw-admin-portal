import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'art');
    await fs.mkdir(uploadDir, { recursive: true });

    // Parse form data
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB max file size
      filter: function ({ mimetype }) {
        // Allow images and design files
        const valid = mimetype && (
          mimetype.includes('image') ||
          mimetype.includes('pdf') ||
          mimetype.includes('postscript') ||
          mimetype.includes('photoshop')
        );
        return Boolean(valid);
      },
    });

    const [fields, files] = await form.parse(req);
    
    // Process uploaded files
    const uploadedFiles = [];
    const fileArray = Array.isArray(files.art) ? files.art : [files.art];
    
    for (const file of fileArray) {
      if (file) {
        const fileName = file.originalFilename || 'unnamed';
        const fileUrl = `/uploads/art/${path.basename(file.filepath)}`;
        
        uploadedFiles.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          fileName,
          fileUrl,
          size: file.size,
          type: file.mimetype
        });
      }
    }

    res.status(200).json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
}