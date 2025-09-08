import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface LayoutProps {
  children: ReactNode;
}

export default function MinimalLayout({ children }: LayoutProps) {
  const router = useRouter();
  const totalItems = 0; // Hardcoded since cart context is removed
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [showCustomPrintDropdown, setShowCustomPrintDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showOrdersDropdown, setShowOrdersDropdown] = useState(false);
  const ordersDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ordersDropdownRef.current && !ordersDropdownRef.current.contains(event.target as Node)) {
        setShowOrdersDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const productCategories = [
    { name: 'All Products', href: '/catalog' },
    { name: 'Dinnerware', href: '/catalog?category=dinnerware' },
    { name: 'Glassware', href: '/catalog?category=glassware' },
    { name: 'Flatware', href: '/catalog?category=flatware' },
    { name: 'Kitchen Equipment', href: '/catalog?category=equipment' },
    { name: 'Bar Supplies', href: '/catalog?category=bar' },
    { name: 'Linens & Tabletop', href: '/catalog?category=linens' },
    { name: 'Disposables', href: '/catalog?category=disposables' },
    { name: 'Janitorial', href: '/catalog?category=janitorial' },
  ];

  const customPrintOptions = [
    { name: 'Custom Products Catalog', href: '/catalog?category=custom' },
    { name: 'Art Proofs', href: '/art-proofs' },
    { name: 'Design Templates', href: '/design-templates' },
    { name: 'Upload Artwork', href: '/upload-artwork' },
    { name: 'Custom Quote Request', href: '/custom-quote' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Image
                src="/shw-logo.png"
                alt="Shure Hospitality Wholesale"
                width={80}
                height={80}
                priority
              />
            </Link>
            
            {/* Main Navigation */}
            <nav className="flex items-center space-x-8">
              {/* Products Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProductsDropdown(!showProductsDropdown)}
                  onMouseEnter={() => setShowProductsDropdown(true)}
                  className="flex items-center text-gray-700 hover:text-gray-900 font-medium"
                >
                  Products
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showProductsDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    onMouseLeave={() => setShowProductsDropdown(false)}
                  >
                    {productCategories.map((category) => (
                      <Link
                        key={category.name}
                        href={category.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => setShowProductsDropdown(false)}
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Print Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCustomPrintDropdown(!showCustomPrintDropdown)}
                  onMouseEnter={() => setShowCustomPrintDropdown(true)}
                  className="flex items-center text-gray-700 hover:text-gray-900 font-medium"
                >
                  Custom Print
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showCustomPrintDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    onMouseLeave={() => setShowCustomPrintDropdown(false)}
                  >
                    {customPrintOptions.map((option) => (
                      <Link
                        key={option.name}
                        href={option.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 first:rounded-t-lg last:rounded-b-lg"
                        onClick={() => setShowCustomPrintDropdown(false)}
                      >
                        {option.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Orders Dropdown */}
              <div className="relative" ref={ordersDropdownRef}>
                <button
                  onClick={() => setShowOrdersDropdown(!showOrdersDropdown)}
                  onMouseEnter={() => setShowOrdersDropdown(true)}
                  className="flex items-center text-gray-700 hover:text-gray-900 font-medium"
                >
                  Orders
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showOrdersDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                  </svg>
                </button>
                
                {showOrdersDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    onMouseLeave={() => setShowOrdersDropdown(false)}
                  >
                    <Link
                      href="/quick-order"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-t-lg"
                      onClick={() => setShowOrdersDropdown(false)}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Quick Order
                      </span>
                    </Link>
                    <Link
                      href="/favorites"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setShowOrdersDropdown(false)}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Favorites
                      </span>
                    </Link>
                    <Link
                      href="/import"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setShowOrdersDropdown(false)}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Import Order
                      </span>
                    </Link>
                    <div className="border-t border-gray-200"></div>
                    <Link
                      href="/account/orders"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setShowOrdersDropdown(false)}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Order History
                      </span>
                    </Link>
                    <Link
                      href="/quotes"
                      className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-b-lg"
                      onClick={() => setShowOrdersDropdown(false)}
                    >
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Quotes
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {true ? (
                <>
                  {/* Search */}
                  <button className="text-gray-600 hover:text-gray-900">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>

                  {/* Cart */}
                  <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {totalItems > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {totalItems}
                      </span>
                    )}
                  </Link>

                  {/* Account Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>
                    
                    {showAccountDropdown && (
                      <div 
                        className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                        onMouseLeave={() => setShowAccountDropdown(false)}
                      >
                        <Link
                          href="/account"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-t-lg"
                          onClick={() => setShowAccountDropdown(false)}
                        >
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => setShowAccountDropdown(false)}
                        >
                          Order History
                        </Link>
                        <Link
                          href="/account/addresses"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => setShowAccountDropdown(false)}
                        >
                          Addresses
                        </Link>
                        <Link
                          href="/account/users"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => setShowAccountDropdown(false)}
                        >
                          Manage Users
                        </Link>
                        <hr className="my-1 border-gray-200" />
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-b-lg"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link href="/login" className="text-gray-900 hover:text-gray-700 font-medium">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-auto">
        <div className="px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold mb-4">About SHW</h3>
              <p className="text-sm text-gray-300">
                Leading wholesale distributor serving the hospitality industry for over 25 years. Quality products, competitive pricing, exceptional service.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/catalog" className="text-gray-300 hover:text-white">Browse Catalog</Link></li>
                <li><Link href="/account" className="text-gray-300 hover:text-white">My Account</Link></li>
                <li><Link href="/account/orders" className="text-gray-300 hover:text-white">Order History</Link></li>
                <li><Link href="/quotes" className="text-gray-300 hover:text-white">Request Quote</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/catalog?category=dinnerware" className="text-gray-300 hover:text-white">Dinnerware</Link></li>
                <li><Link href="/catalog?category=glassware" className="text-gray-300 hover:text-white">Glassware</Link></li>
                <li><Link href="/catalog?category=equipment" className="text-gray-300 hover:text-white">Equipment</Link></li>
                <li><Link href="/catalog?category=janitorial" className="text-gray-300 hover:text-white">Janitorial</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>1-800-SHURE-HW</li>
                <li>sales@shurehw.com</li>
                <li>Mon-Fri: 8AM-6PM EST</li>
                <li>Miami, FL 33166</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 Shure Hospitality Wholesale. All rights reserved. | Terms & Conditions | Privacy Policy</p>
          </div>
        </div>
      </footer>
    </div>
  );
}