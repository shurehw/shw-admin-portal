import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getSession } from 'next-auth/react';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getSession({ req });
  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const customerId = session.user.bigcommerceId;
  const baseUrl = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/customers/addresses`;

  try {
    switch (req.method) {
      case 'GET':
        // Get customer addresses
        const getResponse = await axios.get(
          `${baseUrl}?customer_id:in=${customerId}`,
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Accept': 'application/json'
            }
          }
        );
        return res.status(200).json(getResponse.data);

      case 'POST':
        // Create new address
        const createResponse = await axios.post(
          baseUrl,
          [{
            customer_id: customerId,
            address1: req.body.address1,
            address2: req.body.address2,
            city: req.body.city,
            state_or_province: req.body.state,
            postal_code: req.body.postalCode,
            country_code: req.body.countryCode || 'US',
            first_name: req.body.firstName,
            last_name: req.body.lastName,
            phone: req.body.phone,
            address_type: req.body.addressType || 'residential',
            company: req.body.company
          }],
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        return res.status(201).json(createResponse.data);

      case 'PUT':
        // Update address
        const { id, ...updateData } = req.body;
        const updateResponse = await axios.put(
          baseUrl,
          [{
            id,
            customer_id: customerId,
            ...updateData
          }],
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN,
              'Content-Type': 'application/json'
            }
          }
        );
        return res.status(200).json(updateResponse.data);

      case 'DELETE':
        // Delete address
        const { addressId } = req.query;
        await axios.delete(
          `${baseUrl}?id:in=${addressId}`,
          {
            headers: {
              'X-Auth-Token': ACCESS_TOKEN
            }
          }
        );
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Address error:', error);
    return res.status(500).json({ error: 'Address operation failed' });
  }
}