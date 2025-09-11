'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Building2, Target, Home,
  Handshake, Settings, Activity,
  MessageSquare, TrendingUp, Package,
  ChevronLeft, Menu, X, Plus
} from 'lucide-react';

interface CRMLayoutProps {
  children: ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  // Check if user can see Smart Leads (admin or sales_manager only)
  const canSeeSmartLeads = user?.role === 'admin' || user?.role === 'sales_manager';

  const navigation = [
    { name: 'Dashboard', href: '/crm', icon: Home },
    ...(canSeeSmartLeads ? [
      { name: 'Smart Leads', href: '/crm/leads', icon: Target }
    ] : []),
    { name: 'Contacts', href: '/crm/contacts', icon: Users },
    { name: 'Companies', href: '/crm/companies', icon: Building2 },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Deals', href: '/crm/deals', icon: Handshake },
    { name: 'Activities', href: '/crm/activities', icon: Activity },
    { name: 'Communications', href: '/crm/communications', icon: MessageSquare },
    { name: 'Reports', href: '/crm/reports', icon: TrendingUp },
    { name: 'Settings', href: '/crm/settings', icon: Settings },
  ];

  const quickActions = [
    { label: 'New Contact', href: '/crm/contacts/new' },
    { label: 'New Company', href: '/crm/companies/new' },
    { label: 'New Deal', href: '/crm/deals/new' },
    { label: 'Log Activity', href: '/crm/activities/new' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar with Back to Admin button and Quick Actions */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between h-full px-4">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <h1 className="ml-4 text-xl font-semibold text-gray-900">CRM</h1>
            
            {/* Quick Actions */}
            <div className="hidden md:flex items-center ml-8 space-x-2">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>
          
          <Link
            href="/admin/dashboard"
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-30 ${
        sidebarOpen ? 'w-64' : 'w-0 lg:w-64'
      } overflow-y-auto`}>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
                           (item.href !== '/crm' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Quick Actions */}
        <div className="lg:hidden border-t border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : ''
      }`}>
        <div className="min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}