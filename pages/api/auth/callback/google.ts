import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { db } from '@/lib/firebase-admin';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NODE_ENV === 'production' 
    ? 'https://admin-dashboard-96kp1w9up-jacob-shures-projects.vercel.app/api/auth/callback/google'
    : 'http://localhost:3000/api/auth/callback/google'
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, error } = req.query;

  if (error) {
    console.error('OAuth error:', error);
    return res.redirect('/crm/settings/email-integration?error=access_denied');
  }

  if (!code || typeof code !== 'string') {
    return res.redirect('/crm/settings/email-integration?error=no_code');
  }

  try {
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data: userInfo } = await oauth2.userinfo.get();

    // Store the account in Firestore
    const accountData = {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      provider: 'gmail',
      status: 'connected',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type,
      syncEnabled: true,
      trackingEnabled: true,
      calendarEnabled: true,
      calendarSyncEnabled: true,
      lastSync: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Check if account already exists
    const existingAccounts = await db
      .collection('emailAccounts')
      .where('email', '==', userInfo.email)
      .get();

    if (!existingAccounts.empty) {
      // Update existing account
      const docId = existingAccounts.docs[0].id;
      await db.collection('emailAccounts').doc(docId).update({
        ...accountData,
        updatedAt: new Date()
      });
    } else {
      // Create new account
      await db.collection('emailAccounts').add(accountData);
    }

    // Initialize sync for the account (in production, this would be a background job)
    // await initializeEmailSync(accountData);

    // Redirect back to settings with success
    return res.redirect('/crm/settings/email-integration?success=true');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return res.redirect('/crm/settings/email-integration?error=oauth_failed');
  }
}

// Helper function to refresh access token when needed
export async function refreshAccessToken(refreshToken: string) {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}