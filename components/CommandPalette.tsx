'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, X, User, Building2, Handshake, Phone, Mail, 
  Calendar, Plus, ArrowRight, Clock, Hash, FileText,
  TrendingUp, Users, DollarSign, Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SearchService } from '@/lib/crm-services';
import { useAuth } from './AuthProvider';

interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'deal' | 'ticket' | 'activity' | 'action';
  title: string;
  subtitle?: string;
  meta?: string;
  icon: any;
  url?: string;
  action?: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  action: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { hasCapability } = useAuth();

  // Quick actions available in the palette (filtered by capabilities)
  const quickActions: QuickAction[] = [
    ...(hasCapability('contacts:write') ? [{
      id: 'new-contact',
      title: 'Create New Contact',
      subtitle: 'Add a new contact to CRM',
      icon: User,
      action: () => {
        setIsOpen(false);
        router.push('/crm/contacts/new');
      }
    }] : []),
    ...(hasCapability('companies:write') ? [{
      id: 'new-company',
      title: 'Create New Company',
      subtitle: 'Add a new company',
      icon: Building2,
      action: () => {
        setIsOpen(false);
        router.push('/crm/companies/new');
      }
    }] : []),
    ...(hasCapability('deals:write') ? [{
      id: 'new-deal',
      title: 'Create New Deal',
      subtitle: 'Add a new deal to pipeline',
      icon: Handshake,
      action: () => {
        setIsOpen(false);
        router.push('/crm/deals/new');
      }
    }] : []),
    ...(hasCapability('activities:write') ? [{
      id: 'new-activity',
      title: 'Log Activity',
      subtitle: 'Record a call, meeting, or note',
      icon: Activity,
      action: () => {
        setIsOpen(false);
        router.push('/crm/activities/new');
      }
    }] : []),
    ...(hasCapability('tasks:write') ? [{
      id: 'new-task',
      title: 'Create Task',
      subtitle: 'Add a new task or reminder',
      icon: Clock,
      action: () => {
        setIsOpen(false);
        router.push('/crm/tasks/new');
      }
    }] : []),
    ...(hasCapability('tickets:write') ? [{
      id: 'new-ticket',
      title: 'Create Ticket',
      subtitle: 'Open a support ticket',
      icon: FileText,
      action: () => {
        setIsOpen(false);
        router.push('/crm/tickets/new');
      }
    }] : [])
  ];

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
      
      // Arrow navigation
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        }
        if (e.key === 'Enter' && results[selectedIndex]) {
          e.preventDefault();
          handleResultClick(results[selectedIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      loadRecentItems();
    }
    if (!isOpen) {
      setSearchQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Load recent items from localStorage
  const loadRecentItems = () => {
    try {
      const recent = localStorage.getItem('crm_recent_items');
      if (recent) {
        setRecentItems(JSON.parse(recent).slice(0, 5));
      }
    } catch (error) {
      console.error('Error loading recent items:', error);
    }
  };

  // Save to recent items
  const saveToRecent = (item: SearchResult) => {
    try {
      const recent = localStorage.getItem('crm_recent_items');
      let recentArray: SearchResult[] = recent ? JSON.parse(recent) : [];
      
      // Remove if already exists
      recentArray = recentArray.filter(r => r.id !== item.id);
      
      // Add to beginning
      recentArray.unshift(item);
      
      // Keep only 10 most recent
      recentArray = recentArray.slice(0, 10);
      
      localStorage.setItem('crm_recent_items', JSON.stringify(recentArray));
    } catch (error) {
      console.error('Error saving recent item:', error);
    }
  };

  // Fuzzy search function
  const fuzzyMatch = (str: string, pattern: string): boolean => {
    const patternLower = pattern.toLowerCase();
    const strLower = str.toLowerCase();
    
    // Direct substring match
    if (strLower.includes(patternLower)) return true;
    
    // Fuzzy character matching
    let patternIdx = 0;
    for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
      if (strLower[i] === patternLower[patternIdx]) {
        patternIdx++;
      }
    }
    return patternIdx === patternLower.length;
  };

  // Search across all CRM data
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      // Show quick actions when no query
      const actionResults: SearchResult[] = quickActions.map(action => ({
        id: action.id,
        type: 'action',
        title: action.title,
        subtitle: action.subtitle,
        icon: action.icon,
        action: action.action
      }));
      
      // Add recent items if available
      if (recentItems.length > 0) {
        setResults([
          ...recentItems.slice(0, 3),
          ...actionResults
        ]);
      } else {
        setResults(actionResults);
      }
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];
    
    try {
      // Use the new SearchService
      const { contacts, companies, deals, tickets } = await SearchService.globalSearch(query);
      
      // Process contacts
      contacts.forEach(contact => {
        const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        searchResults.push({
          id: contact.id,
          type: 'contact',
          title: fullName || contact.email,
          subtitle: contact.companies?.name || contact.email,
          meta: contact.phone,
          icon: User,
          url: `/crm/contacts/${contact.id}`
        });
      });

      // Process companies
      companies.forEach(company => {
        searchResults.push({
          id: company.id,
          type: 'company',
          title: company.name,
          subtitle: company.industry || company.domain,
          meta: company.domain,
          icon: Building2,
          url: `/crm/companies/${company.id}`
        });
      });

      // Process deals
      deals.forEach(deal => {
        searchResults.push({
          id: deal.id,
          type: 'deal',
          title: deal.name,
          subtitle: deal.companies?.name,
          meta: `$${(deal.amount || 0).toLocaleString()} • ${deal.stage}`,
          icon: DollarSign,
          url: `/crm/deals/${deal.id}`
        });
      });

      // Process tickets
      tickets.forEach(ticket => {
        searchResults.push({
          id: ticket.id,
          type: 'ticket',
          title: ticket.subject,
          subtitle: ticket.companies?.name,
          meta: `${ticket.status} • ${ticket.priority}`,
          icon: FileText,
          url: `/crm/tickets/${ticket.id}`
        });
      });

      // Add quick actions that match
      quickActions.forEach(action => {
        if (fuzzyMatch(action.title, query) || 
            fuzzyMatch(action.subtitle, query)) {
          searchResults.push({
            id: action.id,
            type: 'action',
            title: action.title,
            subtitle: action.subtitle,
            icon: action.icon,
            action: action.action
          });
        }
      });

      // Sort results by relevance (basic scoring)
      searchResults.sort((a, b) => {
        const aExact = a.title.toLowerCase().startsWith(query.toLowerCase());
        const bExact = b.title.toLowerCase().startsWith(query.toLowerCase());
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return 0;
      });

      setResults(searchResults.slice(0, 8));
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to empty results on error
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [quickActions, recentItems]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type !== 'action') {
      saveToRecent(result);
    }
    
    setIsOpen(false);
    
    if (result.url) {
      router.push(result.url);
    } else if (result.action) {
      result.action();
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      contact: 'Contact',
      company: 'Company',
      deal: 'Deal',
      ticket: 'Ticket',
      activity: 'Activity',
      action: 'Action'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      contact: 'bg-blue-100 text-blue-800',
      company: 'bg-purple-100 text-purple-800',
      deal: 'bg-green-100 text-green-800',
      ticket: 'bg-orange-100 text-orange-800',
      activity: 'bg-yellow-100 text-yellow-800',
      action: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-20">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4">
          {/* Search Header */}
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center">
              <Search className="h-5 w-5 text-gray-400 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts, companies, deals... or type a command"
                className="flex-1 text-lg outline-none placeholder-gray-400"
              />
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {searchQuery === '' && recentItems.length > 0 && (
                  <div className="px-4 py-2">
                    <div className="text-xs font-medium text-gray-500 uppercase">Recent</div>
                  </div>
                )}
                {results.map((result, index) => {
                  const Icon = result.icon;
                  const isSelected = index === selectedIndex;
                  
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full px-4 py-3 flex items-center hover:bg-gray-50 ${
                        isSelected ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4 flex-1 text-left">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">
                            {result.title}
                          </span>
                          {result.meta && (
                            <span className="ml-2 text-sm text-gray-500">
                              {result.meta}
                            </span>
                          )}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-500">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeColor(result.type)}`}>
                          {getTypeLabel(result.type)}
                        </span>
                        {isSelected && (
                          <ArrowRight className="h-4 w-4 text-gray-400 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : searchQuery !== '' ? (
              <div className="p-8 text-center text-gray-500">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Type to search or select an action
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">↑↓</kbd>
                  <span className="ml-1">Navigate</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">↵</kbd>
                  <span className="ml-1">Select</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">esc</kbd>
                  <span className="ml-1">Close</span>
                </span>
              </div>
              <div>
                Press <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700">⌘K</kbd> to open
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}