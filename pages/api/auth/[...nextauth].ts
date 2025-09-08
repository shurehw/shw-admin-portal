import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import axios from 'axios';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;
const CLIENT_ID = process.env.BIGCOMMERCE_CLIENT_ID;
const CLIENT_SECRET = process.env.BIGCOMMERCE_CLIENT_SECRET;
const BUNDLE_B2B_TOKEN = process.env.BIGCOMMERCE_B2B_TOKEN;
const STOREFRONT_API_URL = process.env.NEXT_PUBLIC_BIGCOMMERCE_STOREFRONT_API_URL || `https://store-${STORE_HASH}-1572493.mybigcommerce.com/graphql`;
const STOREFRONT_API_TOKEN = process.env.NEXT_PUBLIC_BIGCOMMERCE_STOREFRONT_API_TOKEN;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        console.log('[AUTH] Login attempt for:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        try {
          console.log('[AUTH] Login attempt for:', credentials.email);
          
          // Admin/Staff accounts
          const adminAccounts = [
            { email: "admin@shurehw.com", password: "admin123", name: "Admin User", role: "admin" },
            { email: "sales@shurehw.com", password: "sales123", name: "Sales Rep", role: "sales_rep" },
            { email: "cs@shurehw.com", password: "cs123", name: "Customer Service", role: "customer_service" },
            { email: "production@shurehw.com", password: "prod123", name: "Production Team", role: "production" },
            { email: "art@shurehw.com", password: "art123", name: "Art Department", role: "art_team" }
          ];
          
          const adminAccount = adminAccounts.find(
            acc => acc.email === credentials.email && acc.password === credentials.password
          );
          
          if (adminAccount) {
            console.log('[AUTH] Admin/Staff user logged in:', adminAccount.email);
            return {
              id: `admin-${adminAccount.email}`,
              email: adminAccount.email,
              name: adminAccount.name,
              role: adminAccount.role,
              isAdmin: true,
              companyName: "Shure Hospitality Wholesale"
            };
          }
          
          // Test user for debugging (check this first) - bypasses 2FA
          if (credentials.email === "test@example.com" && credentials.password === "password123") {
            console.log('[AUTH] Test user logged in - bypassing 2FA');
            return {
              id: "test-123",
              email: "test@example.com",
              name: "Test User",
              companyName: "Test Company",
              bypass2FA: true  // Flag to bypass 2FA for test accounts
            };
          }
          
          // Step 1: Try Bundle B2B authentication first (for B2B customers)
          if (BUNDLE_B2B_TOKEN) {
            try {
              console.log('[AUTH] Attempting Bundle B2B authentication...');
              const bundleResponse = await axios.post(
                'https://api.bundleb2b.net/api/v3/io/auth/login',
                {
                  email: credentials.email,
                  password: credentials.password
                },
                {
                  headers: {
                    'Authorization': `Bearer ${BUNDLE_B2B_TOKEN}`,
                    'Content-Type': 'application/json'
                  },
                  timeout: 10000
                }
              );

            if (bundleResponse.data && (bundleResponse.data.success || bundleResponse.data.token)) {
              console.log('[AUTH] Bundle B2B authentication successful');
              const userData = bundleResponse.data.user || bundleResponse.data.data || bundleResponse.data;
              
              // Get the customer ID from Bundle B2B response
              const customerId = userData.customer_id || userData.id;
              
              if (customerId) {
                // Step 2: Generate Customer Login JWT using BigCommerce API
                try {
                  console.log('[AUTH] Generating Customer Login JWT for customer:', customerId);
                  const jwtResponse = await axios.put(
                    `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers/customer-login-jwt/${customerId}`,
                    {
                      channel_id: 1, // Default channel, adjust if needed
                      expires_at: Math.floor(Date.now() / 1000) + 30 // 30 seconds from now
                    },
                    {
                      headers: {
                        'X-Auth-Token': ACCESS_TOKEN,
                        'Content-Type': 'application/json'
                      }
                    }
                  );

                  const customerLoginJwt = jwtResponse.data?.data?.customer_login_jwt;
                  
                  if (customerLoginJwt) {
                    // Step 3: Use the JWT to get customer details via GraphQL
                    const graphqlResponse = await axios.post(
                      STOREFRONT_API_URL,
                      {
                        query: `
                          mutation LoginWithJWT($jwt: String!) {
                            customer {
                              loginWithCustomerLoginJwt(jwt: $jwt) {
                                customer {
                                  entityId
                                  firstName
                                  lastName
                                  email
                                }
                              }
                            }
                          }
                        `,
                        variables: {
                          jwt: customerLoginJwt
                        }
                      },
                      {
                        headers: {
                          'Authorization': `Bearer ${STOREFRONT_API_TOKEN}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );

                    const customer = graphqlResponse.data?.data?.customer?.loginWithCustomerLoginJwt?.customer;
                    
                    if (customer) {
                      return {
                        id: String(customer.entityId),
                        email: customer.email,
                        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'User',
                        accessToken: bundleResponse.data.token || customerLoginJwt
                      };
                    }
                  }
                } catch (jwtError: any) {
                  console.log('[AUTH] JWT generation error:', jwtError.response?.data || jwtError.message);
                }
              }
              
              // Fallback: Return Bundle B2B user data without BigCommerce JWT
              return {
                id: String(customerId || Math.random()),
                email: userData.email || credentials.email,
                name: userData.name || userData.first_name || 'User',
                accessToken: bundleResponse.data.token
              };
            }
            } catch (bundleError: any) {
              console.log('[AUTH] Bundle B2B error:', bundleError.response?.status, bundleError.response?.data || bundleError.message);
            }
          } else {
            console.log('[AUTH] Bundle B2B token not configured, skipping B2B authentication');
          }

          // Step 4: Try direct BigCommerce customer validation as fallback
          if (ACCESS_TOKEN && STORE_HASH) {
            try {
              console.log('[AUTH] Attempting BigCommerce customer validation...');
              
              // First, get customer by email
              const customerResponse = await axios.get(
                `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers?email:in=${credentials.email}`,
                {
                  headers: {
                    'X-Auth-Token': ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                  }
                }
              );

            const customers = customerResponse.data?.data;
            if (customers && customers.length > 0) {
              const customer = customers[0];
              
              // Generate Customer Login JWT
              const jwtResponse = await axios.put(
                `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers/customer-login-jwt/${customer.id}`,
                {
                  channel_id: 1,
                  expires_at: Math.floor(Date.now() / 1000) + 30
                },
                {
                  headers: {
                    'X-Auth-Token': ACCESS_TOKEN,
                    'Content-Type': 'application/json'
                  }
                }
              );

              const customerLoginJwt = jwtResponse.data?.data?.customer_login_jwt;
              
              if (customerLoginJwt) {
                return {
                  id: String(customer.id),
                  email: customer.email,
                  name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'User',
                  accessToken: customerLoginJwt
                };
              }
            }
            } catch (bcError: any) {
              console.log('[AUTH] BigCommerce validation error:', bcError.response?.data || bcError.message);
            }
          } else {
            console.log('[AUTH] BigCommerce ACCESS_TOKEN or STORE_HASH not configured');
          }

          console.log('[AUTH] No valid authentication found');
          return null;
          
        } catch (error: any) {
          console.error('[AUTH] Critical error:', error.message);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.isAdmin = user.isAdmin;
        token.companyName = user.companyName;
        token.bypass2FA = user.bypass2FA;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.accessToken = token.accessToken;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
        session.user.companyName = token.companyName;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60
  },
  secret: process.env.NEXTAUTH_SECRET || 'ZGExMGQxYjktZTgzOC00NWJhLWExYmQtYmFjYzRjYzk4ODEzMTQ0MDMwNjUzMQ==',
  debug: true
};

export default NextAuth(authOptions);