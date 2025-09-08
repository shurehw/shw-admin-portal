// ========================
// FILE: pages/api/nav.ts (Next.js Pages Router)
// Fetch BigCommerce category tree for headless channel
// Uses /v3/catalog/trees API for proper channel-specific categories
// ========================

import { NextApiRequest, NextApiResponse } from 'next';

const STORE_HASH = process.env.NEXT_PUBLIC_BIGCOMMERCE_STORE_HASH || 'lsgscaxueg';
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN || 'sfo47kc8jzqe2rlizafi7kvlvv34o0t';
const CHANNEL_ID = 1572493; // Headless Shure Hospitality channel

function bcApiUrl(path: string) {
  return `https://api.bigcommerce.com/stores/${STORE_HASH}${path}`;
}

export type BCNavNode = {
  id: number;
  name: string;
  url?: string | null;
  product_count?: number;
  children?: BCNavNode[];
};

export type NavItem = { 
  id: number; 
  name: string; 
  href: string; 
  parent_id?: number;
  subcategories?: NavItem[];
};

async function bcFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(bcApiUrl(path), {
    headers: {
      "X-Auth-Token": ACCESS_TOKEN,
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[BC ${res.status}] ${text}`);
  }
  
  return res.json() as Promise<T>;
}

// Get the category tree ID for the headless channel
async function getHeadlessTreeId(): Promise<number> {
  // Tree ID 2 is assigned to the "headless shure hospitality channel"
  // We could fetch this dynamically, but hardcoding avoids an extra API call
  return 2;
}

// Get category nodes from the tree
async function getHeadlessNodes(depth = 3): Promise<BCNavNode[]> {
  const treeId = await getHeadlessTreeId();
  const res = await bcFetch<{ data: BCNavNode[] }>(
    `/v3/catalog/trees/${treeId}/categories?depth=${depth}`
  );
  return res.data || [];
}

// Convert tree nodes to nav items with full hierarchy
function nodesToNavItems(nodes: BCNavNode[], parentId?: number): NavItem[] {
  return nodes.map(node => ({
    id: node.id,
    name: node.name,
    parent_id: parentId,
    href: node.url || `/catalog?category=${encodeURIComponent(node.name.toLowerCase())}`,
    subcategories: node.children && node.children.length > 0
      ? nodesToNavItems(node.children, node.id)
      : undefined
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const nodes = await getHeadlessNodes(3);
    const nav = nodesToNavItems(nodes);
    
    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ categories: nav });
  } catch (error: any) {
    console.error('Error fetching category tree:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch categories', 
      details: error?.message || 'Unknown error' 
    });
  }
}