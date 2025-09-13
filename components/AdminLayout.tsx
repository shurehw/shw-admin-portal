'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import NextImage from 'next/image';
import { 
  Home, Building, FileText, Package, CreditCard, Users, 
  Settings, LogOut, Menu, X, Bell, Search, ChevronDown,
  BarChart3, HelpCircle, Shield, Image, Calculator, Truck, UserCheck, Command, LifeBuoy, DollarSign,
  FilePlus, RefreshCw, Archive, Mail, PlusCircle
} from 'lucide-react';
import CommandPalette from '@/components/CommandPalette';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, signOut, refreshProfile } = useAuth();

  // Get user role and permissions - with proper fallback
  const userRole = user?.role || 'admin';
  console.log('User role in AdminLayout:', userRole, 'User:', user);
  
  // Define navigation based on user role
  const getNavigation = (email: string) => {
    const baseNav = [
      { name: 'Dashboard', href: '/admin/dashboard', icon: Home, roles: ['admin', 'sales_rep', 'customer_service', 'production', 'art_team', 'viewer'] },
    ];
    
    const adminOnlyNav = [
      // Users moved to top navigation dropdown only
    ];
    
    const salesNav = [
      { name: 'CRM', href: '/crm', icon: UserCheck, roles: ['admin', 'sales_rep', 'customer_service'] },
      { name: 'Limbo', href: '/limbo', icon: Archive, roles: ['admin', 'sales_rep', 'customer_service'] },
      { name: 'Support Center', href: '/admin/support/tickets', icon: LifeBuoy, roles: ['admin', 'customer_service'] },
      { name: 'Orders', href: '/admin/orders', icon: Truck, roles: ['admin', 'sales_rep', 'customer_service'] },
      { name: 'Products & Inventory', href: '/admin/products', icon: Package, roles: ['admin', 'sales_rep', 'customer_service'] },
      // Special item only for jacob@shurehw.com
      ...(email === 'jacob@shurehw.com' ? [
        { name: 'Products-SOS Manager', href: '/admin/products-sos-optimized', icon: Package, roles: ['admin'] }
      ] : []),
      { name: 'Custom Catalog', href: '/admin/custom-catalog', icon: Package, roles: ['admin', 'sales_rep'] },
      { name: 'Quote Builder', href: '/admin/quotes/builder', icon: PlusCircle, roles: ['admin', 'sales_rep'] },
      { name: 'Quotes', href: '/admin/quotes', icon: FileText, roles: ['admin', 'sales_rep'] },
      { name: 'Quote Requests', href: '/admin/quotes/requests', icon: FileText, roles: ['admin', 'sales_rep'] },
      { name: 'Invoices', href: '/admin/invoices', icon: CreditCard, roles: ['admin', 'sales_rep', 'customer_service'] },
    ];
    
    const productionNav = [
      { name: 'Art Proofs', href: '/admin/production/art-proofs', icon: Image, roles: ['admin', 'production', 'art_team'] },
    ];
    
    const adminNav = [
      { name: 'Reports', href: '/admin/reports', icon: BarChart3, roles: ['admin'] },
    ];
    
    const allNav = [...baseNav, ...adminOnlyNav, ...salesNav, ...productionNav, ...adminNav];
    
    // If user role is not set, show all navigation for admin
    if (!user?.role) {
      console.log('No user role found, defaulting to admin navigation');
      return allNav;
    }
    
    return allNav.filter(item => item.roles.includes(userRole));
  };

  const userName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  
  const navigation = getNavigation(userEmail);

  const handleSignOut = async () => {
    signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              
              <div className="ml-4 flex items-center">
                <NextImage
                  src="/shw-logo.png"
                  alt="SHW"
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">SHW Admin Portal</h2>
                  <p className="text-xs text-gray-500">B2B Management System</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Command Palette Trigger */}
              <button
                onClick={() => {
                  const event = new KeyboardEvent('keydown', {
                    key: 'k',
                    metaKey: true,
                    ctrlKey: true
                  });
                  document.dispatchEvent(event);
                }}
                className="hidden md:flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <Search className="h-4 w-4 mr-2" />
                <span>Search...</span>
                <kbd className="ml-8 px-2 py-1 bg-white rounded text-xs border">⌘K</kbd>
              </button>

              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center text-sm rounded-lg hover:bg-gray-100 p-2"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center text-white mr-2">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="font-medium text-gray-900">{userName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole.replace('_', ' ')}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50">
                    <Link href="/admin/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                    <button 
                      onClick={async () => {
                        await refreshProfile();
                        window.location.reload();
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Profile
                    </button>
                    <Link href="/admin/help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help & Support
                    </Link>
                    
                    {userRole === 'admin' && (
                      <>
                        <hr className="my-1" />
                        <Link href="/admin/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          User Management
                        </Link>
                        <Link href="/admin/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                        <Link href="/admin/settings/roles" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Role Permissions
                        </Link>
                        <Link href="/admin/settings/ticket-routing" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Ticket Email Routing
                        </Link>
                      </>
                    )}
                    
                    {(userRole === 'admin' || userRole === 'customer_service') && (
                      <>
                        <hr className="my-1" />
                        <Link href="/admin/settings/support-email" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Support Email Setup
                        </Link>
                      </>
                    )}
                    
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } transition-all duration-300 bg-gray-900 h-[calc(100vh-4rem)] fixed left-0 overflow-y-auto overflow-x-hidden z-30 scrollbar-thin`}>
          <nav className="mt-6 px-4 pb-24">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 mb-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
          <div className="min-h-screen">
            {children}
          </div>
        </main>
      </div>
      
      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}