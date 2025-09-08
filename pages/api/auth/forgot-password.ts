import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const STORE_URL = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_URL || 'https://store-lsgscaxueg-1572493.mybigcommerce.com';
const STOREFRONT_API_TOKEN = process.env.NEXT_PUBLIC_BIGCOMMERCE_STOREFRONT_API_TOKEN || process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!STOREFRONT_API_TOKEN) {
    console.error('BigCommerce Storefront API token not configured');
    return res.status(500).json({ error: 'Password reset service is not configured' });
  }

  try {
    // Use BigCommerce's built-in password reset mutation
    // This will automatically send a branded email from BigCommerce
    const response = await axios.post(
      `${STORE_URL}/graphql`,
      {
        query: `
          mutation RequestPasswordReset($email: String!) {
            customer {
              requestResetPassword(
                input: { 
                  email: $email 
                }
              ) {
                errors {
                  ... on ValidationError {
                    message
                    path
                  }
                }
              }
            }
          }
        `,
        variables: {
          email: email
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${STOREFRONT_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Check for GraphQL errors
    if (response.data?.data?.customer?.requestResetPassword?.errors?.length > 0) {
      const errors = response.data.data.customer.requestResetPassword.errors;
      console.log('BigCommerce password reset errors:', errors);
      
      // Don't reveal specific errors to the user for security
      // Just return the generic success message
    }

    // Always return success message for security
    // This prevents email enumeration attacks
    return res.status(200).json({ 
      message: 'If an account exists with this email, a password reset link has been sent.',
      success: true
    });

  } catch (error: any) {
    console.error('Password reset error:', error.response?.data || error.message);
    
    // Don't reveal specific errors to the user for security
    return res.status(200).json({ 
      message: 'If an account exists with this email, a password reset link has been sent.',
      success: true
    });
  }
}