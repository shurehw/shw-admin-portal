'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Users, 
  Building, 
  Target, 
  CheckSquare, 
  Activity, 
  Ticket, 
  BarChart3, 
  Settings, 
  GitBranch,
  Mail,
  MessageSquare,
  List,
  Zap,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  ArrowLeft,
  Home
} from 'lucide-react';

const navigation = [
  {
    name: 'Overview',
    href: '/crm',
    icon: BarChart3,
  },
  {
    name: 'Contacts',
    href: '/crm/contacts',
    icon: Users,
  },
  {
    name: 'Companies',
    href: '/crm/companies',
    icon: Building,
  },
  {
    name: 'Deals',
    href: '/crm/deals',
    icon: Target,
  },
  {
    name: 'Tasks',
    href: '/crm/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Activities',
    href: '/crm/activities',
    icon: Activity,
  },
  {
    name: 'Quick Tickets',
    href: '/crm/tickets',
    icon: Ticket,
    badge: 'Light',
  },
  {
    name: 'Pipeline',
    href: '/crm/pipeline',
    icon: GitBranch,
  },
  {
    name: 'Pipelines',
    href: '/crm/pipelines',
    icon: List,
  },
  {
    name: 'Communications',
    href: '/crm/communications',
    icon: MessageSquare,
    children: [
      {
        name: 'Email',
        href: '/crm/communications/email',
        icon: Mail,
      },
    ],
  },
  {
    name: 'Reports',
    href: '/crm/reports',
    icon: FileText,
  },
  {
    name: 'Automations',
    href: '/crm/automations',
    icon: Zap,
  },
  {
    name: 'Lists',
    href: '/crm/lists',
    icon: List,
  },
  {
    name: 'Settings',
    href: '/crm/settings',
    icon: Settings,
  },
];

interface CRMSidebarProps {
  className?: string;
}

export default function CRMSidebar({ className = '' }: CRMSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/crm') {
      return pathname === '/crm';
    }
    return pathname.startsWith(href);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm-sidebar-collapsed', (!isCollapsed).toString());
    }
  };

  // Load saved preference on mount
  if (typeof window !== 'undefined' && isCollapsed === false) {
    const saved = localStorage.getItem('crm-sidebar-collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          fixed md:relative
          bg-white border-r border-gray-200 
          h-full flex-shrink-0 
          transition-all duration-300 ease-in-out
          z-50 md:z-auto
          ${className}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Back to Admin Button */}
          <Link 
            href="/admin/dashboard"
            className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 border-b border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-colors`}
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
            {!isCollapsed && (
              <span className="text-sm font-medium text-gray-700">Back to Admin</span>
            )}
          </Link>

          {/* Header */}
          <div className={`${isCollapsed ? 'px-2' : 'px-6'} py-4 border-b border-gray-200 flex items-center justify-between`}>
            {!isCollapsed && (
              <h1 className="text-xl font-semibold text-gray-900">CRM</h1>
            )}
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden md:block"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              )}
            </button>
            {isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Expand sidebar"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className={`flex-1 ${isCollapsed ? 'px-2' : 'px-4'} py-4 space-y-1 overflow-y-auto`}>
            {navigation.map((item) => {
              const isItemActive = isActive(item.href);
              const Icon = item.icon;

              return (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      group flex items-center 
                      ${isCollapsed ? 'px-2 justify-center' : 'px-3'} 
                      py-2 text-sm font-medium rounded-lg transition-colors
                      ${isItemActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon 
                      className={`
                        ${isCollapsed ? '' : 'mr-3'} 
                        h-5 w-5 flex-shrink-0
                        ${isItemActive 
                          ? 'text-blue-600' 
                          : 'text-gray-400 group-hover:text-gray-500'
                        }
                      `} 
                    />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>

                  {/* Sub-navigation (only when expanded) */}
                  {!isCollapsed && item.children && isItemActive && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={`
                              group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                              ${pathname === child.href
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }
                            `}
                          >
                            <ChildIcon className="mr-3 h-4 w-4 flex-shrink-0 text-gray-400" />
                            {child.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 border-t border-gray-200`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="flex-shrink-0">
                <div className={`${isCollapsed ? 'h-8 w-8' : 'h-8 w-8'} rounded-full bg-blue-500 flex items-center justify-center`}>
                  <span className="text-white text-sm font-medium">
                    {isCollapsed ? 'S' : 'SH'}
                  </span>
                </div>
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Shure Hardware</p>
                  <p className="text-xs text-gray-500">CRM System</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}