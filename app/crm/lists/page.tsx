'use client';

import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Plus, Download, Upload, Save, 
  Building2, MapPin, DollarSign, TrendingUp, Target,
  Globe, Briefcase, Calendar, Hash, Mail, Phone,
  Wine, Coffee, Pizza, Music, Utensils, Beer,
  CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Eye, EyeOff, Copy, Trash2, Edit2, Share2,
  BarChart3, PieChart, Activity, Zap, Database,
  Link2, FileText, Settings, ChevronRight, Info,
  Star, Tag, MessageSquare, UserCheck, UserX,
  ArrowUp, ArrowDown, ChevronsUpDown, Loader2,
  Sparkles, Brain, Cpu, Layers, Shield, Award, X
} from 'lucide-react';

interface VenueList {
  id: string;
  name: string;
  description: string;
  type: 'static' | 'dynamic' | 'rar-synced';
  filters: ListFilter[];
  venues: Venue[];
  stats: {
    totalVenues: number;
    activeCustomers: number;
    qualifiedLeads: number;
    averageScore: number;
    lastUpdated: any;
    totalRevenuePotential?: number;
  };
  tags: string[];
  owner: string;
  sharedWith: string[];
  status: 'building' | 'ready' | 'syncing' | 'exporting';
  createdAt: any;
  updatedAt: any;
}

interface ListFilter {
  id: string;
  field: string;
  operator: string;
  value: any;
  type: 'include' | 'exclude';
}

interface Venue {
  id: string;
  // Basic Info
  name: string;
  type: 'bar' | 'restaurant' | 'nightclub' | 'lounge' | 'brewery' | 'winery' | 'cafe' | 'sports_bar' | 'hotel_bar' | 'cocktail_bar' | 'pub' | 'food_truck';
  concept: string;
  
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  neighborhood: string;
  location: {
    lat: number;
    lng: number;
  };
  
  // Business Details
  capacity: number;
  squareFootage: number;
  yearEstablished: number;
  ownershipType: 'independent' | 'chain' | 'franchise' | 'hotel';
  
  // Licensing
  liquorLicenseType: 'full' | 'beer_wine' | 'beer_only' | 'byob' | 'none';
  liquorLicenseStatus: 'active' | 'pending' | 'expired' | 'suspended';
  liquorLicenseExpiry: string;
  
  // Financial
  annualRevenue: string;
  alcoholSalesPercentage: number;
  avgCheckSize: number;
  
  // Operations
  cuisineType?: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  serviceStyle: 'full_service' | 'quick_service' | 'fast_casual' | 'counter_service';
  hoursOfOperation: any;
  peakHours: string[];
  
  // Decision Makers
  owner: string;
  generalManager: string;
  beverageManager: string;
  contactEmail: string;
  contactPhone: string;
  
  // Purchasing
  primaryDistributor: string;
  orderFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  avgOrderValue: number;
  preferredBrands: string[];
  
  // Scoring
  opportunityScore: number;
  fitScore: number;
  volumePotential: number;
  creditScore?: number;
  
  // Activity
  lastContact: string;
  lastOrder: string;
  accountStatus: 'prospect' | 'lead' | 'opportunity' | 'customer' | 'inactive';
  
  // RAR Data
  rarId?: string;
  rarActivityType?: string;
  rarLastSync?: string;
  
  // Metadata
  tags: string[];
  notes: string;
  createdAt: any;
  updatedAt: any;
}

interface FilterTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  filters: ListFilter[];
  category: string;
}

