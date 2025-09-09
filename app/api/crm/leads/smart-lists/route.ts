import { NextRequest, NextResponse } from 'next/server';

// Mock smart lists data
const mockSmartLists = [
  {
    id: '1',
    name: 'Hot Leads',
    description: 'Score > 80',
    count: 15,
    median_score: 85,
    icon: '🔥',
    color: 'red'
  },
  {
    id: '2',
    name: 'High Winability',
    description: 'Winability > 75%',
    count: 22,
    median_score: 72,
    icon: '🎯',
    color: 'blue'
  },
  {
    id: '3',
    name: 'New Openings',
    description: 'Pre-opening & new permits',
    count: 8,
    median_score: 78,
    icon: '🚀',
    color: 'purple'
  },
  {
    id: '4',
    name: 'Expansion Signals',
    description: 'Growing businesses',
    count: 12,
    median_score: 74,
    icon: '📈',
    color: 'green'
  }
];

export async function GET(request: NextRequest) {
  return NextResponse.json({ lists: mockSmartLists });
}