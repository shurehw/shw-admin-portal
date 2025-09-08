// ========================
// FILE: components/Nav.tsx (Client Component)
// ========================
"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ---------- Types ----------
type Subcategory = { id: number; name: string; href: string };
export type BCCategory = { id: number; name: string; href: string; subcategories?: Subcategory[] };
interface NavProps { categories?: BCCategory[] }

// ---------- Utils ----------
function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---------- Data Hook ----------
function useNavCategories(enabled = true) {
  const [data, setData] = useState<BCCategory[] | null>(null);
  const [loading, setLoading] = useState<boolean>(!!enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch("/api/nav", { cache: "no-store" });
        if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
        const j = await r.json();
        if (active) setData(Array.isArray(j?.categories) ? j.categories : []);
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load categories");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [enabled]);

  return { data, loading, error };
}

// ---------- Component ----------
export default function Nav({ categories }: NavProps) {
  // Data
  const shouldFetch = !categories || categories.length === 0;
  const { data, loading, error } = useNavCategories(shouldFetch);
  const cats = (categories?.length ? categories : data) ?? [];

  // State
  const [openDropdowns, setOpenDropdowns] = useState<Record<number, boolean>>({});
  const [showProductsDropdown, setShowProductsDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Refs
  const navRef = useRef<HTMLDivElement | null>(null);
  const productsBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Close all flyouts
  const closeAll = () => {
    setOpenDropdowns({});
    setShowProductsDropdown(false);
  };

  // Outside click to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Escape key to close menus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAll();
        setMobileOpen(false);
        productsBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Close products dropdown when focus leaves it
  useEffect(() => {
    if (!showProductsDropdown) return;
    const el = dropdownContainerRef.current;
    if (!el) return;
    const onFocus = (e: FocusEvent) => {
      if (!el.contains(e.target as Node) && e.target !== productsBtnRef.current) {
        setShowProductsDropdown(false);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [showProductsDropdown]);

  const toggleDropdown = (id: number) =>
    setOpenDropdowns(prev => ({ ...prev, [id]: !prev[id] }));

  // Keyboard nav within dropdown list (Up/Down/Home/End)
  const focusNextItem = (dir: 1 | -1 | "home" | "end") => {
    const container = listRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[data-menuitem="true"]'));
    if (items.length === 0) return;
    const activeIndex = items.findIndex(i => i === document.activeElement);
    let nextIndex = activeIndex;
    if (dir === "home") nextIndex = 0;
    else if (dir === "end") nextIndex = items.length - 1;
    else nextIndex = activeIndex < 0 ? 0 : (activeIndex + dir + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); focusNextItem(1); break;
      case "ArrowUp": e.preventDefault(); focusNextItem(-1); break;
      case "Home": e.preventDefault(); focusNextItem("home"); break;
      case "End": e.preventDefault(); focusNextItem("end"); break;
      case "Escape": closeAll(); (e.target as HTMLElement)?.blur(); break;
    }
  };

  return (
    <nav ref={navRef} className="relative z-[210] bg-gray-800 text-white isolate">
      <div className="relative z-[220] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop row */}
        <div className="relative z-[230] flex min-h-12 items-center">
          <div className="flex-1 flex space-x-1 overflow-x-auto scrollbar-thin pr-2" style={{ scrollbarGutter: 'stable' }}>
          {/* Products Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => setShowProductsDropdown(true)}
            onMouseLeave={() => setShowProductsDropdown(false)}
          >
            <button
              ref={productsBtnRef}
              onClick={() => setShowProductsDropdown(v => !v)}
              className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors flex items-center"
              aria-haspopup="menu"
              aria-expanded={showProductsDropdown}
              aria-controls="products-menu"
            >
              Products
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d={showProductsDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>

            {/* Dropdown (no internal scroll) */}
            {showProductsDropdown && (
              <div
                ref={dropdownContainerRef}
                id="products-menu"
                role="menu"
                aria-label="Products"
                className="absolute top-full left-0 mt-1 bg-white text-gray-900 rounded-md shadow-lg z-[9998] border border-gray-200 w-[28rem] overflow-visible"
              >
                <div
                  ref={listRef}
                  className="py-1 overflow-x-visible"
                  onKeyDown={onListKeyDown}
                >
                  <Link
                    href="/catalog"
                    className="block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-gray-100 border-b"
                    onClick={() => setShowProductsDropdown(false)}
                    data-menuitem="true"
                  >
                    View All Products
                  </Link>

                  {loading && <div className="px-4 py-2 text-sm text-gray-500">Loading…</div>}
                  {error && !loading && cats.length === 0 && (
                    <div className="px-4 py-2 text-sm text-red-600">Failed to load categories</div>
                  )}

                  {cats.map((category) => {
                    const hasSub = !!category.subcategories?.length;
                    return (
                      <div key={category.id} className="relative group">
                        {/* Parent link */}
                        <Link
                          href={`/catalog?category=${category.name.toLowerCase()}`}
                          className={clsx(
                            "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 relative",
                            hasSub && "pr-10"
                          )}
                          onClick={() => setShowProductsDropdown(false)}
                          data-menuitem="true"
                        >
                          {category.name}
                          {hasSub && (
                            <svg
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                              fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </Link>

                        {/* Sub flyout (multi-column if large) */}
                        {hasSub && (
                          <div className="absolute left-full top-0 ml-1 bg-white rounded-md shadow-lg border border-gray-200 w-[28rem] hidden group-hover:block z-[9999]">
                            <div className="py-2">
                              <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                                {category.name}
                              </div>
                              <div className={`grid gap-1 px-2 py-2 ${
                                category.subcategories!.length > 12 ? "grid-cols-3" :
                                category.subcategories!.length > 8 ? "grid-cols-2" : "grid-cols-1"
                              }`}>
                                {category.subcategories!.map((sub) => (
                                  <Link
                                    key={sub.id}
                                    href={`/catalog?category=${category.name.toLowerCase()}&subcategory=${sub.name.toLowerCase()}`}
                                    className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                                    onClick={() => setShowProductsDropdown(false)}
                                    data-menuitem="true"
                                  >
                                    {sub.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CRM Link */}
          <Link href="/crm" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap flex items-center">
            CRM
            <span className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">NEW</span>
          </Link>
          
          {/* Quick Links */}
          <Link href="/admin/custom-catalog" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap">
            Custom Catalog
          </Link>
          <Link href="/quick-order" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap">
            Quick Order
          </Link>
          <Link href="/favorites" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap">
            Favorites
          </Link>
          <Link href="/account/orders" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap">
            Orders
          </Link>
          <Link href="/custom-orders" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap flex items-center">
            Order Tracking
            <span className="ml-1 bg-yellow-500 text-gray-900 text-xs px-1.5 py-0.5 rounded font-bold">NEW</span>
          </Link>
          <Link href="/quotes" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap">
            Quotes
          </Link>
          <Link href="/art-proofs" className="text-white px-4 py-2 text-sm font-medium hover:bg-gray-700 rounded transition-colors whitespace-nowrap">
            Art Proofs
          </Link>

          </div>
          {/* Mobile hamburger (hidden on md+) */}
          <button
            className="ml-2 md:hidden inline-flex items-center justify-center rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white/10 text-white flex-shrink-0"
            onClick={() => setMobileOpen(o => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>

        {/* Mobile sheet: fully expanding (accordion with chevrons) */}
        <div
          id="mobile-menu"
          className={clsx(
            "md:hidden bg-white rounded-b-xl",
            mobileOpen ? "block" : "hidden"
          )}
        >
          <ul className="divide-y divide-gray-200">
            {/* Products (accordion) */}
            <li className="py-1">
              <div className="px-4 py-2 text-sm font-medium">Products</div>
              <div className="pl-2 pb-2">
                <Link
                  href="/catalog"
                  className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100 font-medium"
                  onClick={() => setMobileOpen(false)}
                >
                  View All Products
                </Link>

                {cats.map((cat) => (
                  <div key={cat.id} className="mt-2">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>

                      {!!cat.subcategories?.length && (
                        <div className="flex items-center gap-2">
                          <Link
                            href={cat.href}
                            className="text-xs text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                            onClick={() => setMobileOpen(false)}
                          >
                            Visit
                          </Link>
                          <button
                            aria-label={`Toggle ${cat.name}`}
                            className="p-2 rounded hover:bg-gray-100"
                            onClick={() => toggleDropdown(cat.id)}
                          >
                            <svg className={`w-4 h-4 transition-transform ${openDropdowns[cat.id] ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {!!cat.subcategories?.length && openDropdowns[cat.id] && (
                      <div className="pl-4">
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            className="block px-4 py-1 text-xs text-gray-700 hover:bg-gray-100"
                            onClick={() => setMobileOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </li>

            {/* Quick Links (mobile) */}
            <li className="py-1">
              <Link href="/crm" className="block px-4 py-2 text-sm font-medium flex items-center" onClick={() => setMobileOpen(false)}>
                CRM
                <span className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">NEW</span>
              </Link>
            </li>
            <li className="py-1">
              <Link href="/admin/custom-catalog" className="block px-4 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Custom Catalog
              </Link>
            </li>
            <li className="py-1">
              <Link href="/quick-order" className="block px-4 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Quick Order
              </Link>
            </li>
            <li className="py-1">
              <Link href="/quotes" className="block px-4 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Quotes
              </Link>
            </li>
            <li className="py-1">
              <Link href="/art-proofs" className="block px-4 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Art Proofs
              </Link>
            </li>
            <li className="py-1">
              <Link href="/favorites" className="block px-4 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Favorites
              </Link>
            </li>
            <li className="py-1">
              <Link href="/account/orders" className="block px-4 py-2 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                Orders
              </Link>
            </li>
            <li className="py-1">
              <Link href="/custom-orders" className="block px-4 py-2 text-sm font-medium flex items-center" onClick={() => setMobileOpen(false)}>
                Order Tracking
                <span className="ml-2 bg-yellow-500 text-gray-900 text-xs px-1.5 py-0.5 rounded font-bold">NEW</span>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}