export default function HospitalityListBuilderPage() {
  const [lists, setLists] = useState<VenueList[]>([]);
  const [selectedList, setSelectedList] = useState<VenueList | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  
  // List builder state
  const [listBuilderData, setListBuilderData] = useState({
    name: '',
    description: '',
    type: 'dynamic' as VenueList['type'],
    filters: [] as ListFilter[]
  });

  // Filter state
  const [activeFilters, setActiveFilters] = useState<ListFilter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filterTemplates: FilterTemplate[] = [
    {
      id: '1',
      name: 'High-Volume Bars',
      description: 'Bars with 200+ capacity and full liquor license',
      icon: Wine,
      category: 'Volume',
      filters: [
        { id: '1', field: 'type', operator: 'in', value: ['bar', 'nightclub', 'sports_bar'], type: 'include' },
        { id: '2', field: 'capacity', operator: 'greater_than', value: 200, type: 'include' },
        { id: '3', field: 'liquorLicenseType', operator: 'equals', value: 'full', type: 'include' }
      ]
    },
    {
      id: '2',
      name: 'Premium Restaurants',
      description: 'Fine dining with high check averages',
      icon: Utensils,
      category: 'Premium',
      filters: [
        { id: '1', field: 'type', operator: 'equals', value: 'restaurant', type: 'include' },
        { id: '2', field: 'priceRange', operator: 'in', value: ['$$$', '$$$$'], type: 'include' },
        { id: '3', field: 'serviceStyle', operator: 'equals', value: 'full_service', type: 'include' }
      ]
    },
    {
      id: '3',
      name: 'Craft Beer Focus',
      description: 'Breweries and craft beer bars',
      icon: Beer,
      category: 'Specialty',
      filters: [
        { id: '1', field: 'type', operator: 'in', value: ['brewery', 'pub', 'bar'], type: 'include' },
        { id: '2', field: 'preferredBrands', operator: 'contains', value: 'craft', type: 'include' }
      ]
    },
    {
      id: '4',
      name: 'Cocktail Programs',
      description: 'Venues with cocktail focus',
      icon: Wine,
      category: 'Specialty',
      filters: [
        { id: '1', field: 'type', operator: 'in', value: ['cocktail_bar', 'lounge', 'restaurant'], type: 'include' },
        { id: '2', field: 'alcoholSalesPercentage', operator: 'greater_than', value: 40, type: 'include' }
      ]
    },
    {
      id: '5',
      name: 'Quick Service',
      description: 'Fast casual and QSR locations',
      icon: Coffee,
      category: 'Service',
      filters: [
        { id: '1', field: 'serviceStyle', operator: 'in', value: ['quick_service', 'fast_casual', 'counter_service'], type: 'include' },
        { id: '2', field: 'orderFrequency', operator: 'in', value: ['weekly', 'bi-weekly'], type: 'include' }
      ]
    },
    {
      id: '6',
      name: 'New Prospects',
      description: 'Recently opened venues',
      icon: Target,
      category: 'Opportunity',
      filters: [
        { id: '1', field: 'yearEstablished', operator: 'greater_than', value: 2022, type: 'include' },
        { id: '2', field: 'accountStatus', operator: 'equals', value: 'prospect', type: 'include' }
      ]
    }
  ];

  const fieldOptions = [
    // Venue fields
    { group: 'Venue Type', fields: [
      { value: 'type', label: 'Venue Type', type: 'select' },
      { value: 'concept', label: 'Concept', type: 'text' },
      { value: 'cuisineType', label: 'Cuisine Type', type: 'text' },
      { value: 'serviceStyle', label: 'Service Style', type: 'select' },
      { value: 'priceRange', label: 'Price Range', type: 'select' },
      { value: 'ownershipType', label: 'Ownership Type', type: 'select' }
    ]},
    // Location fields
    { group: 'Location', fields: [
      { value: 'city', label: 'City', type: 'text' },
      { value: 'state', label: 'State', type: 'text' },
      { value: 'neighborhood', label: 'Neighborhood', type: 'text' },
      { value: 'zipCode', label: 'Zip Code', type: 'text' }
    ]},
    // Business metrics
    { group: 'Business Metrics', fields: [
      { value: 'capacity', label: 'Capacity', type: 'number' },
      { value: 'squareFootage', label: 'Square Footage', type: 'number' },
      { value: 'annualRevenue', label: 'Annual Revenue', type: 'text' },
      { value: 'alcoholSalesPercentage', label: 'Alcohol Sales %', type: 'number' },
      { value: 'avgCheckSize', label: 'Avg Check Size', type: 'number' },
      { value: 'avgOrderValue', label: 'Avg Order Value', type: 'number' }
    ]},
    // Licensing
    { group: 'Licensing', fields: [
      { value: 'liquorLicenseType', label: 'License Type', type: 'select' },
      { value: 'liquorLicenseStatus', label: 'License Status', type: 'select' }
    ]},
    // Scoring
    { group: 'Scoring', fields: [
      { value: 'opportunityScore', label: 'Opportunity Score', type: 'number' },
      { value: 'fitScore', label: 'Fit Score', type: 'number' },
      { value: 'volumePotential', label: 'Volume Potential', type: 'number' }
    ]}
  ];

  useEffect(() => {
    loadLists();
    generateSampleVenues();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      const sampleList = createSampleList();
      setLists([sampleList]);
      setSelectedList(sampleList);
    } catch (error) {
      console.error('Error loading lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSampleList = () => {
    const sampleList: VenueList = {
      id: '1',
      name: 'Q1 2024 Bar & Restaurant Targets',
      description: 'High-volume bars and restaurants in major markets',
      type: 'dynamic',
      filters: [
        { id: '1', field: 'type', operator: 'in', value: ['bar', 'restaurant', 'nightclub'], type: 'include' },
        { id: '2', field: 'capacity', operator: 'greater_than', value: 100, type: 'include' }
      ],
      venues: [],
      stats: {
        totalVenues: 0,
        activeCustomers: 0,
        qualifiedLeads: 0,
        averageScore: 0,
        lastUpdated: new Date(),
        totalRevenuePotential: 0
      },
      tags: ['q1-2024', 'high-volume', 'priority'],
      owner: 'Current User',
      sharedWith: [],
      status: 'building',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return sampleList;
  };

  const generateSampleVenues = () => {
    const sampleVenues: Venue[] = [
      {
        id: '1',
        name: "O'Malley's Sports Bar",
        type: 'sports_bar',
        concept: 'Irish Sports Pub',
        address: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        neighborhood: 'Downtown',
        location: { lat: 42.3601, lng: -71.0589 },
        capacity: 250,
        squareFootage: 4500,
        yearEstablished: 2018,
        ownershipType: 'independent',
        liquorLicenseType: 'full',
        liquorLicenseStatus: 'active',
        liquorLicenseExpiry: '2025-12-31',
        annualRevenue: '$2.5M-$5M',
        alcoholSalesPercentage: 65,
        avgCheckSize: 35,
        cuisineType: 'American Pub',
        priceRange: '$$',
        serviceStyle: 'full_service',
        hoursOfOperation: { mon: '11am-2am', tue: '11am-2am' },
        peakHours: ['6pm-9pm', '10pm-12am'],
        owner: 'Patrick O\'Malley',
        generalManager: 'Sean Murphy',
        beverageManager: 'Mary Kelly',
        contactEmail: 'manager@omalleys.com',
        contactPhone: '(617) 555-0123',
        primaryDistributor: 'Boston Beverage Co',
        orderFrequency: 'weekly',
        avgOrderValue: 8500,
        preferredBrands: ['Guinness', 'Jameson', 'Bud Light'],
        opportunityScore: 85,
        fitScore: 90,
        volumePotential: 88,
        lastContact: '2024-03-15',
        lastOrder: '2024-03-10',
        accountStatus: 'customer',
        tags: ['sports', 'high-volume', 'weekly-orders'],
        notes: 'Great relationship, looking to expand craft beer selection',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'The Velvet Room',
        type: 'cocktail_bar',
        concept: 'Upscale Cocktail Lounge',
        address: '456 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zipCode: '33139',
        neighborhood: 'South Beach',
        location: { lat: 25.7617, lng: -80.1918 },
        capacity: 150,
        squareFootage: 3000,
        yearEstablished: 2022,
        ownershipType: 'independent',
        liquorLicenseType: 'full',
        liquorLicenseStatus: 'active',
        liquorLicenseExpiry: '2025-06-30',
        annualRevenue: '$1M-$2.5M',
        alcoholSalesPercentage: 80,
        avgCheckSize: 65,
        priceRange: '$$$',
        serviceStyle: 'full_service',
        hoursOfOperation: { mon: '5pm-2am', tue: '5pm-2am' },
        peakHours: ['8pm-11pm', '11pm-1am'],
        owner: 'Sofia Martinez',
        generalManager: 'Carlos Rodriguez',
        beverageManager: 'Isabella Garcia',
        contactEmail: 'info@velvetroom.com',
        contactPhone: '(305) 555-0456',
        primaryDistributor: 'Southern Wine & Spirits',
        orderFrequency: 'bi-weekly',
        avgOrderValue: 6000,
        preferredBrands: ['Grey Goose', 'Hendricks', 'Dom Perignon'],
        opportunityScore: 92,
        fitScore: 88,
        volumePotential: 75,
        lastContact: '2024-03-20',
        lastOrder: null,
        accountStatus: 'opportunity',
        tags: ['cocktails', 'premium', 'new-venue'],
        notes: 'New upscale venue, interested in premium spirits program',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        name: 'Bella Vista Italian Kitchen',
        type: 'restaurant',
        concept: 'Traditional Italian Restaurant',
        address: '789 Broadway',
        city: 'New York',
        state: 'NY',
        zipCode: '10003',
        neighborhood: 'Greenwich Village',
        location: { lat: 40.7128, lng: -74.0060 },
        capacity: 180,
        squareFootage: 5000,
        yearEstablished: 2015,
        ownershipType: 'chain',
        liquorLicenseType: 'beer_wine',
        liquorLicenseStatus: 'active',
        liquorLicenseExpiry: '2024-12-31',
        annualRevenue: '$5M-$10M',
        alcoholSalesPercentage: 35,
        avgCheckSize: 55,
        cuisineType: 'Italian',
        priceRange: '$$$',
        serviceStyle: 'full_service',
        hoursOfOperation: { mon: '11:30am-10pm', tue: '11:30am-10pm' },
        peakHours: ['12pm-2pm', '6pm-9pm'],
        owner: 'Giovanni Russo',
        generalManager: 'Marco Bianchi',
        beverageManager: 'Lucia Romano',
        contactEmail: 'manager@bellavista.com',
        contactPhone: '(212) 555-0789',
        primaryDistributor: 'Empire Merchants',
        orderFrequency: 'weekly',
        avgOrderValue: 4500,
        preferredBrands: ['Peroni', 'Chianti', 'Pinot Grigio'],
        opportunityScore: 78,
        fitScore: 82,
        volumePotential: 70,
        lastContact: '2024-03-18',
        lastOrder: '2024-03-17',
        accountStatus: 'customer',
        tags: ['italian', 'wine-focus', 'chain'],
        notes: 'Part of 5-location chain, centralized purchasing',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        name: 'Craft & Draft Brewhouse',
        type: 'brewery',
        concept: 'Craft Brewery & Restaurant',
        address: '321 Pearl St',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
        neighborhood: 'Pearl District',
        location: { lat: 45.5152, lng: -122.6784 },
        capacity: 200,
        squareFootage: 6000,
        yearEstablished: 2020,
        ownershipType: 'independent',
        liquorLicenseType: 'brewery',
        liquorLicenseStatus: 'active',
        liquorLicenseExpiry: '2025-08-31',
        annualRevenue: '$2.5M-$5M',
        alcoholSalesPercentage: 70,
        avgCheckSize: 40,
        cuisineType: 'Gastropub',
        priceRange: '$$',
        serviceStyle: 'full_service',
        hoursOfOperation: { mon: '11am-11pm', tue: '11am-11pm' },
        peakHours: ['5pm-7pm', '7pm-9pm'],
        owner: 'Jake Thompson',
        generalManager: 'Sarah Chen',
        beverageManager: 'Mike Wilson',
        contactEmail: 'info@craftdraft.com',
        contactPhone: '(503) 555-0321',
        primaryDistributor: 'Columbia Distributing',
        orderFrequency: 'weekly',
        avgOrderValue: 5500,
        preferredBrands: ['Local craft', 'Imported specialty'],
        opportunityScore: 88,
        fitScore: 85,
        volumePotential: 82,
        lastContact: '2024-03-19',
        lastOrder: '2024-03-12',
        accountStatus: 'customer',
        tags: ['brewery', 'craft-beer', 'gastropub'],
        notes: 'Produces own beer, needs spirits and wine',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        name: 'Midnight Lounge',
        type: 'nightclub',
        concept: 'Premium Nightclub',
        address: '555 Sunset Blvd',
        city: 'Las Vegas',
        state: 'NV',
        zipCode: '89109',
        neighborhood: 'The Strip',
        location: { lat: 36.1699, lng: -115.1398 },
        capacity: 500,
        squareFootage: 10000,
        yearEstablished: 2019,
        ownershipType: 'independent',
        liquorLicenseType: 'full',
        liquorLicenseStatus: 'active',
        liquorLicenseExpiry: '2025-03-31',
        annualRevenue: '$10M+',
        alcoholSalesPercentage: 90,
        avgCheckSize: 150,
        priceRange: '$$$$',
        serviceStyle: 'full_service',
        hoursOfOperation: { mon: '10pm-4am', tue: '10pm-4am' },
        peakHours: ['11pm-2am'],
        owner: 'Alex Kumar',
        generalManager: 'Jessica Lee',
        beverageManager: 'David Park',
        contactEmail: 'vip@midnightlv.com',
        contactPhone: '(702) 555-0999',
        primaryDistributor: 'Young\'s Market Company',
        orderFrequency: 'weekly',
        avgOrderValue: 25000,
        preferredBrands: ['Dom Perignon', 'Cristal', 'Clase Azul'],
        opportunityScore: 95,
        fitScore: 92,
        volumePotential: 98,
        lastContact: '2024-03-21',
        lastOrder: '2024-03-20',
        accountStatus: 'customer',
        tags: ['nightclub', 'vip', 'high-volume', 'premium'],
        notes: 'VIP bottle service focus, highest volume account',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setVenues(sampleVenues);
  };

  const handleCreateList = async () => {
    try {
      const newList: Partial<VenueList> = {
        ...listBuilderData,
        venues: [],
        stats: {
          totalVenues: 0,
          activeCustomers: 0,
          qualifiedLeads: 0,
          averageScore: 0,
          lastUpdated: new Date()
        },
        tags: [],
        owner: 'Current User',
        sharedWith: [],
        status: 'building',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = { id: Date.now().toString() };
      const createdList = { ...newList, id: docRef.id } as VenueList;
      
      setLists([...lists, createdList]);
      setSelectedList(createdList);
      setShowCreateModal(false);
      
      buildList(createdList);
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const buildList = async (list: VenueList) => {
    setLoading(true);
    
    let filteredVenues = [...venues];
    
    list.filters.forEach(filter => {
      filteredVenues = applyFilter(filteredVenues, filter);
    });

    const updatedList = {
      ...list,
      venues: filteredVenues,
      stats: {
        ...list.stats,
        totalVenues: filteredVenues.length,
        activeCustomers: filteredVenues.filter(v => v.accountStatus === 'customer').length,
        qualifiedLeads: filteredVenues.filter(v => v.accountStatus === 'opportunity').length,
        averageScore: filteredVenues.reduce((sum, v) => sum + v.opportunityScore, 0) / filteredVenues.length || 0,
        lastUpdated: new Date(),
        totalRevenuePotential: filteredVenues.reduce((sum, v) => sum + v.avgOrderValue * 52, 0)
      },
      status: 'ready' as const
    };
    
    setLists(lists.map(l => l.id === list.id ? updatedList : l));
    setSelectedList(updatedList);
    setLoading(false);
  };

  const applyFilter = (venues: Venue[], filter: ListFilter): Venue[] => {
    return venues.filter(venue => {
      const fieldValue = getFieldValue(venue, filter.field);
      
      switch (filter.operator) {
        case 'equals':
          return fieldValue === filter.value;
        case 'not_equals':
          return fieldValue !== filter.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'not_contains':
          return !String(fieldValue).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'greater_than':
          return Number(fieldValue) > Number(filter.value);
        case 'less_than':
          return Number(fieldValue) < Number(filter.value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
        default:
          return true;
      }
    });
  };

  const getFieldValue = (obj: any, path: string): any => {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  };

  const handleRARSync = async () => {
    if (!selectedList) return;
    
    const updatedList = { ...selectedList, status: 'syncing' as const };
    setSelectedList(updatedList);
    
    for (let i = 0; i <= 100; i += 10) {
      setSyncProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    updatedList.status = 'ready';
    setSelectedList(updatedList);
    setSyncProgress(0);
    
    alert('RAR data synced successfully!');
  };

  const handleExportList = () => {
    if (!selectedList) return;
    
    const headers = ['Venue Name', 'Type', 'City', 'State', 'Owner', 'Phone', 'Email', 'Capacity', 'License Type', 'Score'];
    const rows = selectedList.venues.map(v => [
      v.name,
      v.type,
      v.city,
      v.state,
      v.owner,
      v.contactPhone,
      v.contactEmail,
      v.capacity,
      v.liquorLicenseType,
      v.opportunityScore
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedList.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getVenueIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      bar: Wine,
      sports_bar: Wine,
      cocktail_bar: Wine,
      restaurant: Utensils,
      nightclub: Music,
      brewery: Beer,
      cafe: Coffee,
      default: Building2
    };
    return icons[type] || icons.default;
  };

  if (loading && !selectedList) {
    return (
      
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      
    );
  }

  return (
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar - Lists */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Venue Lists</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search lists..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Lists */}
          <div className="flex-1 overflow-y-auto p-2">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedList(list)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  selectedList?.id === list.id
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{list.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{list.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Building2 className="h-3 w-3 mr-1" />
                      {list.stats.totalVenues} venues
                      <span className="mx-2">•</span>
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      {list.stats.activeCustomers} active
                    </div>
                  </div>
                  {list.type === 'rar-synced' && (
                    <Database className="h-4 w-4 text-purple-500" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Quick Templates */}
          <div className="p-4 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Templates</h3>
            <div className="space-y-1">
              {filterTemplates.slice(0, 3).map((template) => {
                const Icon = template.icon;
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setListBuilderData({
                        name: template.name,
                        description: template.description,
                        type: 'dynamic',
                        filters: template.filters
                      });
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded"
                  >
                    <Icon className="h-3 w-3 mr-2" />
                    {template.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {selectedList ? (
            <>
              {/* Header */}
              <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <h1 className="text-2xl font-bold text-gray-900">{selectedList.name}</h1>
                      {selectedList.type === 'rar-synced' && (
                        <span className="ml-3 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full flex items-center">
                          <Database className="h-3 w-3 mr-1" />
                          RAR Synced
                        </span>
                      )}
                      {selectedList.status === 'syncing' && (
                        <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Syncing...
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{selectedList.description}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleRARSync}
                      disabled={selectedList.status === 'syncing'}
                      className="flex items-center px-3 py-2 border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Sync RAR
                    </button>
                    <button
                      onClick={handleExportList}
                      className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </button>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Zap className="h-4 w-4 mr-2" />
                      Create Campaign
                    </button>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center space-x-6 mt-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-500">Total Venues</p>
                    <p className="text-xl font-semibold">{selectedList.stats.totalVenues}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Customers</p>
                    <p className="text-xl font-semibold text-green-600">
                      {selectedList.stats.activeCustomers}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenue Potential</p>
                    <p className="text-xl font-semibold text-blue-600">
                      ${(selectedList.stats.totalRevenuePotential || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Score</p>
                    <p className="text-xl font-semibold">{Math.round(selectedList.stats.averageScore)}</p>
                  </div>
                </div>

                {/* Sync Progress */}
                {syncProgress > 0 && syncProgress < 100 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Syncing with RAR database...</span>
                      <span>{syncProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Venues Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {venues.map((venue) => {
                      const Icon = getVenueIcon(venue.type);
                      return (
                        <tr key={venue.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                                <Icon className="h-5 w-5 text-gray-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{venue.name}</p>
                                <p className="text-xs text-gray-500">{venue.type} • {venue.concept}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-gray-900">{venue.city}, {venue.state}</p>
                              <p className="text-xs text-gray-500">{venue.neighborhood}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">{venue.capacity}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              venue.liquorLicenseType === 'full' ? 'bg-green-100 text-green-700' :
                              venue.liquorLicenseType === 'beer_wine' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {venue.liquorLicenseType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm text-gray-900">{venue.generalManager}</p>
                              <p className="text-xs text-gray-500">{venue.contactPhone}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      venue.opportunityScore >= 80 ? 'bg-green-500' :
                                      venue.opportunityScore >= 60 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${venue.opportunityScore}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{venue.opportunityScore}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              venue.accountStatus === 'customer' ? 'bg-green-100 text-green-700' :
                              venue.accountStatus === 'opportunity' ? 'bg-blue-100 text-blue-700' :
                              venue.accountStatus === 'lead' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {venue.accountStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button className="text-gray-600 hover:text-gray-900">
                                <Phone className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Mail className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <UserCheck className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No list selected</h3>
                <p className="text-gray-500 mt-1">Select a list from the sidebar or create a new one</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create New List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create List Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Create Venue List</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      List Name
                    </label>
                    <input
                      type="text"
                      value={listBuilderData.name}
                      onChange={(e) => setListBuilderData({ ...listBuilderData, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="e.g., Q1 2024 High-Volume Bars"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      List Type
                    </label>
                    <select
                      value={listBuilderData.type}
                      onChange={(e) => setListBuilderData({ ...listBuilderData, type: e.target.value as any })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="dynamic">Dynamic (Auto-update)</option>
                      <option value="static">Static (Fixed list)</option>
                      <option value="rar-synced">RAR Synced</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={listBuilderData.description}
                    onChange={(e) => setListBuilderData({ ...listBuilderData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={2}
                    placeholder="Describe the purpose of this list..."
                  />
                </div>

                {/* Quick Templates */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Start Templates</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {filterTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => {
                            setListBuilderData({
                              ...listBuilderData,
                              filters: template.filters
                            });
                          }}
                          className="p-3 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50"
                        >
                          <Icon className="h-5 w-5 text-gray-600 mb-2" />
                          <p className="text-sm font-medium text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{template.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateList}
                  disabled={!listBuilderData.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}