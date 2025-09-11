'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminLayout from './AdminLayout';
import { useAuth } from './AuthProvider';
import { 
  Users, Building2, BarChart3, Target, Search,
  Plus, TrendingUp, Database, RefreshCw, Command, Home,
  Handshake, Settings, Activity, Mail, CheckSquare,
  Workflow, Clock, MessageSquare, ListTodo, Zap, ChevronDown,
  FilePlus, Star
} from 'lucide-react';

interface CRMLayoutProps {
  children: ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname();
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const { hasCapability } = useAuth();

  const navigation = [
    { name: 'My Day', href: '/crm', icon: Home, capability: null },
    { name: 'Smart Leads', href: '/crm/leads', icon: Target, capability: null },
    { name: 'Pipeline', href: '/crm/pipeline', icon: Workflow, capability: 'deals:read' },
    { name: 'Contacts', href: '/crm/contacts', icon: Users, capability: 'contacts:read' },
    { name: 'Companies', href: '/crm/companies', icon: Building2, capability: 'companies:read' },
    { name: 'Deals', href: '/crm/deals', icon: Handshake, capability: 'deals:read' },
    { name: 'Customer Rankings', href: '/crm/customer-rankings', icon: Star, capability: null },
    { name: 'Activities', href: '/crm/activities', icon: Activity, capability: 'contacts:read' },
    { name: 'Tasks', href: '/crm/tasks', icon: CheckSquare, capability: 'contacts:read' },
    { name: 'Communications', href: '/crm/communications', icon: MessageSquare, capability: 'contacts:read' },
    { name: 'Email', href: '/crm/email', icon: Mail, capability: 'contacts:read' },
    { name: 'Lists', href: '/crm/lists', icon: ListTodo, capability: 'contacts:read' },
    { name: 'Automations', href: '/crm/automations', icon: Zap, capability: 'admin:read' },
    { name: 'Timeline', href: '/crm/timeline', icon: Clock, capability: 'contacts:read' },
    { name: 'Reports', href: '/crm/reports', icon: TrendingUp, capability: 'analytics:read' },
    { name: 'RAR Sync', href: '/crm/rar-sync', icon: RefreshCw, capability: 'admin:read' },
    { name: 'Email Channels', href: '/crm/settings/email-channels', icon: Mail, capability: 'settings:write' },
    { name: 'Settings', href: '/crm/settings', icon: Settings, capability: 'settings:write' },
  ].filter(item => !item.capability || hasCapability(item.capability as any));

  const quickActions = [
    { label: 'New Contact', icon: Users, href: '/crm/contacts/new', capability: 'contacts:write' },
    { label: 'New Company', icon: Building2, href: '/crm/companies/new', capability: 'companies:write' },
    { label: 'New Deal', icon: Handshake, href: '/crm/deals/new', capability: 'deals:write' },
    { label: 'New Activity', icon: Activity, href: '/crm/activities/new', capability: 'contacts:write' },
    { label: 'New Task', icon: CheckSquare, href: '/crm/tasks/new', capability: 'contacts:write' },
    { label: 'New Quote', icon: FilePlus, href: '/quotes/new', capability: 'quotes:write' },
  ].filter(action => hasCapability(action.capability as any));

  return (
    <AdminLayout>
      <div className="h-full bg-gray-50 flex flex-col">
        {/* CRM Sub-header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center">
                {/* CRM Navigation */}
                <nav className="hidden md:flex items-center space-x-1">
                  {navigation.slice(0, 7).map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                                    (item.href !== '/crm' && pathname.startsWith(item.href));
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                  
                  {/* More dropdown */}
                  {navigation.length > 7 && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                        className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                      >
                        More
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </button>
                      {showMoreDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                          {navigation.slice(7).map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || 
                                          (item.href !== '/crm' && pathname.startsWith(item.href));
                            return (
                              <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center px-4 py-2 text-sm ${
                                  isActive
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                                onClick={() => setShowMoreDropdown(false)}
                              >
                                <Icon className="mr-3 h-4 w-4" />
                                {item.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </nav>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-4">
                {quickActions.length > 0 && (
                  <div className="relative group">
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      <Plus className="mr-2 h-4 w-4" />
                      Quick Add
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 hidden group-hover:block">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Link
                            key={action.label}
                            href={action.href}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Icon className="mr-3 h-4 w-4 text-gray-400" />
                            {action.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 py-2">
              <div className="flex overflow-x-auto space-x-1 scrollbar-thin">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || 
                                  (item.href !== '/crm' && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex flex-col items-center justify-center px-3 py-2 text-xs rounded-md whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </AdminLayout>
  );
}