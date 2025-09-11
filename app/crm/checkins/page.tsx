'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Navigation, Clock, Calendar, User, Building2, 
  Phone, Mail, MessageSquare, Camera, Plus, Filter,
  Search, CheckCircle2, AlertCircle, TrendingUp, Users
} from 'lucide-react';
import { db } from '@/lib/firebase-client';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  GeoPoint 
} from 'firebase/firestore';

interface CheckIn {
  id: string;
  userId: string;
  userName: string;
  contactId?: string;
  contactName?: string;
  companyId?: string;
  companyName?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    state: string;
    country: string;
  };
  type: 'meeting' | 'site-visit' | 'delivery' | 'service' | 'sales-call' | 'other';
  notes: string;
  photos?: string[];
  duration?: number; // in minutes
  outcome?: 'successful' | 'follow-up-needed' | 'no-show' | 'rescheduled';
  nextSteps?: string;
  timestamp: any;
  weather?: {
    temp: number;
    condition: string;
  };
}

interface MapMarker {
  position: { lat: number; lng: number };
  title: string;
  checkIn: CheckIn;
}

export default function CheckInsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [filteredCheckIns, setFilteredCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedCheckIn, setSelectedCheckIn] = useState<CheckIn | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('today');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Check-in form
  const [checkInForm, setCheckInForm] = useState({
    contactName: '',
    companyName: '',
    type: 'meeting' as CheckIn['type'],
    notes: '',
    outcome: 'successful' as CheckIn['outcome'],
    nextSteps: '',
    duration: 60,
    address: '',
    city: '',
    state: '',
    country: 'USA'
  });

  useEffect(() => {
    loadCheckIns();
    getUserLocation();
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    filterCheckInData();
  }, [checkIns, dateFilter, typeFilter, userFilter, searchTerm]);

  const loadGoogleMaps = () => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setMapLoaded(true);
        initializeMap();
      };
      document.head.appendChild(script);
    } else if (window.google) {
      setMapLoaded(true);
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: 12,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'on' }]
        }
      ]
    });

    // Add markers for check-ins
    filteredCheckIns.forEach(checkIn => {
      const marker = new window.google.maps.Marker({
        position: { lat: checkIn.location.lat, lng: checkIn.location.lng },
        map: map,
        title: checkIn.companyName || checkIn.contactName || 'Check-in',
        icon: getMarkerIcon(checkIn.type)
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: getInfoWindowContent(checkIn)
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        setSelectedCheckIn(checkIn);
      });
    });

    // Add user location marker if available
    if (userLocation) {
      new window.google.maps.Marker({
        position: userLocation,
        map: map,
        title: 'Your Location',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
        }
      });
    }
  };

  const getMarkerIcon = (type: CheckIn['type']) => {
    const icons: { [key: string]: string } = {
      'meeting': 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
      'site-visit': 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
      'delivery': 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
      'service': 'https://maps.google.com/mapfiles/ms/icons/purple-dot.png',
      'sales-call': 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
      'other': 'https://maps.google.com/mapfiles/ms/icons/grey-dot.png'
    };
    return icons[type] || icons.other;
  };

  const getInfoWindowContent = (checkIn: CheckIn) => {
    return `
      <div style="padding: 10px; max-width: 250px;">
        <h3 style="margin: 0 0 10px 0; font-weight: bold;">
          ${checkIn.companyName || checkIn.contactName}
        </h3>
        <p style="margin: 5px 0; color: #666;">
          <strong>Type:</strong> ${checkIn.type}
        </p>
        <p style="margin: 5px 0; color: #666;">
          <strong>Time:</strong> ${new Date(checkIn.timestamp?.toDate()).toLocaleString()}
        </p>
        <p style="margin: 5px 0; color: #666;">
          <strong>Rep:</strong> ${checkIn.userName}
        </p>
        ${checkIn.notes ? `
          <p style="margin: 10px 0 5px 0; color: #333;">
            ${checkIn.notes}
          </p>
        ` : ''}
      </div>
    `;
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter(location);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const loadCheckIns = async () => {
    setLoading(true);
    try {
      const checkInsQuery = query(
        collection(db, 'checkins'),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(checkInsQuery);
      const checkInsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CheckIn[];
      
      setCheckIns(checkInsData);
    } catch (error) {
      console.error('Error loading check-ins:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCheckInData = () => {
    let filtered = [...checkIns];

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(c => {
          const checkInDate = c.timestamp?.toDate();
          return checkInDate >= today;
        });
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(c => {
          const checkInDate = c.timestamp?.toDate();
          return checkInDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(c => {
          const checkInDate = c.timestamp?.toDate();
          return checkInDate >= monthAgo;
        });
        break;
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(c => c.userName === userFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCheckIns(filtered);
  };

  const handleCheckIn = async () => {
    if (!userLocation) {
      alert('Please enable location services to check in');
      return;
    }

    try {
      const newCheckIn = {
        userId: 'current-user-id', // This would come from auth
        userName: 'John Doe', // This would come from auth
        contactName: checkInForm.contactName,
        companyName: checkInForm.companyName,
        location: {
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: checkInForm.address,
          city: checkInForm.city,
          state: checkInForm.state,
          country: checkInForm.country
        },
        type: checkInForm.type,
        notes: checkInForm.notes,
        outcome: checkInForm.outcome,
        nextSteps: checkInForm.nextSteps,
        duration: checkInForm.duration,
        timestamp: Timestamp.now()
      };

      await addDoc(collection(db, 'checkins'), newCheckIn);
      
      // Reload check-ins
      await loadCheckIns();
      setShowCheckInModal(false);
      resetCheckInForm();
    } catch (error) {
      console.error('Error creating check-in:', error);
      alert('Failed to create check-in');
    }
  };

  const resetCheckInForm = () => {
    setCheckInForm({
      contactName: '',
      companyName: '',
      type: 'meeting',
      notes: '',
      outcome: 'successful',
      nextSteps: '',
      duration: 60,
      address: '',
      city: '',
      state: '',
      country: 'USA'
    });
  };

  const getTypeColor = (type: CheckIn['type']) => {
    const colors: { [key: string]: string } = {
      'meeting': 'bg-green-100 text-green-800',
      'site-visit': 'bg-yellow-100 text-yellow-800',
      'delivery': 'bg-blue-100 text-blue-800',
      'service': 'bg-purple-100 text-purple-800',
      'sales-call': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.other;
  };

  const getOutcomeIcon = (outcome?: CheckIn['outcome']) => {
    switch (outcome) {
      case 'successful':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'follow-up-needed':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'no-show':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg">Loading check-ins...</div>
        </div>
      
    );
  }

  return (
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Field Check-ins</h1>
              <p className="text-gray-600 mt-1">
                Track field visits and customer interactions on the map
              </p>
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Check In Now
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="meeting">Meetings</option>
              <option value="site-visit">Site Visits</option>
              <option value="delivery">Deliveries</option>
              <option value="service">Service Calls</option>
              <option value="sales-call">Sales Calls</option>
              <option value="other">Other</option>
            </select>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="all">All Reps</option>
              <option value="John Doe">John Doe</option>
              <option value="Jane Smith">Jane Smith</option>
              <option value="Mike Johnson">Mike Johnson</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex space-x-6 mt-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Check-ins</p>
                <p className="text-lg font-semibold">{filteredCheckIns.length}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Active Reps</p>
                <p className="text-lg font-semibold">
                  {new Set(filteredCheckIns.map(c => c.userId)).size}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-lg font-semibold">
                  {Math.round(
                    (filteredCheckIns.filter(c => c.outcome === 'successful').length / 
                    filteredCheckIns.length) * 100
                  ) || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map and List */}
        <div className="flex-1 flex">
          {/* Map */}
          <div className="flex-1 relative">
            <div ref={mapRef} className="w-full h-full" />
            
            {!mapLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}

            {/* Current Location Button */}
            <button
              onClick={getUserLocation}
              className="absolute bottom-6 right-6 bg-white p-3 rounded-full shadow-lg hover:shadow-xl"
            >
              <Navigation className="h-5 w-5 text-blue-600" />
            </button>
          </div>

          {/* Check-in List */}
          <div className="w-96 bg-white border-l overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Recent Check-ins</h3>
            </div>
            <div className="divide-y">
              {filteredCheckIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedCheckIn(checkIn)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {checkIn.companyName || checkIn.contactName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {checkIn.location.city}, {checkIn.location.state}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getTypeColor(checkIn.type)}`}>
                      {checkIn.type}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-600">
                      <User className="h-3 w-3 mr-1" />
                      {checkIn.userName}
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(checkIn.timestamp?.toDate()).toLocaleString()}
                    </div>
                    {checkIn.outcome && (
                      <div className="flex items-center text-xs">
                        {getOutcomeIcon(checkIn.outcome)}
                        <span className="ml-1">{checkIn.outcome}</span>
                      </div>
                    )}
                  </div>

                  {checkIn.notes && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {checkIn.notes}
                    </p>
                  )}
                </div>
              ))}

              {filteredCheckIns.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  No check-ins found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Create Check-in</h2>
              {userLocation && (
                <p className="text-sm text-gray-600 mt-1">
                  Current location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={checkInForm.companyName}
                  onChange={(e) => setCheckInForm({ ...checkInForm, companyName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={checkInForm.contactName}
                  onChange={(e) => setCheckInForm({ ...checkInForm, contactName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={checkInForm.type}
                  onChange={(e) => setCheckInForm({ ...checkInForm, type: e.target.value as CheckIn['type'] })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="meeting">Meeting</option>
                  <option value="site-visit">Site Visit</option>
                  <option value="delivery">Delivery</option>
                  <option value="service">Service Call</option>
                  <option value="sales-call">Sales Call</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={checkInForm.duration}
                    onChange={(e) => setCheckInForm({ ...checkInForm, duration: parseInt(e.target.value) })}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outcome
                  </label>
                  <select
                    value={checkInForm.outcome}
                    onChange={(e) => setCheckInForm({ ...checkInForm, outcome: e.target.value as CheckIn['outcome'] })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="successful">Successful</option>
                    <option value="follow-up-needed">Follow-up Needed</option>
                    <option value="no-show">No Show</option>
                    <option value="rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={checkInForm.notes}
                  onChange={(e) => setCheckInForm({ ...checkInForm, notes: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Meeting notes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Steps
                </label>
                <textarea
                  value={checkInForm.nextSteps}
                  onChange={(e) => setCheckInForm({ ...checkInForm, nextSteps: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                  placeholder="Follow-up actions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Details
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={checkInForm.address}
                    onChange={(e) => setCheckInForm({ ...checkInForm, address: e.target.value })}
                    className="col-span-2 border rounded-lg px-3 py-2"
                    placeholder="Street address"
                  />
                  <input
                    type="text"
                    value={checkInForm.city}
                    onChange={(e) => setCheckInForm({ ...checkInForm, city: e.target.value })}
                    className="border rounded-lg px-3 py-2"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={checkInForm.state}
                    onChange={(e) => setCheckInForm({ ...checkInForm, state: e.target.value })}
                    className="border rounded-lg px-3 py-2"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                <button className="flex items-center text-gray-600 hover:text-gray-800">
                  <Camera className="h-5 w-5 mr-2" />
                  Add Photos
                </button>
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCheckInModal(false);
                  resetCheckInForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckIn}
                disabled={!checkInForm.companyName && !checkInForm.contactName}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Check-in
              </button>
            </div>
          </div>
        </div>
      )}
  );
}